import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const db = openDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 });
    }

    // Check if account is active (allow null for legacy accounts)
    if (user.is_active === 0) {
      return NextResponse.json({ error: 'Akun Anda telah dinonaktifkan. Hubungi Super Admin.' }, { status: 403 });
    }

    // Track last login time
    try {
      db.prepare("ALTER TABLE users ADD COLUMN last_login_at DATETIME").run();
    } catch {}
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
