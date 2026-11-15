const assert = require('assert');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_jwt_secret_dentaai_2026';

const User = require('./models/User');
const { registerUser, validatePasswordSecurity } = require('./controllers/authController');

console.log('================================================================');
console.log('TEST SUITE: DENTAAI REGISTRATION PASSWORD SECURITY & VALIDATION');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

async function runAllTests() {
  // Mock User.findOne and User.create to test controller logic cleanly
  let createdUser = null;
  User.findOne = async ({ email }) => null; // user does not exist yet
  User.find = async () => []; // return empty admin list so in-app notifications resolve immediately
  User.create = async (doc) => {
    createdUser = { _id: new mongoose.Types.ObjectId(), ...doc };
    return createdUser;
  };

  // Helper to call registerUser
  async function callRegister(body) {
    let statusCode = 200;
    let jsonResponse = null;
    const req = { body };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonResponse = data; }
    };
    await registerUser(req, res);
    return { statusCode, jsonResponse };
  }

  // 1. Patient Registration (Valid)
  await runTest('1. Patient Registration: Successfully registers with strong password', async () => {
    const res = await callRegister({
      name: 'John Patient',
      email: 'john.patient@example.com',
      password: 'DentalSecure@2026',
      phone: '+91 9876543210',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonResponse.name, 'John Patient');
    assert.strictEqual(res.jsonResponse.role, 'patient');
    assert.strictEqual(res.jsonResponse.verificationStatus, 'Approved');
  });

  // 2. Doctor Registration (Valid)
  await runTest('2. Doctor Registration: Successfully registers with strong password', async () => {
    const res = await callRegister({
      name: 'Dr. Jane Dentist',
      email: 'jane.dentist@example.com',
      password: 'ClinicMaster#2026',
      phone: '+91 9123456780',
      role: 'doctor'
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonResponse.name, 'Dr. Jane Dentist');
    assert.strictEqual(res.jsonResponse.role, 'doctor');
    assert.strictEqual(res.jsonResponse.verificationStatus, 'Pending', 'Doctors must register with Pending verification');
  });

  // 3. Password Validation: Length < 8
  await runTest('3. Password Validation: Rejects password under 8 characters', async () => {
    const res = await callRegister({
      name: 'Test User',
      email: 'short@example.com',
      password: 'Pass1!',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonResponse.message, 'Password must be at least 8 characters long.');
  });

  // 4. Password Validation: Missing Uppercase
  await runTest('4. Password Validation: Rejects password missing uppercase letter', async () => {
    const res = await callRegister({
      name: 'Test User',
      email: 'noupper@example.com',
      password: 'password123!',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonResponse.message, 'Password must contain at least one uppercase letter.');
  });

  // 5. Password Validation: Missing Lowercase
  await runTest('5. Password Validation: Rejects password missing lowercase letter', async () => {
    const res = await callRegister({
      name: 'Test User',
      email: 'nolower@example.com',
      password: 'PASSWORD123!',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonResponse.message, 'Password must contain at least one lowercase letter.');
  });

  // 6. Password Validation: Missing Number
  await runTest('6. Password Validation: Rejects password missing number', async () => {
    const res = await callRegister({
      name: 'Test User',
      email: 'nonum@example.com',
      password: 'Password!@#',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonResponse.message, 'Password must contain at least one number.');
  });

  // 7. Password Validation: Missing Symbol / Special Character
  await runTest('7. Password Validation: Rejects password missing special character / symbol', async () => {
    const res = await callRegister({
      name: 'Test User',
      email: 'nosymbol@example.com',
      password: 'Password123',
      role: 'patient'
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonResponse.message, 'Password must contain at least one special character or symbol.');
  });

  // 8. Admin registration blocked from public endpoint
  await runTest('8. Security Control: Rejects attempt to register as admin', async () => {
    const res = await callRegister({
      name: 'Hacker Admin',
      email: 'admin@hacker.com',
      password: 'StrongAdminPassword1!',
      role: 'admin'
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.jsonResponse.message, 'This account type cannot be self-registered');
  });

  // 9. Exact recommendation text check
  await runTest('9. Copy Consistency: Matches exact required recommendation string', () => {
    const expected = "Recommended: Use at least 8 characters with a mix of uppercase and lowercase letters, numbers, and symbols for maximum security.";
    const fs = require('fs');
    const registerContent = fs.readFileSync(__dirname + '/../frontend/src/pages/Register.jsx', 'utf8');
    assert(registerContent.includes(expected), 'Register.jsx must contain the exact recommendation message');
  });

  console.log(`\n================================================================`);
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log(`================================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
