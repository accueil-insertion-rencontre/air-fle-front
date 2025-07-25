// Exam models based on the API structure
export interface Exam {
  exam_uuid: string;
  exam_label: string;
  exam_taked_at: Date | string;
  exam_score?: string | null;
  student_uuid: string;
  student?: {
    student_uuid: string;
    student_firstname: string;
    student_lastname: string;
    student_mail?: string;
  };
}

// DTO for creating a new exam
export interface CreateExamDto {
  exam_label: string;
  exam_taked_at: Date | string;
  exam_score?: string | null;
  student_uuid: string;
}

// DTO for updating an exam
export interface UpdateExamDto {
  exam_label?: string;
  exam_taked_at?: Date | string;
  exam_score?: string | null;
  student_uuid?: string;
}

// Response interface for API calls
export interface ExamApiResponse {
  data: Exam[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

// Display interface for the UI
export interface ExamDisplayInfo {
  id: string;
  label: string;
  date: string;
  score?: string;
  studentName: string;
  studentEmail?: string;
} 