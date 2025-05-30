import { Routes } from '@angular/router';
import { ReferenceDataComponent } from './reference-data.component';
import { NationalitiesComponent } from './components/nationalities/nationalities.component';

export const REFERENCE_DATA_ROUTES: Routes = [
  {
    path: '',
    component: ReferenceDataComponent,
    children: [
      {
        path: 'nationalities',
        component: NationalitiesComponent
      },
      // TODO: Ajouter les autres composants quand ils seront créés
      // {
      //   path: 'french-levels',
      //   component: FrenchLevelsComponent
      // },
      // {
      //   path: 'genders',
      //   component: GendersComponent
      // },
      // etc...
    ]
  }
]; 