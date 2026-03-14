import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, phone_number, email, distance_meters, jenis_kelamin, alamat, push_subscription } = await req.json();
    
    // Get IP Address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip_address = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    const db = openDb();

    // Check System Open/Close Settings
    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as {key: string, value: string}[];
    const settings = settingsRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    const openTime = settings.open_time || "00:00";
    const closeTime = settings.close_time || "23:59";
    const now = new Date();
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutesTotal = openH * 60 + openM;
    const closeMinutesTotal = closeH * 60 + closeM;
    
    let isOpen = false;
    if (closeMinutesTotal < openMinutesTotal) {
      isOpen = currentMinutesTotal >= openMinutesTotal || currentMinutesTotal <= closeMinutesTotal;
    } else {
      isOpen = currentMinutesTotal >= openMinutesTotal && currentMinutesTotal <= closeMinutesTotal;
    }
    
    if (!isOpen) {
        return NextResponse.json({ error: 'Pendaftaran saat ini sedang ditutup.' }, { status: 403 });
    }

    // Limit to 3 records per IP per day
    const countRow = db.prepare(
      `SELECT COUNT(*) as count FROM registrations WHERE ip_address = ? AND DATE(created_at) = DATE('now', 'localtime')`
    ).get(ip_address) as {count: number};
    if (countRow.count >= 3) {
        return NextResponse.json({ error: 'Batas pendaftaran 3 orang per hari untuk perangkat/jaringan ini sudah tercapai. Coba kembali besok.' }, { status: 429 });
    }

    // Prevent Duplicates based on Name, Email, or Phone Number (today only)
    const duplicateCheck = db.prepare(
      `SELECT id FROM registrations WHERE (name = ? OR phone_number = ? OR email = ?) AND DATE(created_at) = DATE('now', 'localtime')`
    ).get(name, phone_number, email);
    if (duplicateCheck) {
        return NextResponse.json({ error: 'Nama, Nomor WhatsApp, atau Email sudah terdaftar hari ini.' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO registrations (name, phone_number, email, ip_address, distance_meters, jenis_kelamin, alamat, push_subscription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(name, phone_number, email, ip_address, distance_meters, jenis_kelamin, alamat, push_subscription || null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = openDb();
    const data = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
