// Core Models Barrel Export
export * from './user.model';
export * from './student.model';
export * from './course.model';
export * from './group.model';
export * from './session.model';
export * from './address.model';
export * from './reference-data.model';
export * from './exam.model';
export * from './student-progress.model';

// Re-export types pour faciliter l'usage
export type { User, UserDisplayInfo } from './user.model';
export type { Student, CreateStudentRequest, StudentFilters, StudentListConfig } from './student.model';
export type { Course, Schedule } from './course.model';
export type { Group, CreateGroupRequest } from './group.model';
export type { Session, CreateSessionRequest } from './session.model';
export type { Exam, CreateExamDto, UpdateExamDto, ExamApiResponse, ExamDisplayInfo } from './exam.model';
export type { 
  StudentProgress, 
  LearningPath, 
  ProgressMilestone, 
  ProgressSummary, 
  ProgressFilters, 
  ProgressSortOptions,
  CreateProgressTrackingRequest,
  UpdateProgressRequest 
} from './student-progress.model';

export type { Address, Country } from './address.model';
export type { 
  BaseReferenceItem, 
  FrenchLevel, 
  Gender, 
  ExitReason, 
  Orientation, 
  Status,
  Nationality,
  Financing, 
  Disability,
  Level,
  LEVELS,
  CreateNationalityDto,
  CreateFrenchLevelDto,
  CreateGenderDto,
  CreateExitReasonDto,
  CreateOrientationDto,
  CreateStatusDto,
  CreateFinancingDto,
  CreateDisabilityDto,
  ApiResponse,
  ReferenceDataConfig
} from './reference-data.model';

// Export ReferenceDataType comme valeur (enum)
export { ReferenceDataType } from './reference-data.model';
