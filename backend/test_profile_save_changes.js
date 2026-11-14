const assert = require('assert');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { updateUserProfile } = require('./controllers/authController');

console.log('================================================================');
console.log('TEST SUITE: DENTAAI MY PROFILE SAVE CHANGES FUNCTIONALITY');
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

// Emulate Frontend Change Detection Logic
function computeChangeDetection(formData, initialData) {
  const currentName = (formData.name || '').trim();
  const currentPhone = (formData.phone || '').trim();
  const initialName = (initialData.name || '').trim();
  const initialPhone = (initialData.phone || '').trim();

  const isNameChanged = currentName !== initialName;
  const isPhoneChanged = currentPhone !== initialPhone;
  const isPasswordEntered = Boolean(formData.password && formData.password.length > 0);
  const isConfirmEntered = Boolean(formData.confirmPassword && formData.confirmPassword.length > 0);

  const isModified = isNameChanged || isPhoneChanged || isPasswordEntered || isConfirmEntered;

  let validationError = null;
  if (isPasswordEntered || isConfirmEntered) {
    if (!formData.password) {
      validationError = 'Please enter a new password.';
    } else if (!formData.confirmPassword) {
      validationError = 'Please confirm your new password.';
    } else if (formData.password !== formData.confirmPassword) {
      validationError = 'Passwords do not match. Please verify your new password.';
    } else if (formData.password.length < 6) {
      validationError = 'New password must be at least 6 characters long.';
    }
  }

  const payload = {};
  if (isNameChanged && currentName) payload.name = currentName;
  if (isPhoneChanged) payload.phone = currentPhone;
  if (isPasswordEntered && !validationError) payload.password = formData.password;

  return {
    isModified,
    isNameChanged,
    isPhoneChanged,
    isPasswordEntered,
    validationError,
    payload
  };
}

