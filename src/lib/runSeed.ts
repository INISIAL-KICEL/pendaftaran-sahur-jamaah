import { initDb } from './db';
import { createSuperAdmin } from './seed';

async function main() {
  console.log('Initializing Database...');
  await initDb();
  
  console.log('Creating Super Admin Setup...');
  // The username and password requested by USER
  await createSuperAdmin(
    'rifkiorangke2@gmail.com', 
    'masjid123', 
    'Admin', 
    '0895346038858'
  );
  
  console.log('Database Ready!');
}

main().catch(console.error);
