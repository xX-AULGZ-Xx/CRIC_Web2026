import prisma from './prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { UserSession, hasModuleAccess } from './auth-types'

export type { UserSession }
export { hasModuleAccess }

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'cric-fallback-secret-2026-secure-key-32chars-min'
)
const COOKIE_NAME = 'cric_admin_token'


export async function verifyUser(username: string, password: string): Promise<UserSession | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { username },
    })

    if (!user) return null

    // Support PHP password_hash (bcrypt $2y$ prefix converted to $2a$ for bcryptjs if necessary)
    const formattedHash = user.password.startsWith('$2y$')
      ? '$2a$' + user.password.slice(4)
      : user.password

    const isMatch = await bcrypt.compare(password, formattedHash)
    if (!isMatch) return null

    let allowedPages: string[] = []
    if (user.allowed_pages) {
      try {
        const parsed = JSON.parse(user.allowed_pages)
        if (Array.isArray(parsed)) allowedPages = parsed
      } catch {
        allowedPages = user.allowed_pages.split(',').map((s) => s.trim())
      }
    }

    return {
      id: user.id,
      username: user.username,
      role: (user.role as 'admin' | 'editor' | 'staff') || 'staff',
      email: user.email,
      allowed_pages: allowedPages,
    }
  } catch (error) {
    console.error('Error verifying user:', error)
    return null
  }
}

export async function createSession(user: UserSession): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    allowed_pages: user.allowed_pages,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  })

  return token
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as UserSession
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}


export async function logAudit(
  action: string,
  targetType: string,
  targetId?: number,
  details?: string
) {
  try {
    const session = await getSession()
    if (!session) return

    // Verify user exists to prevent foreign key errors
    const userExists = await prisma.users.findUnique({
      where: { id: session.id },
      select: { id: true },
    }).catch(() => null)

    if (!userExists) return

    await prisma.audit_logs.create({
      data: {
        user_id: session.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      },
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}
