import { Group } from './group.model';

export interface Session {
  session_id: number | string;
  id?: string;  // ID au format UUID utilisé par l'API
  label: string;
  description?: string;
  started_at?: Date | string;
  finished_at?: Date | string;
  external_id?: string;
  sessionId?: number | string;
  startedAt?: string;
  finishedAt?: string;
  externalId?: string;
  groups?: Group[];
} 