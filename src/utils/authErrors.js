const MESSAGES = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-email': 'Escribe tu correo.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a escribir tu contraseña.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo no está habilitado en Firebase.',
  unavailable: 'Sin conexión con el servidor. Inténtalo de nuevo.',
  'deadline-exceeded': 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  'resource-exhausted': 'Demasiadas solicitudes. Inténtalo más tarde.',
  'invalid-argument': 'Los datos enviados no son válidos.',
  // Firestore rechaza con este código cuando las reglas de seguridad no permiten la operación
  // (por ejemplo, si firestore.rules no se publicó en la consola de Firebase).
  'permission-denied':
    'Firebase no permitió guardar en tu cuenta. Si eres el desarrollador, publica las reglas de firestore.rules en la consola.',
};

export function getErrorMessage(error) {
  return MESSAGES[error?.code] || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

// Código técnico (por ejemplo "permission-denied"), útil para saber qué falló de verdad
export function getErrorCode(error) {
  return error?.code || 'desconocido';
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
