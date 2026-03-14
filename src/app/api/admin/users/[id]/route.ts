import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const db = openDb();
    const { id } = params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const db = openDb();
    const { id } = params;
    const { is_active } = await req.json();
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
