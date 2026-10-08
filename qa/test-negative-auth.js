const randomId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Running Negative Security Tests ---');
  let passed = 0;
  let failed = 0;
  
  // Login to get tokens
  const patientRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@test.com', password: 'password123' })
  });
  const patientData = await patientRes.json();
  const patientToken = patientData.token;
  const patientId = patientData._id;

  const patient2Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john@example.com', password: 'password123' }) // Assuming john is another patient
  });
  let patient2Token = null;
  let patient2Id = randomId();
  if (patient2Res.ok) {
     const p2Data = await patient2Res.json();
     patient2Token = p2Data.token;
     patient2Id = p2Data._id;
  }

  const doctorRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.menon@dentaai.com', password: 'password123' })
  });
  const doctorData = await doctorRes.json();
  const doctorToken = doctorData.token;

  function assertStatus(res, expected, name) {
    if (res.status === expected) {
      console.log(`✅ PASS: ${name} (Status ${res.status})`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} (Expected ${expected}, got ${res.status})`);
      failed++;
    }
  }

  // 1. No JWT -> 401
  const noJwtRes = await fetch(`${BASE_URL}/consultations`);
  assertStatus(noJwtRes, 401, 'No JWT');

  // 2. Invalid JWT -> 401
  const invJwtRes = await fetch(`${BASE_URL}/consultations`, {
    headers: { 'Authorization': 'Bearer invalidtoken123' }
  });
  assertStatus(invJwtRes, 401, 'Invalid JWT');

  // 3. Patient cannot perform doctor-only action
  // Try accepting a consultation as patient
  const mockConsultationId = randomId();
  const patDocActionRes = await fetch(`${BASE_URL}/consultations/${mockConsultationId}/accept`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  assertStatus(patDocActionRes, 403, 'Patient cannot perform doctor-only action (403)');

  // 4. Doctor cannot perform admin-only action
  const docAdminActionRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  assertStatus(docAdminActionRes, 403, 'Doctor cannot perform admin-only action (403)');

  // 5. Authenticated patient cannot access another patient's protected data
  const patOtherDataRes = await fetch(`${BASE_URL}/scans/${patient2Id}`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  assertStatus(patOtherDataRes, 403, 'Patient cannot access another patient data (403)');

  // 6. Authenticated doctor cannot modify an unrelated doctor's consultation
  // Let's create a fake consultation owned by another doctor
  const docOtherRes = await fetch(`${BASE_URL}/consultations/${mockConsultationId}/accept`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  // Since it doesn't exist, it might return 404. Let's create one first.
  const createConsultRes = await fetch(`${BASE_URL}/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
    body: JSON.stringify({ 
      doctorId: randomId(), 
      scanId: randomId(),
      doctorName: 'Test Doctor',
      transactionId: 'txn_123',
      fee: 50,
      paymentStatus: 'Completed'
    })
  });
  const newConsult = await createConsultRes.json();
  if (!newConsult._id) {
    console.error("Failed to create consultation:", newConsult);
  }
  
  const docModifyOtherRes = await fetch(`${BASE_URL}/consultations/${newConsult._id}/accept`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  assertStatus(docModifyOtherRes, 403, 'Doctor cannot modify unrelated doctor consultation (403)');

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runTests().catch(console.error);
