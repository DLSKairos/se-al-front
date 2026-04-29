import type { JWTPayload, UserRole } from '@/types'

function buildJWT(payload: JWTPayload): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const signature = 'test-signature'
  return `${header}.${body}.${signature}`
}

const futureExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24h desde ahora

export const jwtPayloads: Record<UserRole, JWTPayload> = {
  OPERATOR: {
    sub: 'user-operator-001',
    orgId: 'org-test-001',
    role: 'OPERATOR',
    jobTitle: 'Operador de campo',
    iat: Math.floor(Date.now() / 1000),
    exp: futureExp,
  },
  ADMIN: {
    sub: 'user-admin-001',
    orgId: 'org-test-001',
    role: 'ADMIN',
    jobTitle: 'Administrador',
    iat: Math.floor(Date.now() / 1000),
    exp: futureExp,
  },
  SUPER_ADMIN: {
    sub: 'user-super-001',
    orgId: 'org-test-001',
    role: 'SUPER_ADMIN',
    jobTitle: 'Super Administrador',
    iat: Math.floor(Date.now() / 1000),
    exp: futureExp,
  },
}

export const tokens: Record<UserRole, string> = {
  OPERATOR: buildJWT(jwtPayloads.OPERATOR),
  ADMIN: buildJWT(jwtPayloads.ADMIN),
  SUPER_ADMIN: buildJWT(jwtPayloads.SUPER_ADMIN),
}

export const loginResponses = {
  OPERATOR: { token: tokens.OPERATOR },
  ADMIN: { token: tokens.ADMIN },
  SUPER_ADMIN: { token: tokens.SUPER_ADMIN },
}
