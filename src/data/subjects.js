// Materias disponibles para el Pomodoro. El `id` se guarda en Firestore: no lo cambies una vez publicado.
// TODO: reemplazar por la lista real de materias.
export const SUBJECTS = [
  { id: 'calculo', name: 'Cálculo', icon: 'calculator', color: '#3B82F6' },
  { id: 'programacion', name: 'Programación', icon: 'code-slash', color: '#8B5CF6' },
  { id: 'fisica', name: 'Física', icon: 'planet', color: '#F97316' },
  { id: 'ingles', name: 'Inglés', icon: 'language', color: '#EC4899' },
  { id: 'bases-de-datos', name: 'Bases de datos', icon: 'server', color: '#14B8A6' },
];

export const NO_SUBJECT = { id: null, name: 'Sin materia', icon: 'book', color: '#7C8581' };

export const findSubject = (id) => SUBJECTS.find((s) => s.id === id) || NO_SUBJECT;
export const isSubjectId = (id) => SUBJECTS.some((s) => s.id === id);
