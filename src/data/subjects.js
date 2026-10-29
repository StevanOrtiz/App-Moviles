import CATALOG from './subjectsCatalog.js';

// Materias del Pomodoro, generadas desde el catálogo por área y carrera.
// El `id` (slug del nombre) se guarda en Firestore: no renombres materias ya publicadas.

// Nombres legibles de las claves del catálogo
const LABELS = {
  Ingenieria_y_Tecnologia: 'Ingeniería y Tecnología',
  Ciencias_Economicas_y_Administrativas: 'Ciencias Económicas y Administrativas',
  Ingenieria_de_Sistemas_y_Computacion: 'Ingeniería de Sistemas y Computación',
  Ingenieria_Industrial: 'Ingeniería Industrial',
  Administracion_de_Empresas: 'Administración de Empresas',
  Economia: 'Economía',
};

// Tonos de la paleta de la app por área (verdes para Ingeniería, ámbar para Económicas)
const AREA_TONES = {
  Ingenieria_y_Tecnologia: ['#00483F', '#2F7D5B', '#3FB06B'],
  Ciencias_Economicas_y_Administrativas: ['#B98A00', '#D9A400', '#8A6A00'],
};
const DEFAULT_TONES = ['#00483F', '#2F7D5B', '#B98A00'];

const ICON_RULES = [
  [/proyecto de grado/, 'school'],
  [/calculo|algebra|ecuaciones|matematicas/, 'calculator'],
  [/estadistica|econometria/, 'stats-chart'],
  [/programacion|algoritmos|estructuras|software|inteligencia|sistemas operativos|arquitectura/, 'code-slash'],
  [/redes|ciberseguridad|bases de datos/, 'server'],
  [/fisica|quimica/, 'flask'],
  [/finanzas|contabilidad|costos|presupuestos|ingenieria economica/, 'cash'],
  [/mercadeo|comercio/, 'megaphone'],
  [/administracion|gestion|direccion|talento|emprendimiento|logistica|operaciones|calidad|procesos|salud/, 'briefcase'],
  [/economia|economico|macroeconomia|microeconomia|politica/, 'trending-up'],
];

// "Cálculo II" -> "calculo ii"
export function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// "Cálculo II" -> "calculo-ii" (válido para las reglas: ^[a-z0-9-]{1,40}$)
export function slug(text) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const iconFor = (name) => {
  const n = normalize(name);
  const rule = ICON_RULES.find(([re]) => re.test(n));
  return rule ? rule[1] : 'book';
};

function build(catalog) {
  const areas = [];
  const careers = [];
  const byId = new Map();
  Object.entries(catalog.areas_conocimiento || {}).forEach(([areaKey, careerMap]) => {
    const areaId = slug(areaKey);
    areas.push({ id: areaId, name: LABELS[areaKey] || areaKey.replace(/_/g, ' ') });
    const tones = AREA_TONES[areaKey] || DEFAULT_TONES;
    Object.entries(careerMap).forEach(([careerKey, names]) => {
      const careerId = slug(careerKey);
      careers.push({ id: careerId, name: LABELS[careerKey] || careerKey.replace(/_/g, ' '), areaId });
      names.forEach((name) => {
        const id = slug(name);
        const existing = byId.get(id);
        if (existing) {
          if (!existing.careers.includes(careerId)) existing.careers.push(careerId);
          return;
        }
        const index = [...byId.values()].filter((s) => s.areaId === areaId).length;
        byId.set(id, {
          id,
          name,
          areaId,
          careers: [careerId],
          icon: iconFor(name),
          color: tones[index % tones.length],
        });
      });
    });
  });
  const subjects = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return { areas, careers, subjects };
}

const built = build(CATALOG);
export const AREAS = built.areas;
export const CAREERS = built.careers;
export const SUBJECTS = built.subjects;

export const NO_SUBJECT = { id: null, name: 'Sin materia', icon: 'book-outline', color: '#7C8581', areaId: null, careers: [] };

// Ids de la versión anterior (5 materias de ejemplo) -> ids del catálogo
export const LEGACY_IDS = {
  calculo: 'calculo-i',
  programacion: 'fundamentos-de-programacion',
  fisica: 'fisica-mecanica',
};
const LEGACY_ONLY = {
  ingles: { id: 'ingles', name: 'Inglés', icon: 'language', color: '#7C8581', areaId: null, careers: [] },
};

export const CUSTOM_PREFIX = 'custom-';
export const isCustomId = (id) => typeof id === 'string' && id.startsWith(CUSTOM_PREFIX);

// Materias personalizadas del usuario: { "custom-xxx": "Nombre" }. Las registra useSubjects().
let customNames = {};
export function registerCustomSubjects(map) {
  customNames = map || {};
}

const byId = new Map(SUBJECTS.map((s) => [s.id, s]));

// Id definitivo (traduce los ids antiguos)
export const resolveSubjectId = (id) => (id && LEGACY_IDS[id]) || id || null;

export function findSubject(id) {
  const resolved = resolveSubjectId(id);
  if (!resolved) return NO_SUBJECT;
  if (byId.has(resolved)) return byId.get(resolved);
  if (LEGACY_ONLY[resolved]) return LEGACY_ONLY[resolved];
  if (isCustomId(resolved)) {
    return {
      id: resolved,
      name: customNames[resolved] || 'Materia personalizada',
      icon: 'create',
      color: '#7C8581',
      areaId: null,
      careers: [],
      custom: true,
    };
  }
  return { ...NO_SUBJECT, id: resolved, name: resolved };
}

export const isSubjectId = (id) => byId.has(id);
export const findArea = (id) => AREAS.find((a) => a.id === id) || null;
export const findCareer = (id) => CAREERS.find((c) => c.id === id) || null;

const ROMAN = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv' };

// Busca por palabras, sin tildes; "calc 2" encuentra "Cálculo II".
// filter: { areaId?, careerId? }
export function searchSubjects(query, filter = {}, list = SUBJECTS) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  // Los números (2, ii, iii) deben coincidir exactos: "calculo 2" no trae "Cálculo III".
  // Una "i" sola se trata como texto ("i" encuentra "Inteligencia").
  const exact = (w) => ROMAN[w] || (['ii', 'iii', 'iv'].includes(w) ? w : null);
  const matches = (w, t) => (exact(w) ? t === exact(w) : t.startsWith(w));
  return list.filter((s) => {
    if (filter.areaId && s.areaId !== filter.areaId) return false;
    if (filter.careerId && !s.careers.includes(filter.careerId)) return false;
    if (words.length === 0) return true;
    const tokens = normalize(s.name).split(/\s+/);
    return words.every((w) => tokens.some((t) => matches(w, t)));
  });
}

// Id para una materia personalizada nueva
export function customSubjectId(name) {
  return `${CUSTOM_PREFIX}${slug(name).slice(0, 40 - CUSTOM_PREFIX.length)}`;
}
