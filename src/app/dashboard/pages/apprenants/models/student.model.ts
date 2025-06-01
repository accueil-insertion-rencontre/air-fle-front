import { Address } from './address.model';
import { Level } from './level.model';
import { Nationality } from './nationality.model';
import { Status } from './status.model';

export type { Level } from './level.model';
export type { Nationality } from './nationality.model';
export type { Status } from './status.model';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  phone: string;
}

export interface StatusHistoryEntry {
  date: Date;
  field: 'status' | 'level';
  oldValue: string;
  newValue: string;
  comment?: string;
}

// Interface pour les données réelles retournées par l'API
export interface ApiStudent {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  placeOfBirth?: string;
  commentaire?: string;
  date_test_initial?: string;
  date_entree_france?: string;
  date_titre_sejour?: string;
  date_cir?: string;
  
  // Relations avec objets complets
  gender?: {
    id: string;
    label: string;
  };
  nationality?: {
    id: string;
    label: string;
  };
  initialLevel?: {
    id: string;
    code: string;
    description: string;
  };
  currentLevel?: {
    id: string;
    code: string;
    description: string;
  } | null;
  status?: {
    id: string;
    label: string;
  };
  orientation?: {
    id: string;
    type: string;
    description: string;
  };
  
  // IDs de référence
  gender_id: string;
  nationality_id: string;
  initial_level_id: string;
  current_level_id?: string | null;
  status_id: string;
  orientation_id?: string;
  financing_id: string;
  exit_reason_id?: string | null;
  departure_level_id?: string | null;
  
  // Arrays
  addresses: any[];
  disabilities: any[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Interface originale pour compatibilité
export interface Student {
  id: string;
  personalInfo: PersonalInfo;
  address: Address;
  nationality: Nationality;
  level: Level;
  status: Status;
  statusHistory: StatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  level?: string;
  status?: string;
  nationality?: string;
}

export type StudentSortField = 
  | 'personalInfo.lastName'
  | 'personalInfo.firstName'
  | 'personalInfo.email'
  | 'level.code'
  | 'status.code';

export interface StudentSortConfig {
  field: StudentSortField;
  direction: 'asc' | 'desc';
}

export interface StudentListConfig {
  page: number;
  pageSize: number;
  sort?: StudentSortConfig;
  filters?: StudentFilters;
} 