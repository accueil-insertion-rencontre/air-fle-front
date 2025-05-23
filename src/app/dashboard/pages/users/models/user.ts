export interface User {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  birthdate?: string | null;
  nationality?: string;
  age?: number | string;
  isActive?: boolean;
  role_id?: string;
  role?: {
    id: string;
    rolename: string;
  };
  courses?: any[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
