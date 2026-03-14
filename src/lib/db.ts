import Database from 'better-sqlite3';
import path from 'path';

let db: ReturnType<typeof Database> | null = null;

export function openDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  return db;
}

export function initDb() {
  const db = openDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      name TEXT,
      phone_number TEXT
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      email TEXT NOT NULL,
      is_taken BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      distance_meters REAL,
      jenis_kelamin TEXT NOT NULL,
      push_subscription TEXT,
      alamat TEXT NOT NULL DEFAULT '',
      added_by TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default times if they don't exist
  db.exec(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('open_time', '00:00');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('close_time', '23:59');
  `);

  // Migrate added columns to active DB natively safely
  const columnsToAdd = [
    { name: 'ip_address', type: 'TEXT' },
    { name: 'distance_meters', type: 'REAL' },
    { name: 'jenis_kelamin', type: 'TEXT NOT NULL DEFAULT "Laki-laki"' },
    { name: 'push_subscription', type: 'TEXT' },
    { name: 'alamat', type: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'added_by', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      db.prepare(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.type}`).run();
    } catch(e) { /* Column probably already exists */ }
  }

  return db;
}
