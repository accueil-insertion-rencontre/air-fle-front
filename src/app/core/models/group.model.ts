import { Session } from './session.model';
import { Student } from './student.model';
import { Course } from './course.model';

export interface Group {
  group_id: number | string;
  id?: string; // ID au format UUID utilisé par l'API
  label: string;
  session?: Session;
  session_id?: number | string;
  started_at?: Date | string;
  ended_at?: Date | string;
  more_info?: string;
  external_id?: string;
  sessionId?: number | string;
  startedAt?: string;
  endedAt?: string;
  moreInfo?: string;
  externalId?: string;
  students?: Student[];
  courses?: Course[];
} 