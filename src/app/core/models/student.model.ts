export interface Student {
  id?: string; // ID de l'étudiant retourné par l'API
  student_id: number;
  student_uuid?: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  birthdate?: Date;
} 