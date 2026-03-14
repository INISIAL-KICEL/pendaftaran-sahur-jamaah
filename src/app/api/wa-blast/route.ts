import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST() {
  try {
    const db = await openDb();
    const users = await db.all('SELECT phone_number, name FROM registrations WHERE is_taken = 0');

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jamaah yang belum mengambil sahur.' }, { status: 400 });
    }

    // Mock API Gateway integration
    const message = "Assalamu'alaikum, from Masjid Agung Ar-Rahman Pandeglang. Sahur meals are ready! Please come to the distribution point.";
    
    // Simulate sending messages
    const results = users.map(u => ({
      phone: u.phone_number,
      status: 'success',
      message: `Terkirim ke ${u.name}`
    }));

    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim blast ke ${users.length} jamaah yang belum mengambil sahur.`,
      details: results,
      content: message
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
