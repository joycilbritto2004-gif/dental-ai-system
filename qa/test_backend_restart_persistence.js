const axios = require('../backend/node_modules/axios');
const mongoose = require('../backend/node_modules/mongoose');
const FormData = require('../backend/node_modules/form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:5000/api';
const MONGO_URI = 'mongodb://127.0.0.1:27017/dental_ai';

const timestamp = Date.now();
const testEmail = `persistence_test_${timestamp}@example.com`;
const testPassword = 'Password123!';
const testName = `Persistence Test Patient ${timestamp}`;

let patientId = '';
let token = '';
let scanId = '';
let consultationId = '';
let messageId = '';

async function phase1CreateAndVerify() {
  console.log('=== PHASE 1: CREATE TEST RECORDS BEFORE RESTART ===\n');

  // 1. Register test patient
  console.log(`1. Registering patient: ${testEmail}...`);
  const regRes = await axios.post(`${API_URL}/auth/register`, {
    name: testName,
    email: testEmail,
    password: testPassword,
    role: 'patient',
    phone: '+919876500000'
  });
  patientId = regRes.data._id || regRes.data.id;
  token = regRes.data.token;
  console.log(`[PASS] Patient registered with ID: ${patientId}`);

  // 2. Upload dental scan for AI prediction
  console.log('2. Creating dental scan & report record...');
  const sampleJpg = path.join(__dirname, 'dummy_tooth.jpg');
  const formData = new FormData();
  formData.append('image', fs.createReadStream(sampleJpg));

  const predRes = await axios.post(`${API_URL}/ai/predict`, formData, {
    headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` }
  });

  // Persist scan result to MongoDB via /api/scans
  const saveScanRes = await axios.post(`${API_URL}/scans`, {
    condition: predRes.data.condition || 'Mouth_Ulcer',
    confidence: predRes.data.confidence || 95,
    recommendation: predRes.data.recommendation || 'Regular checkup recommended',
    scanId: `scan_persist_${timestamp}`,
    imagePath: predRes.data.image_url || 'test_image.jpg'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  scanId = saveScanRes.data._id || saveScanRes.data.id;
  console.log(`[PASS] Scan created with ID: ${scanId}, Condition: ${saveScanRes.data.condition}`);

  // 3. Create consultation
  console.log('3. Creating consultation record...');
  const consultRes = await axios.post(`${API_URL}/consultations`, {
    transactionId: `txn_persist_${timestamp}`,
    doctorId: '6a98f4a137bcdfb89255381c',
    doctorName: 'Dr. Priya Menon',
    patientId: patientId,
    patientName: testName,
    consultationType: 'Video Consultation',
    date: '2027-03-01',
    time: '14:00',
    fee: 500,
    totalAmount: 500,
    paymentStatus: 'Paid',
    status: 'Pending',
    message: 'Persistence check consultation concern',
    scanId: scanId
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  consultationId = consultRes.data.id || consultRes.data._id;
  console.log(`[PASS] Consultation created with ID: ${consultationId}`);

  // 4. Send a message
  console.log('4. Creating message record...');
  const msgRes = await axios.post(`${API_URL}/messages`, {
    consultationId: consultationId,
    receiverId: '6a98f4a137bcdfb89255381c',
    sender: 'patient',
    time: '02:00 PM',
    message: 'Hello, this is a persistence verification message.'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  messageId = msgRes.data.id || msgRes.data._id;
  console.log(`[PASS] Message created with ID: ${messageId}`);

  // 5. Direct MongoDB verification before restart
  console.log('\n5. Verifying direct MongoDB persistence before restart...');
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const dbUser = await conn.collection('users').findOne({ email: testEmail });
  const dbScan = await conn.collection('scanhistories').findOne({ _id: new mongoose.Types.ObjectId(scanId) });
  const dbConsult = await conn.collection('consultations').findOne({ _id: new mongoose.Types.ObjectId(consultationId) });
  const dbMsg = await conn.collection('messages').findOne({ _id: new mongoose.Types.ObjectId(messageId) });
  await conn.close();

  if (!dbUser || !dbScan || !dbConsult || !dbMsg) {
    throw new Error('Initial DB verification failed! One or more records missing before restart.');
  }

  console.log('[PASS] Pre-restart MongoDB verification confirmed for all 4 entities:');
  console.log(`  - User: ${dbUser.email} (Role: ${dbUser.role})`);
  console.log(`  - Scan: ${dbScan.condition} (Confidence: ${dbScan.confidence}%)`);
  console.log(`  - Consultation: ID ${dbConsult._id} (Status: ${dbConsult.status}, Payment: ${dbConsult.paymentStatus})`);
  console.log(`  - Message: "${dbMsg.message}"`);

  // Save metadata to file for phase 2 post-restart verification
  const metaPath = path.join(__dirname, 'persist_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    testEmail,
    testPassword,
    testName,
    patientId,
    scanId,
    consultationId,
    messageId,
    timestamp
  }, null, 2));

  console.log(`\nMetadata saved to ${metaPath}. Ready for backend restart.`);
}

async function phase2VerifyAfterRestart() {
  console.log('\n=== PHASE 2: VERIFY PERSISTENCE AFTER BACKEND RESTART ===\n');

  const metaPath = path.join(__dirname, 'persist_meta.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error('Metadata file not found! Run phase 1 first.');
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  // 1. Re-login with test patient after restart
  console.log(`1. Logging in as patient: ${meta.testEmail} after backend restart...`);
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: meta.testEmail,
    password: meta.testPassword,
    loginRole: 'patient'
  });
  const newToken = loginRes.data.token;
  console.log(`[PASS] Re-login successful! Received JWT token. User name: "${loginRes.data.name}"`);

  // 2. Fetch profile
  console.log('2. Fetching patient profile via GET /api/auth/profile...');
  const profRes = await axios.get(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  if (profRes.data.email !== meta.testEmail) {
    throw new Error('Profile email mismatch post-restart');
  }
  console.log(`[PASS] Profile data fully preserved: ${profRes.data.name} (${profRes.data.email})`);

  // 3. Fetch scan history
  console.log(`3. Fetching scans via GET /api/scans/${meta.patientId}...`);
  const scansRes = await axios.get(`${API_URL}/scans/${meta.patientId}`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const foundScan = scansRes.data.find(s => (s.id || s._id) === meta.scanId);
  if (!foundScan) {
    throw new Error(`Scan ${meta.scanId} not found in patient history post-restart!`);
  }
  console.log(`[PASS] Scan history preserved: Condition=${foundScan.condition}, Confidence=${foundScan.confidence}%`);

  // 4. Fetch consultation records
  console.log('4. Fetching consultations via GET /api/consultations...');
  const consultsRes = await axios.get(`${API_URL}/consultations`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const foundConsult = consultsRes.data.find(c => (c.id || c._id) === meta.consultationId);
  if (!foundConsult) {
    throw new Error(`Consultation ${meta.consultationId} not found post-restart!`);
  }
  console.log(`[PASS] Consultation preserved: Status=${foundConsult.status}, Payment=${foundConsult.paymentStatus}, Doctor=${foundConsult.doctorName}`);

  // 5. Fetch message history
  console.log(`5. Fetching messages via GET /api/messages/${meta.consultationId}...`);
  const msgsRes = await axios.get(`${API_URL}/messages/${meta.consultationId}`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const foundMsg = msgsRes.data.find(m => (m.id || m._id) === meta.messageId);
  if (!foundMsg) {
    throw new Error(`Message ${meta.messageId} not found post-restart!`);
  }
  console.log(`[PASS] Message history preserved: "${foundMsg.message}"`);

  // 6. Direct MongoDB validation post-restart
  console.log('\n6. Cross-checking direct MongoDB collection counts post-restart...');
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  const dbUser = await conn.collection('users').findOne({ email: meta.testEmail });
  const dbScan = await conn.collection('scanhistories').findOne({ _id: new mongoose.Types.ObjectId(meta.scanId) });
  const dbConsult = await conn.collection('consultations').findOne({ _id: new mongoose.Types.ObjectId(meta.consultationId) });
  const dbMsg = await conn.collection('messages').findOne({ _id: new mongoose.Types.ObjectId(meta.messageId) });

  if (!dbUser || !dbScan || !dbConsult || !dbMsg) {
    await conn.close();
    throw new Error('Direct DB cross-check failed! One or more records missing in MongoDB.');
  }
  console.log('[PASS] Direct MongoDB collection validation confirmed across all 4 collections.');

  // Clean up isolated test data safely
  console.log('\n7. Cleaning up isolated test patient records...');
  await conn.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(meta.patientId) });
  await conn.collection('scanhistories').deleteOne({ _id: new mongoose.Types.ObjectId(meta.scanId) });
  await conn.collection('consultations').deleteOne({ _id: new mongoose.Types.ObjectId(meta.consultationId) });
  await conn.collection('messages').deleteOne({ _id: new mongoose.Types.ObjectId(meta.messageId) });
  await conn.collection('notifications').deleteMany({ recipientId: meta.patientId });
  await conn.close();

  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
  }

  console.log('[PASS] Isolated test records safely cleaned up. Existing database records untouched.');
  console.log('\n======================================================');
  console.log('VERDICT: DATABASE PERSISTENCE AFTER BACKEND RESTART: PASS');
  console.log('======================================================');
}

const mode = process.argv[2] || 'phase1';
if (mode === 'phase1') {
  phase1CreateAndVerify()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[FAIL] Phase 1 Error:', err.response?.data || err.message);
      process.exit(1);
    });
} else if (mode === 'phase2') {
  phase2VerifyAfterRestart()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[FAIL] Phase 2 Error:', err.response?.data || err.message);
      process.exit(1);
    });
}
