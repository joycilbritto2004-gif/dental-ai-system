const BASE_URL = 'http://localhost:5000/api';

async function testLogin(email, password, loginRole, expectedStatus, testName) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, loginRole })
    });
    
    if (res.status === expectedStatus) {
      console.log(`✅ PASS: ${testName} (Status ${res.status})`);
      return true;
    } else {
      const data = await res.json().catch(() => ({}));
      console.error(`❌ FAIL: ${testName} (Expected ${expectedStatus}, got ${res.status}, message: ${data.message || 'none'})`);
      return false;
    }
  } catch (error) {
    console.error(`❌ FAIL: ${testName} (Network error: ${error.message})`);
    return false;
  }
}

async function runRoleLoginTests() {
  console.log('--- Running Role-Based Login Tests ---');
  let passed = 0;
  let failed = 0;

  const patientEmail = 'patient@test.com'; 
  const doctorEmail = 'priya.menon@dentaai.com';
  const adminEmail = 'admin@test.com'; 
  const password = 'password123'; 

  async function run(email, role, expectedStatus, name) {
    const success = await testLogin(email, password, role, expectedStatus, name);
    if (success) passed++;
    else failed++;
  }

  await run(patientEmail, 'patient', 200, '1. Patient credentials + Patient Login');
  await run(patientEmail, 'doctor', 403, '2. Patient credentials + Doctor Login');
  await run(patientEmail, 'admin', 403, '3. Patient credentials + Admin Login');

  await run(doctorEmail, 'doctor', 200, '4. Doctor credentials + Doctor Login');
  await run(doctorEmail, 'patient', 403, '5. Doctor credentials + Patient Login');
  await run(doctorEmail, 'admin', 403, '6. Doctor credentials + Admin Login');

  await run(adminEmail, 'admin', 200, '7. Admin credentials + Admin Login');
  await run(adminEmail, 'patient', 403, '8. Admin credentials + Patient Login');
  await run(adminEmail, 'doctor', 403, '9. Admin credentials + Doctor Login');

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

runRoleLoginTests().catch(console.error);
