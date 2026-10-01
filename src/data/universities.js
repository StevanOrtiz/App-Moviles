// Universidades disponibles. El id es estable y se usa como id del documento
// en Firestore (universities/{id}); el nombre solo se muestra en pantalla.
export const UNIVERSITIES = [
  { id: 'independiente', name: 'Estudiante independiente' },
  { id: 'unicatolica', name: 'UNICATOLICA' },
  { id: 'univalle', name: 'Universidad del Valle' },
  { id: 'uao', name: 'Universidad Autónoma de Occidente' },
  { id: 'icesi', name: 'Universidad ICESI' },
  { id: 'usc', name: 'Universidad Santiago de Cali' },
  { id: 'unilibre', name: 'Universidad Libre' },
  { id: 'javeriana-cali', name: 'Universidad Javeriana Cali' },
  { id: 'ucc', name: 'Universidad Cooperativa de Colombia' },
];

export function findUniversity(id) {
  return UNIVERSITIES.find((u) => u.id === id) || null;
}

// Para migrar perfiles antiguos que guardaban el nombre en vez del id
export function findUniversityByName(name) {
  return UNIVERSITIES.find((u) => u.name === name) || null;
}
