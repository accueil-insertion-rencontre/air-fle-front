import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { ReferenceDataService, ReferenceData } from '../../services/reference-data.service';
import * as XLSX from 'xlsx';

interface ExcelData {
  [key: string]: any;
}

interface ColumnMapping {
  [excelColumn: string]: string; // Excel column name -> API field name
}

interface ImportResult {
  success: number;
  errors: string[];
  total: number;
}

@Component({
  selector: 'app-student-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-import.component.html',
  styleUrls: ['./student-import.component.scss']
})
export class StudentImportComponent implements OnInit {
  // États du composant
  currentStep = 1; // 1: Upload, 2: Mapping, 3: Preview, 4: Results
  isLoading = false;
  isDragOver = false;
  error: string | null = null;

  // Fichier et données
  selectedFile: File | null = null;
  excelData: ExcelData[] = [];
  excelColumns: string[] = [];
  
  // Mapping des colonnes
  columnMapping: ColumnMapping = {};
  
  // Données de référence
  referenceData: ReferenceData | null = null;
  
  // Résultats d'import
  importResult: ImportResult | null = null;

  // Champs disponibles pour le mapping (correspondant à votre API)
  availableFields = [
    { key: '', label: '-- Ignorer cette colonne --' },
    
    // INFORMATIONS PERSONNELLES OBLIGATOIRES
    { key: 'firstname', label: 'Prénom', required: true },
    { key: 'lastname', label: 'Nom', required: true },
    { key: 'birthdate', label: 'Date de naissance', required: true },
    
    // INFORMATIONS PERSONNELLES OPTIONNELLES
    { key: 'placeOfBirth', label: 'Lieu de naissance' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'date_test_initial', label: 'Date test initial' },
    { key: 'commentaire', label: 'Commentaire' },
    { key: 'date_entree_france', label: 'Date d\'entrée en France' },
    { key: 'date_titre_sejour', label: 'Date titre de séjour' },
    { key: 'date_cir', label: 'Date CIR' },
    
    // IDS OBLIGATOIRES
    { key: 'gender', label: 'Genre', required: true },
    { key: 'initial_level', label: 'Niveau d\'entrée (test positionnement)', required: true },
    { key: 'nationality', label: 'Nationalité', required: true },
    { key: 'financing', label: 'Financement', required: true },
    { key: 'status', label: 'Statut', required: true },
    
    // IDS OPTIONNELS
    { key: 'departure_level', label: 'Niveau de départ (rempli plus tard)' },
    { key: 'current_level', label: 'Niveau actuel en formation' },
    { key: 'orientation', label: 'Orientation' },
    { key: 'exit_reason', label: 'Raison de sortie' }
  ];

  constructor(
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  private loadReferenceData(): void {
    this.referenceDataService.getAllReferenceData().subscribe({
      next: (data) => {
        this.referenceData = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données de référence:', err);
      }
    });
  }

  // Gestion du drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File): void {
    // Vérifier le type de fichier
    if (!file.name.match(/\.(xlsx|xls|xltx|csv)$/i)) {
      this.error = 'Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx, .xls, .xltx) ou CSV.';
      return;
    }

    this.selectedFile = file;
    this.error = null;
    this.readExcelFile(file);
  }

