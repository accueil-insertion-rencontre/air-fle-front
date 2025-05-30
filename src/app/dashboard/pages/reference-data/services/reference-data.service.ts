import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  Nationality, FrenchLevel, Gender, ExitReason, Orientation, Status, Financing, Disability,
  CreateNationalityDto, CreateFrenchLevelDto, CreateGenderDto, CreateExitReasonDto,
  CreateOrientationDto, CreateStatusDto, CreateFinancingDto, CreateDisabilityDto,
  ApiResponse
} from '../models/reference-data.model';

@Injectable({
  providedIn: 'root'
})
export class ReferenceDataService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ===================
  // NATIONALITÉS
  // ===================
  getNationalities(): Observable<Nationality[]> {
    return this.http.get<ApiResponse<Nationality[]>>(`${this.apiUrl}/nationalities`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createNationality(data: CreateNationalityDto): Observable<Nationality> {
    return this.http.post<ApiResponse<Nationality>>(`${this.apiUrl}/nationalities`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateNationality(id: string, data: CreateNationalityDto): Observable<Nationality> {
    return this.http.put<ApiResponse<Nationality>>(`${this.apiUrl}/nationalities/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteNationality(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/nationalities/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // NIVEAUX DE FRANÇAIS
  // ===================
  getFrenchLevels(): Observable<FrenchLevel[]> {
    return this.http.get<ApiResponse<FrenchLevel[]>>(`${this.apiUrl}/french-levels`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createFrenchLevel(data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http.post<ApiResponse<FrenchLevel>>(`${this.apiUrl}/french-levels`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateFrenchLevel(id: string, data: CreateFrenchLevelDto): Observable<FrenchLevel> {
    return this.http.put<ApiResponse<FrenchLevel>>(`${this.apiUrl}/french-levels/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteFrenchLevel(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/french-levels/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // GENRES
  // ===================
  getGenders(): Observable<Gender[]> {
    return this.http.get<ApiResponse<Gender[]>>(`${this.apiUrl}/genders`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createGender(data: CreateGenderDto): Observable<Gender> {
    return this.http.post<ApiResponse<Gender>>(`${this.apiUrl}/genders`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateGender(id: string, data: CreateGenderDto): Observable<Gender> {
    return this.http.put<ApiResponse<Gender>>(`${this.apiUrl}/genders/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteGender(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/genders/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // RAISONS DE SORTIE
  // ===================
  getExitReasons(): Observable<ExitReason[]> {
    return this.http.get<ApiResponse<ExitReason[]>>(`${this.apiUrl}/exit-reasons`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createExitReason(data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http.post<ApiResponse<ExitReason>>(`${this.apiUrl}/exit-reasons`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateExitReason(id: string, data: CreateExitReasonDto): Observable<ExitReason> {
    return this.http.put<ApiResponse<ExitReason>>(`${this.apiUrl}/exit-reasons/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteExitReason(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/exit-reasons/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // ORIENTATIONS
  // ===================
  getOrientations(): Observable<Orientation[]> {
    return this.http.get<ApiResponse<Orientation[]>>(`${this.apiUrl}/orientations`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createOrientation(data: CreateOrientationDto): Observable<Orientation> {
    return this.http.post<ApiResponse<Orientation>>(`${this.apiUrl}/orientations`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateOrientation(id: string, data: CreateOrientationDto): Observable<Orientation> {
    return this.http.put<ApiResponse<Orientation>>(`${this.apiUrl}/orientations/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteOrientation(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/orientations/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // STATUTS
  // ===================
  getStatuses(): Observable<Status[]> {
    return this.http.get<ApiResponse<Status[]>>(`${this.apiUrl}/statuses`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createStatus(data: CreateStatusDto): Observable<Status> {
    return this.http.post<ApiResponse<Status>>(`${this.apiUrl}/statuses`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateStatus(id: string, data: CreateStatusDto): Observable<Status> {
    return this.http.put<ApiResponse<Status>>(`${this.apiUrl}/statuses/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteStatus(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/statuses/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // FINANCEMENTS
  // ===================
  getFinancings(): Observable<Financing[]> {
    return this.http.get<ApiResponse<Financing[]>>(`${this.apiUrl}/financings`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createFinancing(data: CreateFinancingDto): Observable<Financing> {
    return this.http.post<ApiResponse<Financing>>(`${this.apiUrl}/financings`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateFinancing(id: string, data: CreateFinancingDto): Observable<Financing> {
    return this.http.put<ApiResponse<Financing>>(`${this.apiUrl}/financings/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteFinancing(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/financings/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }

  // ===================
  // HANDICAPS
  // ===================
  getDisabilities(): Observable<Disability[]> {
    return this.http.get<ApiResponse<Disability[]>>(`${this.apiUrl}/disabilities`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  createDisability(data: CreateDisabilityDto): Observable<Disability> {
    return this.http.post<ApiResponse<Disability>>(`${this.apiUrl}/disabilities`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  updateDisability(id: string, data: CreateDisabilityDto): Observable<Disability> {
    return this.http.put<ApiResponse<Disability>>(`${this.apiUrl}/disabilities/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data)
    );
  }

  deleteDisability(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/disabilities/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => void 0)
    );
  }
} 