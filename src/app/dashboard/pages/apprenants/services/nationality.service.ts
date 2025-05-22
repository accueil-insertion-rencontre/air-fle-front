import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Nationality } from '../models/nationality.model';

@Injectable({
  providedIn: 'root'
})
export class NationalityService {
  private nationalities: Nationality[] = [
    { code: 'FR', name: 'Française', countryCode: 'FR' },
    { code: 'BE', name: 'Belge', countryCode: 'BE' },
    { code: 'CH', name: 'Suisse', countryCode: 'CH' },
    { code: 'CA', name: 'Canadienne', countryCode: 'CA' },
    { code: 'LU', name: 'Luxembourgeoise', countryCode: 'LU' },
    { code: 'MA', name: 'Marocaine', countryCode: 'MA' },
    { code: 'DZ', name: 'Algérienne', countryCode: 'DZ' },
    { code: 'TN', name: 'Tunisienne', countryCode: 'TN' },
    { code: 'SN', name: 'Sénégalaise', countryCode: 'SN' },
    { code: 'CI', name: 'Ivoirienne', countryCode: 'CI' }
  ];

  constructor() {}

  /**
   * Récupère la liste des nationalités
   */
  getNationalities(): Observable<Nationality[]> {
    return of(this.nationalities);
  }

  /**
   * Recherche des nationalités par nom
   */
  searchNationalities(query: string): Observable<Nationality[]> {
    return of(this.nationalities).pipe(
      map(nationalities => 
        nationalities.filter(nationality => 
          nationality.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  /**
   * Récupère une nationalité par son code
   */
  getNationalityByCode(code: string): Observable<Nationality | undefined> {
    return of(this.nationalities.find(n => n.code === code));
  }

  /**
   * Récupère une nationalité par son code pays
   */
  getNationalityByCountryCode(countryCode: string): Observable<Nationality | undefined> {
    return of(this.nationalities.find(n => n.countryCode === countryCode));
  }
} 