  private readExcelFile(file: File): void {
    this.isLoading = true;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Prendre la première feuille
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          // La première ligne contient les en-têtes
          this.excelColumns = jsonData[0] as string[];
          
          // Les autres lignes contiennent les données
          this.excelData = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.some(cell => cell !== undefined && cell !== '')) {
              const rowObject: ExcelData = {};
              this.excelColumns.forEach((col, index) => {
                rowObject[col] = row[index] || '';
              });
              this.excelData.push(rowObject);
            }
          }
          
          // Initialiser le mapping automatique
          this.initializeAutoMapping();
          
          // Passer à l'étape de mapping
          this.currentStep = 2;
        } else {
          this.error = 'Le fichier Excel semble vide';
        }
        
        this.isLoading = false;
      } catch (error) {
        this.error = 'Erreur lors de la lecture du fichier Excel';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    };
    
    reader.onerror = () => {
      this.error = 'Erreur lors de la lecture du fichier';
      this.isLoading = false;
    };
    
    reader.readAsArrayBuffer(file);
  }

  private initializeAutoMapping(): void {
    // Tentative de mapping automatique basé sur les noms de colonnes
    this.columnMapping = {};
    
    this.excelColumns.forEach(col => {
      const colLower = col.toLowerCase().trim();
      
      // Mapping basé sur vos colonnes Excel exactes
      if (colLower === 'nom') {
        this.columnMapping[col] = 'lastname';
      } else if (colLower === 'prenom' || colLower === 'prénom') {
        this.columnMapping[col] = 'firstname';
      } else if (colLower === 'date de naissance') {
        this.columnMapping[col] = 'birthdate';
      } else if (colLower === 'email') {
        this.columnMapping[col] = 'email';
      } else if (colLower === 'genre') {
        this.columnMapping[col] = 'gender';
      } else if (colLower === 'nationalite' || colLower === 'nationalité') {
        this.columnMapping[col] = 'nationality';
      } else if (colLower === 'statut') {
        this.columnMapping[col] = 'status';
      } else if (colLower === 'financement') {
        this.columnMapping[col] = 'financing';
      } else if (colLower === 'niveau d\'entrée' || colLower === 'niveau entrée') {
        this.columnMapping[col] = 'initial_level';
      } else if (colLower === 'niveau de sortie' || colLower === 'niveau sortie') {
        this.columnMapping[col] = 'departure_level';
      } else if (colLower === 'formatrice' || colLower === 'orientation') {
        this.columnMapping[col] = 'orientation';
      } else if (colLower === 'raison de sortie') {
        this.columnMapping[col] = 'exit_reason';
      } else if (colLower === 'date test initial' || colLower === 'date premier cours') {
        this.columnMapping[col] = 'date_test_initial';
      } else if (colLower === 'date entree france' || colLower === 'date d\'entrée france') {
        this.columnMapping[col] = 'date_entree_france';
      } else if (colLower === 'commentaire') {
        this.columnMapping[col] = 'commentaire';
      } else if (colLower === 'age') {
        // L'âge peut être ignoré car on a la date de naissance
        this.columnMapping[col] = '';
      } else if (colLower === 'delais d\'attente' || colLower === 'delais') {
        // Peut être ignoré ou mappé vers commentaire
        this.columnMapping[col] = '';
      } else {
        // Par défaut, ignorer les colonnes non reconnues
        this.columnMapping[col] = '';
      }
    });
  }

  // Navigation entre les étapes
  goToPreview(): void {
    // Vérifier que tous les champs obligatoires sont mappés
    const requiredFields = this.availableFields.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(this.columnMapping).filter(v => v !== '');
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      this.error = `Champs obligatoires manquants: ${missingFields.join(', ')}`;
      return;
    }
    
    this.error = null;
    this.currentStep = 3;
  }

  goBackToMapping(): void {
    this.currentStep = 2;
    this.error = null;
  }

  // Import des données
  importStudents(): void {
    this.isLoading = true;
    this.error = null;

    // Traitement séquentiel pour éviter les problèmes
    this.processAllRows().then(() => {
      this.currentStep = 4;
      this.isLoading = false;
    }).catch(error => {
      console.error('Erreur lors de l\'import:', error);
      this.error = 'Erreur générale lors de l\'import: ' + (error?.message || error);
      this.isLoading = false;
    });
  }

  private async processAllRows(): Promise<void> {
    const results: ImportResult = {
      success: 0,
      errors: [],
      total: this.excelData.length
    };

    for (let i = 0; i < this.excelData.length; i++) {
      try {
        await this.processRow(this.excelData[i]);
        results.success++;
      } catch (error: any) {
        console.error(`Erreur ligne ${i + 1}:`, error);
        results.errors.push(typeof error === 'string' ? error : (error?.message || `Erreur ligne ${i + 1}`));
      }
    }

    this.importResult = results;
  }

  private async processRow(row: ExcelData): Promise<void> {
    try {
      const studentData = this.mapRowToStudent(row);
      
      // Utiliser une approche plus robuste
      return new Promise<void>((resolve, reject) => {
        this.studentService.createStudent(studentData).subscribe({
          next: (response) => {
            resolve();
          },
          error: (error) => {
            const firstName = row[this.getExcelColumnForField('firstname')] || '';
            const lastName = row[this.getExcelColumnForField('lastname')] || '';
            
            // Extraire le message d'erreur correctement
            let errorMessage = 'Erreur inconnue';
            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else if (error?.error) {
              errorMessage = JSON.stringify(error.error);
            }
            
            reject(`${firstName} ${lastName}: ${errorMessage}`);
          }
        });
      });
    } catch (error: any) {
      const firstName = row[this.getExcelColumnForField('firstname')] || '';
      const lastName = row[this.getExcelColumnForField('lastname')] || '';
      throw `${firstName} ${lastName}: ${error?.message || error}`;
    }
  }

  private mapRowToStudent(row: ExcelData): any {
    const studentData: any = {};
    
    Object.entries(this.columnMapping).forEach(([excelCol, apiField]) => {
      if (apiField && row[excelCol] !== undefined) {
        if (apiField === 'birthdate' || apiField === 'date_test_initial' || apiField === 'date_entree_france' || apiField === 'date_titre_sejour' || apiField === 'date_cir') {
          // Gérer les dates - les convertir en format YYYY-MM-DD
          const dateValue = this.parseDate(row[excelCol]);
          if (dateValue) {
            studentData[apiField] = dateValue;
          }
        } else if (['gender', 'nationality', 'initial_level', 'financing', 'status', 'orientation', 'exit_reason', 'departure_level', 'current_level'].includes(apiField)) {
          // Résoudre les IDs depuis les données de référence - ajouter _id à la fin
          const referenceId = this.findReferenceId(apiField, row[excelCol]);
          if (referenceId) {
            studentData[apiField + '_id'] = referenceId;
          } else {
            console.warn(`ID non trouvé pour ${apiField}: "${row[excelCol]}" (ligne: ${row})`);
          }
        } else {
          // Champs directs (firstname, lastname, email, etc.)
          if (row[excelCol]) {
            studentData[apiField] = row[excelCol];
          }
        }
      }
    });
    
    // Vérifier que tous les champs obligatoires sont présents
    const requiredFields = ['gender_id', 'initial_level_id', 'nationality_id', 'financing_id', 'status_id'];
    const missingRequired = requiredFields.filter(field => !studentData[field]);
    
    if (missingRequired.length > 0) {
      console.error(`Champs obligatoires manquants pour ${studentData.firstname} ${studentData.lastname}:`, missingRequired);
      console.error('Données disponibles:', studentData);
    }
    
    return studentData;
  }

  private parseDate(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      let date: Date;
      
      if (typeof dateValue === 'number') {
        // Date Excel (nombre de jours depuis 1900)
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        date = new Date(dateValue);
      }
      
      // Retourner au format YYYY-MM-DD au lieu d'ISO complet
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private findReferenceId(fieldType: string, label: string): string {
    if (!this.referenceData || !label) {
      console.warn(`findReferenceId: données manquantes - fieldType: ${fieldType}, label: "${label}", referenceData:`, !!this.referenceData);
      return '';
    }
    
    const typeMap: { [key: string]: keyof ReferenceData } = {
      'gender': 'genders',
      'nationality': 'nationalities',
      'initial_level': 'frenchLevels',
      'departure_level': 'frenchLevels',
      'current_level': 'frenchLevels',
      'financing': 'financings',
      'status': 'statuses',
      'orientation': 'orientations',
      'exit_reason': 'exitReasons'
    };
    
    const referenceType = typeMap[fieldType];
    if (!referenceType) {
      console.warn(`findReferenceId: type de référence non trouvé pour ${fieldType}`);
      return '';
    }
    
    const items = this.referenceData[referenceType];
    if (!items || items.length === 0) {
      console.warn(`findReferenceId: aucun élément trouvé pour le type ${referenceType}`);
      return '';
    }
    
    // Nettoyer le label de recherche
    const searchLabel = label.toString().trim().toLowerCase();
    
    const item = items.find(i => {
      // Essayer différentes propriétés selon le type d'objet
      const possibleValues = [];
      
      if ('label' in i && i.label) {
        possibleValues.push(i.label.toLowerCase());
      }
      if ('type' in i && (i as any).type) {
        possibleValues.push((i as any).type.toLowerCase());
      }
      if ('code' in i && (i as any).code) {
        possibleValues.push((i as any).code.toLowerCase());
      }
      if ('name' in i && (i as any).name) {
        possibleValues.push((i as any).name.toLowerCase());
      }
      
      return possibleValues.some(value => value === searchLabel);
    });
    
    if (!item) {
      console.warn(`findReferenceId: aucune correspondance trouvée pour "${label}" dans ${referenceType}`);
      console.warn('Valeurs disponibles:', items.map(i => {
        const values = [];
        if ('label' in i && i.label) values.push(i.label);
        if ('type' in i && (i as any).type) values.push((i as any).type);
        if ('code' in i && (i as any).code) values.push((i as any).code);
        if ('name' in i && (i as any).name) values.push((i as any).name);
        return values.join(' | ');
      }));
    }
    
    return item?.id || '';
  }

  // Utilitaires
  resetImport(): void {
    this.currentStep = 1;
    this.selectedFile = null;
    this.excelData = [];
    this.excelColumns = [];
    this.columnMapping = {};
    this.importResult = null;
    this.error = null;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }

  getPreviewData(): ExcelData[] {
    return this.excelData.slice(0, 5); // Afficher seulement les 5 premières lignes
  }

  // Méthodes publiques pour le template
  getObjectValues(obj: any): any[] {
    return Object.values(obj);
  }

  getExcelColumnForField(field: string): string {
    return Object.keys(this.columnMapping).find(col => this.columnMapping[col] === field) || '';
  }
} 