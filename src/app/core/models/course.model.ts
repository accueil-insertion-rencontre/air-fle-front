import { Group } from './group.model';
import { User } from './user.model';

export interface Course {
  course_id?: number | string;
  id?: number | string;
  session_id: number | string;
  group_id?: number | string; // ID du groupe (UUID dans l'API)
  day: string; // Format YYYY-MM-DD
  start_hour: string; // Format HH:MM
  end_hour: string; // Format HH:MM
  title: string; // Intitulé du cours
  user_id?: number | string; // ID du professeur assigné
  color?: string; // Couleur hexadécimale personnalisée (ex: #FF5733)
  
  // Relations
  session?: {
    session_id?: number | string;
    label?: string;
  };
  group?: {
    group_id?: number | string;
    label?: string;
  };
  user?: {
    user_id?: number | string;
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  groupId?: number;
  color?: string;
  allDay?: boolean;
  sessionId?: number;
  courseId?: number;
} 