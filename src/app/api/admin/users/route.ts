import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

function ensureAdminColumns(db: ReturnType<typeof import('@/lib/db').openDb>) {
  // Add is_active column if missing
  try { db.prepare('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1').run(); } catch {}
  // Add last_login_at column if missing
  try { db.prepare('ALTER TABLE users ADD COLUMN last_login_at DATETIME').run(); } catch {}
}

export async function POST(req: Request) {
  try {
    const { email, password, name, phone_number, role } = await req.json();
    const db = openDb();
    ensureAdminColumns(db);

    // Check if email already exists
    const existingUser = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (existingUser) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare('INSERT INTO users (email, password, role, name, phone_number, is_active) VALUES (?, ?, ?, ?, ?, 1)');
    const result = stmt.run(email, hashedPassword, role, name, phone_number);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = openDb();
    ensureAdminColumns(db);
    const data = db.prepare('SELECT id, email, role, name, phone_number, is_active, last_login_at FROM users ORDER BY id DESC').all();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
