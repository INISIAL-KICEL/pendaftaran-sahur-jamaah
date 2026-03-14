import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
       return NextResponse.json({ error: 'Unauthorized: Harap login ulang.' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secretKey);
    const adminName = verified.payload.name as string || "Admin Sistem";

    const { name, phone_number, email, jenis_kelamin, alamat } = await req.json();

    if (!name || !phone_number || !email || !jenis_kelamin || !alamat) {
      return NextResponse.json({ error: 'Data pendaftaran tidak lengkap' }, { status: 400 });
    }

    const db = openDb();

    // Check duplicate logic (still block duplicates to ensure clean DBs)
    const existingUser = db.prepare('SELECT id FROM registrations WHERE email = ? OR phone_number = ? OR name = ?').get(email, phone_number, name);
    if (existingUser) {
      return NextResponse.json({ error: 'Jamaah dengan Nama, Email, atau Nomor WhatsApp tersebut sudah terdaftar.' }, { status: 400 });
    }

    // Insert Directly Bypassing IP, Geo, & Settings limits. Mapping `added_by`.
    const stmt = db.prepare(`
        INSERT INTO registrations 
        (name, phone_number, email, jenis_kelamin, alamat, added_by)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(name, phone_number, email, jenis_kelamin, alamat, adminName);

    return NextResponse.json({ success: true, message: 'Bypass sukses. Jamaah berhasil didaftarkan.' }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
