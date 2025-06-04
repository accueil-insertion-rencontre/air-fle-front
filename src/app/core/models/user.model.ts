export interface User {
  id?: number | string;
  user_id?: number | string; // Pour compatibilité avec l'API
  firstname: string;
  lastname: string;
  email: string;
  role?: string;
  
  // Propriétés additionnelles utiles pour l'affichage
  birthdate?: string | null;
  isActive?: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Interface pour l'affichage simplifié dans les sélecteurs
export interface UserDisplayInfo {
  id: number | string;
  fullName: string;
  email: string;
  role?: string;
} 