import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { is_taken } = await req.json();
    const db = openDb();

    const stmt = db.prepare('UPDATE registrations SET is_taken = ? WHERE id = ?');
    stmt.run(is_taken ? 1 : 0, params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
