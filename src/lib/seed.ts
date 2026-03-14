import { openDb } from './db';
import bcrypt from 'bcryptjs';

export async function createSuperAdmin(email: string, passwordPlain: string, name: string, phone: string) {
  const db = await openDb();
  const hashedPassword = bcrypt.hashSync(passwordPlain, 10);
  
  await db.run(
    'INSERT OR IGNORE INTO users (email, password, role, name, phone_number) VALUES (?, ?, ?, ?, ?)',
    [email, hashedPassword, 'super_admin', name, phone]
  );
  
  // If it existed but wasnt super admin, update it
  await db.run(
    'UPDATE users SET role = ?, name = ?, phone_number = ? WHERE email = ?',
    ['super_admin', name, phone, email]
  );
}
