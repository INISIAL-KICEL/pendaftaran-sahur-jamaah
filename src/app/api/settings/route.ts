import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET() {
  try {
    const db = openDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as {key: string, value: string}[];
    
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { open_time, close_time } = await req.json();
    const db = openDb();

    if (open_time) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('open_time', ?)").run(open_time);
    }
    if (close_time) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('close_time', ?)").run(close_time);
    }

    return NextResponse.json({ success: true, message: 'Pengaturan waktu berhasil disimpan.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
