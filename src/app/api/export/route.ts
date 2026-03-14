import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const db = openDb();
    
    // Fetch all registrations sorted descending by timestamp
    const registrations = db.prepare('SELECT * FROM registrations ORDER BY created_at DESC').all() as any[];

    // Map to neat column names
    const exportData = registrations.map((r, index) => ({
      "No": index + 1,
      "Nama Lengkap": r.name,
      "Jenis Kelamin": r.jenis_kelamin,
      "Nomor WhatsApp": r.phone_number,
      "Alamat": r.alamat,
      "Email": r.email,
      "Waktu Mendaftar": new Date(r.created_at + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      "Jarak ke Masjid (m)": r.distance_meters ? Math.round(r.distance_meters) : '-',
      "IP Address": r.ip_address,
      "Status Pengambilan": r.is_taken ? 'Sudah Diambil' : 'Belum'
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data Pendaftaran");

    // Write buffer securely to Blob 
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="data-pendaftaran-sahur.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
