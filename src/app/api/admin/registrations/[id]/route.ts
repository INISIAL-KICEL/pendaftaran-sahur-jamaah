import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function isSuperAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return false;
  try {
    const verified = await jwtVerify(token, secretKey);
    return verified.payload.role === 'super_admin';
  } catch {
    return false;
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await isSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized: Akses ditolak.' }, { status: 401 });
  }

  try {
    const db = openDb();
    db.prepare('DELETE FROM registrations WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true, message: 'Data jamaah berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await isSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized: Akses ditolak.' }, { status: 401 });
  }

  try {
    const { name, phone_number, email, jenis_kelamin, alamat } = await req.json();
    
    if (!name || !phone_number || !email || !jenis_kelamin || !alamat) {
      return NextResponse.json({ error: 'Data pendaftaran tidak lengkap.' }, { status: 400 });
    }

    const db = openDb();
    
    const exists = db.prepare('SELECT id FROM registrations WHERE (email = ? OR phone_number = ? OR name = ?) AND id != ?').get(email, phone_number, name, params.id);
    if (exists) {
      return NextResponse.json({ error: 'Nama, Email, atau WhatsApp dicurigai menduplikat jamaah lain.' }, { status: 400 });
    }

    db.prepare(`
      UPDATE registrations 
      SET name = ?, phone_number = ?, email = ?, jenis_kelamin = ?, alamat = ? 
      WHERE id = ?
    `).run(name, phone_number, email, jenis_kelamin, alamat, params.id);

    return NextResponse.json({ success: true, message: 'Data jamaah berhasil diperbarui.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
