// Pruebas de los mensajes de error. Ejecutar con: npm run test:unit
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getErrorCode, getErrorMessage } from '../src/utils/authErrors.js';

describe('getErrorMessage', () => {
  test('permission-denied no se presenta como problema de conexión', () => {
    const message = getErrorMessage({ code: 'permission-denied' });
    assert.doesNotMatch(message, /conexión/i);
    assert.match(message, /firestore\.rules/);
  });

  test('unavailable sí es un problema de conexión', () => {
    assert.match(getErrorMessage({ code: 'unavailable' }), /conexión/i);
  });

  test('credenciales incorrectas', () => {
    assert.equal(
      getErrorMessage({ code: 'auth/invalid-credential' }),
      'Correo o contraseña incorrectos.'
    );
  });

  test('un código desconocido da un mensaje genérico sin culpar a la conexión', () => {
    const message = getErrorMessage({ code: 'algo-raro' });
    assert.match(message, /error inesperado/);
    assert.doesNotMatch(message, /conexión/i);
    assert.match(getErrorMessage(undefined), /error inesperado/);
  });
});

describe('getErrorCode', () => {
  test('devuelve el código o "desconocido"', () => {
    assert.equal(getErrorCode({ code: 'permission-denied' }), 'permission-denied');
    assert.equal(getErrorCode(new Error('x')), 'desconocido');
    assert.equal(getErrorCode(null), 'desconocido');
  });
});
