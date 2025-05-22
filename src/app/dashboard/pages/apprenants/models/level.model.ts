export interface Level {
  code: string;
  name: string;
  description: string;
  order: number;
}

export const LEVELS: Level[] = [
  { code: 'A1', name: 'Débutant', description: 'Niveau introductif ou découverte', order: 1 },
  { code: 'A2', name: 'Intermédiaire', description: 'Niveau intermédiaire ou de survie', order: 2 },
  { code: 'B1', name: 'Seuil', description: 'Niveau seuil', order: 3 },
  { code: 'B2', name: 'Avancé', description: 'Niveau avancé ou indépendant', order: 4 },
  { code: 'C1', name: 'Autonome', description: 'Niveau autonome', order: 5 },
  { code: 'C2', name: 'Maîtrise', description: 'Niveau maîtrise', order: 6 }
]; 