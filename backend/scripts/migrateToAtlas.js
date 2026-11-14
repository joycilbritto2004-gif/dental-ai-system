const dns = require('dns');

// Fix Windows Node.js querySrv ECONNREFUSED by using public DNS (Google & Cloudflare)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in certain restricted environments
}

const mongoose = require('mongoose');

// Read-only source: Local MongoDB
const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai';

// Destination: Cloud MongoDB Atlas
const ATLAS_URI = process.env.ATLAS_MONGODB_URI || 'mongodb+srv://joycilbritto2004_db_user:393vk7yV1gaI7Uvj@cluster0.y9gv9jt.mongodb.net/dental_ai?retryWrites=true&w=majority';

const COLLECTIONS = [
  'users',
  'consultations',
  'scanhistories',
  'prescriptions',
  'notifications',
  'notificationlogs',
  'doctorslots',
  'messages'
];

async function migrate() {
  console.log('====================================================');
  console.log('  DentaAI: Migrate Local dental_ai to MongoDB Atlas ');
  console.log('====================================================\n');

  console.log('Connecting to Local MongoDB (READ-ONLY)...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to Local MongoDB.\n');

  console.log('Connecting to MongoDB Atlas (Destination)...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 20000
  }).asPromise();
  console.log('Connected to MongoDB Atlas.\n');

  console.log('Migrating collections...\n');

  let totalMigrated = 0;

  for (const colName of COLLECTIONS) {
    try {
      const localCol = localConn.collection(colName);
      const atlasCol = atlasConn.collection(colName);

      const docs = await localCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(`- ${colName.padEnd(20)}: 0 documents (empty)`);
        continue;
      }

      // Clear existing in Atlas collection before inserting to prevent duplicate _id conflicts
      await atlasCol.deleteMany({});
      await atlasCol.insertMany(docs, { ordered: false });

      totalMigrated += docs.length;
      console.log(`✔ ${colName.padEnd(20)}: ${docs.length} documents copied`);
    } catch (err) {
      console.error(`✖ Error copying ${colName}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`Migration Complete! Total documents copied: ${totalMigrated}`);
  console.log('====================================================');

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
