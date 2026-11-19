/** Cuenta de cliente que devuelve el registro en las pruebas de autenticación. */
export const customerAccount = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'cliente@example.com',
  fullName: 'Carla Cliente',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-10-11T00:00:00Z',
}

/** Respuesta 201 de POST /api/v1/auth/signup con el token indicado. */
export function signupReply(accessToken: string) {
  return { status: 201, body: { accessToken, tokenType: 'Bearer', expiresIn: 3600, user: customerAccount } }
}