async function runAllTests() {
  // 1. Initial State: Open profile without making changes
  await runTest('1. Open profile without making changes (Button must be disabled initially)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto', phone: '+91 9876543210', password: '', confirmPassword: '' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, false, 'isModified should be false on initial load');
    assert.strictEqual(Object.keys(state.payload).length, 0, 'Payload must be empty');
  });

  // 2. Click Save Changes without editing
  await runTest('2. Click Save Changes without editing (No-change protection prevents request)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto', phone: '+91 9876543210', password: '', confirmPassword: '' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, false);
    // Simulating no-change protection
    const willSubmit = state.isModified && Object.keys(state.payload).length > 0;
    assert.strictEqual(willSubmit, false, 'Form submission should be blocked when unchanged');
  });

  // 3. Change the full name
  await runTest('3. Change the full name (Enables button and sends only name in payload)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto Updated', phone: '+91 9876543210', password: '', confirmPassword: '' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, true, 'isModified should be true');
    assert.strictEqual(state.payload.name, 'Joycil Britto Updated');
    assert.strictEqual(state.payload.phone, undefined, 'Unchanged phone must NOT be in payload');
    assert.strictEqual(state.payload.password, undefined, 'Empty password must NOT be in payload');
  });

  // 4. Change the phone number
  await runTest('4. Change the phone number (Enables button and sends only phone in payload)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto', phone: '+91 9999988888', password: '', confirmPassword: '' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, true, 'isModified should be true');
    assert.strictEqual(state.payload.name, undefined, 'Unchanged name must NOT be in payload');
    assert.strictEqual(state.payload.phone, '+91 9999988888');
    assert.strictEqual(state.payload.password, undefined);
  });

  // 5. Enter a new password with matching confirmation
  await runTest('5. Enter a new password with matching confirmation (Validates and includes password)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto', phone: '+91 9876543210', password: 'NewSecurePassword123', confirmPassword: 'NewSecurePassword123' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, true);
    assert.strictEqual(state.validationError, null, 'Validation error should be null');
    assert.strictEqual(state.payload.password, 'NewSecurePassword123');
  });

  // 6. Enter mismatched passwords
  await runTest('6. Enter mismatched passwords (Catches mismatch and prevents submission)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    const current = { name: 'Joycil Britto', phone: '+91 9876543210', password: 'Password123', confirmPassword: 'MismatchedPassword' };
    const state = computeChangeDetection(current, initial);

    assert.strictEqual(state.isModified, true);
    assert.strictEqual(state.validationError, 'Passwords do not match. Please verify your new password.');
    assert.strictEqual(state.payload.password, undefined, 'Invalid password should not be ready for payload');
  });

  // 7. Change a field and then restore its original value
  await runTest('7. Change a field and then restore its original value (Button disables again)', () => {
    const initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    
    // First edit
    let current = { name: 'Joycil Britto Edited', phone: '+91 9876543210', password: '', confirmPassword: '' };
    let state = computeChangeDetection(current, initial);
    assert.strictEqual(state.isModified, true, 'Should be modified when changed');

    // Restore to original (even with surrounding whitespace)
    current = { name: '  Joycil Britto  ', phone: '+91 9876543210', password: '', confirmPassword: '' };
    state = computeChangeDetection(current, initial);
    assert.strictEqual(state.isModified, false, 'Should be NOT modified when restored to original value');
  });

  // 8. Submit changes and reload the profile to verify persistence (Snapshot update)
  await runTest('8. Submit changes and reload snapshot (Snapshot resets and button disables)', () => {
    let initial = { name: 'Joycil Britto', phone: '+91 9876543210' };
    let current = { name: 'Joycil Britto New', phone: '+91 1111122222', password: 'NewPassword99', confirmPassword: 'NewPassword99' };
    
    let state = computeChangeDetection(current, initial);
    assert.strictEqual(state.isModified, true);

    // Simulate successful backend save
    const backendSavedData = { name: state.payload.name, phone: state.payload.phone };
    initial = { name: backendSavedData.name, phone: backendSavedData.phone };
    current = { name: backendSavedData.name, phone: backendSavedData.phone, password: '', confirmPassword: '' };

    const reloadedState = computeChangeDetection(current, initial);
    assert.strictEqual(reloadedState.isModified, false, 'Button must be disabled after successful save & snapshot sync');
    assert.strictEqual(current.password, '', 'Password fields must be cleared');
  });

  // 9. Backend Controller Tests
  await runTest('9. Backend: updateUserProfile rejects email or role tampering', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Patient',
      email: 'patient@example.com',
      phone: '1234567890',
      role: 'patient',
      save: async function () { return this; }
    };

    User.findById = async () => mockUser;

    // Test email tampering
    let resJson = null;
    let resStatus = 200;
    const reqEmail = {
      user: { _id: mockUser._id },
      body: { email: 'hacker@example.com' }
    };
    const resMockEmail = {
      status: (code) => { resStatus = code; return resMockEmail; },
      json: (data) => { resJson = data; }
    };
    await updateUserProfile(reqEmail, resMockEmail);
    assert.strictEqual(resStatus, 403, 'Should return 403 Forbidden for email alteration attempt');

    // Test role tampering
    resStatus = 200;
    const reqRole = {
      user: { _id: mockUser._id },
      body: { role: 'admin' }
    };
    await updateUserProfile(reqRole, resMockEmail);
    assert.strictEqual(resStatus, 403, 'Should return 403 Forbidden for role alteration attempt');
  });

  await runTest('10. Backend: updateUserProfile handles no-modifications gracefully', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Patient',
      email: 'patient@example.com',
      phone: '1234567890',
      role: 'patient',
      save: async function () { throw new Error('Save should not be called'); }
    };

    User.findById = async () => mockUser;

    let resJson = null;
    const req = {
      user: { _id: mockUser._id },
      body: { name: 'Test Patient', phone: '1234567890' } // same values
    };
    const res = {
      status: () => res,
      json: (data) => { resJson = data; }
    };

    await updateUserProfile(req, res);
    assert.strictEqual(resJson.message, 'No changes detected.');
  });

  console.log(`\n================================================================`);
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log(`================================================================\n`);
  
  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
