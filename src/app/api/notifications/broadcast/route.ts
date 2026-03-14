import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import webpush from 'web-push';

// Configure Web Push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const db = openDb();
    
    // Get all valid push subscriptions
    const registrations = db.prepare('SELECT push_subscription FROM registrations WHERE push_subscription IS NOT NULL').all() as { push_subscription: string }[];
    
    let successCount = 0;
    let failCount = 0;

    const payload = JSON.stringify({
      title: title || 'Pesan dari Masjid Agung Ar-Rahman',
      body: body || 'Silakan cek pembaruan terbaru mengenai sahur.',
    });

    const sendPromises = registrations.map(async (reg) => {
      try {
        const sub = JSON.parse(reg.push_subscription);
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        // If gone (unsubscribed), we might want to cleanup the DB here.
        failCount++;
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil mengirim blast ke ${successCount} perangkat. Gagal: ${failCount}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
