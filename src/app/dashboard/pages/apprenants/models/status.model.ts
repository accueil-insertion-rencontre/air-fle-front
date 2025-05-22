export interface Status {
  code: string;
  name: string;
  description: string;
  color: string;
}

export const STATUSES: Status[] = [
  { 
    code: 'ACTIVE',
    name: 'Actif',
    description: 'Étudiant actuellement en formation',
    color: '#28a745'
  },
  { 
    code: 'PENDING',
    name: 'En attente',
    description: 'Inscription en cours de validation',
    color: '#ffc107'
  },
  { 
    code: 'SUSPENDED',
    name: 'Suspendu',
    description: 'Formation temporairement suspendue',
    color: '#dc3545'
  },
  { 
    code: 'COMPLETED',
    name: 'Terminé',
    description: 'Formation terminée avec succès',
    color: '#17a2b8'
  },
  { 
    code: 'DROPPED',
    name: 'Abandonné',
    description: 'Formation abandonnée',
    color: '#6c757d'
  }
]; 