import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const db = openDb();
    const url = new URL(req.url);
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const summary = url.searchParams.get('summary'); // '1' for daily aggregates

    if (summary === '1') {
      // Return daily aggregated counts for the chart
      const dailySummary = db.prepare(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 ELSE 0 END) as laki_laki,
          SUM(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 ELSE 0 END) as perempuan
        FROM registrations
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all();
      return NextResponse.json(dailySummary);
    }

    if (date) {
      // Return registrations for a specific date
      const data = db.prepare(
        `SELECT * FROM registrations WHERE DATE(created_at) = ? ORDER BY created_at DESC`
      ).all(date);
      return NextResponse.json(data);
    }

    // Return all registrations
    const data = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
