// Pruebas del catálogo de materias. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AREAS,
  CAREERS,
  SUBJECTS,
  customSubjectId,
  findSubject,
  registerCustomSubjects,
  resolveSubjectId,
  searchSubjects,
  slug,
} from '../src/data/subjects.js';

describe('catálogo', () => {
  test('2 áreas, 4 carreras y 54 materias únicas', () => {
    assert.equal(AREAS.length, 2);
    assert.equal(CAREERS.length, 4);
    assert.equal(SUBJECTS.length, 54);
  });

  test('los ids son únicos y válidos para las reglas de Firestore', () => {
    const ids = SUBJECTS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    ids.forEach((id) => assert.match(id, /^[a-z0-9-]{1,40}$/));
  });

  test('una materia compartida guarda todas sus carreras', () => {
    const calc = findSubject('calculo-i');
    assert.equal(calc.name, 'Cálculo I');
    assert.ok(calc.careers.length >= 2);
  });

  test('slug quita tildes y signos', () => {
    assert.equal(slug('Álgebra Lineal'), 'algebra-lineal');
    assert.equal(slug('Emprendimiento e Innovación'), 'emprendimiento-e-innovacion');
  });
});

describe('búsqueda', () => {
  test('ignora tildes y mayúsculas', () => {
    const names = searchSubjects('ALGEBRA').map((s) => s.name);
    assert.deepEqual(names, ['Álgebra Lineal']);
  });

  test('busca por palabras y números', () => {
    const names = searchSubjects('calc 2').map((s) => s.name);
    assert.deepEqual(names, ['Cálculo II']);
    assert.ok(searchSubjects('i').some((s) => s.name === 'Inteligencia Artificial'));
  });

  test('filtra por carrera y por área', () => {
    const sistemas = searchSubjects('', { careerId: 'ingenieria-de-sistemas-y-computacion' });
    assert.equal(sistemas.length, 20);
    const economicas = searchSubjects('', { areaId: 'ciencias-economicas-y-administrativas' });
    assert.ok(economicas.every((s) => s.areaId === 'ciencias-economicas-y-administrativas'));
  });

  test('sin resultados devuelve lista vacía', () => {
    assert.deepEqual(searchSubjects('zzz'), []);
  });
});

describe('ids antiguos y personalizadas', () => {
  test('las materias de ejemplo se mapean al catálogo', () => {
    assert.equal(resolveSubjectId('calculo'), 'calculo-i');
    assert.equal(findSubject('programacion').name, 'Fundamentos de Programación');
    assert.equal(findSubject('bases-de-datos').name, 'Bases de Datos');
    assert.equal(findSubject('ingles').name, 'Inglés');
  });

  test('las personalizadas usan el nombre registrado', () => {
    const id = customSubjectId('Francés Básico');
    assert.equal(id, 'custom-frances-basico');
    registerCustomSubjects({ [id]: 'Francés Básico' });
    assert.equal(findSubject(id).name, 'Francés Básico');
    assert.equal(findSubject(id).custom, true);
  });

  test('sin materia', () => {
    assert.equal(findSubject(null).name, 'Sin materia');
  });
});
