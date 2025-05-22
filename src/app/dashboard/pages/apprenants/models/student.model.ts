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

export interface Student {
  id: number;
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