const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const ScanHistory = require('./models/ScanHistory');
const Consultation = require('./models/Consultation');
const Notification = require('./models/Notification');
const DoctorSlot = require('./models/DoctorSlot');
const AuditLog = require('./models/AuditLog');

// Mock Notification, DoctorSlot, and AuditLog to avoid mongoose buffering timeouts when MongoDB daemon is offline
Notification.create = () => Promise.resolve({});
Notification.insertMany = () => Promise.resolve([]);
AuditLog.create = () => Promise.resolve({});
AuditLog.insertMany = () => Promise.resolve([]);
const Message = require('./models/Message');
DoctorSlot.findOne = () => Promise.resolve(null);
DoctorSlot.create = (doc) => Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...doc });
DoctorSlot.updateOne = () => Promise.resolve({ modifiedCount: 1 });
DoctorSlot.deleteOne = () => Promise.resolve({ deletedCount: 1 });
DoctorSlot.prototype.save = function () { return Promise.resolve(this); };
Consultation.findOne = () => Promise.resolve(null);
Message.find = () => ({ sort: () => Promise.resolve([]) });
Message.prototype.save = function () { return Promise.resolve(this); };

// Controllers & Routes
const { protect, restrictTo } = require('./middleware/authMiddleware');
const { getScanById, verifyScan, getPendingScans, getPatientScanHistory } = require('./controllers/scanHistoryController');
const { createConsultation, updateConsultation, acceptConsultation, rejectConsultation } = require('./controllers/consultationController');
const { getMessagesByConsultation, createMessage } = require('./controllers/messageController');
const { updateDoctorStatus, updateAccountStatus } = require('./controllers/adminController');
const slotManager = require('./utils/slotManager');

console.log('================================================================');
console.log('DENTAAI PHASE 5: COMPREHENSIVE SYSTEM VERIFICATION TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
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

(async () => {
  // Set test JWT secret if not configured
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_dental_ai_secret_key_2026';

  // ===========================================================================
  // SECTION 1: AUTHENTICATION & REGISTRATION
  // ===========================================================================
  console.log('\n--- SECTION 1: PATIENT & DOCTOR AUTHENTICATION ---');

  runTest('1.1 User schema password hashing and verification', () => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);
    assert(bcrypt.compareSync('Password123!', hash), 'Password match failed');
    assert(!bcrypt.compareSync('WrongPassword', hash), 'Wrong password must not match');
  });

  runTest('1.2 JWT Token generation and verification', () => {
    const userId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.strictEqual(decoded.id, userId.toString());
  });

  runTest('1.3 Role restrictions middleware (protect & restrictTo)', () => {
    const middleware = restrictTo('doctor', 'admin');
    let calledNext = false;
    const reqPatient = { user: { role: 'patient' } };
    const resPatient = {
      status: (code) => {
        assert.strictEqual(code, 403);
        return { json: (d) => assert(d.message) };
      }
    };
    middleware(reqPatient, resPatient, () => { calledNext = true; });
    assert.strictEqual(calledNext, false, 'Patient must be rejected');

    let docNext = false;
    const reqDoc = { user: { role: 'doctor' } };
    middleware(reqDoc, {}, () => { docNext = true; });
    assert.strictEqual(docNext, true, 'Doctor must be accepted');
  });

  // ===========================================================================
  // SECTION 2: DOCTOR APPROVAL RESTRICTIONS
  // ===========================================================================
  console.log('\n--- SECTION 2: DOCTOR APPROVAL & ACCESS RESTRICTIONS ---');

  runTest('2.1 Doctor pending status defaults in User schema', () => {
    const docUser = new User({
      name: 'Dr. Jane Smith',
      email: 'dr.jane@example.com',
      password: 'hash',
      role: 'doctor'
    });
    assert.strictEqual(docUser.verificationStatus, 'Pending');
    assert.strictEqual(docUser.accountStatus, 'Active');
  });

  await runAsyncTest('2.2 Doctor verification API rejects unapproved doctor (403)', async () => {
    const req = {
      params: { id: 'SCAN-001' },
      body: { finalDiagnosis: 'Caries' },
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'doctor',
        verificationStatus: 'Pending',
        accountStatus: 'Active'
      }
    };
    const res = {
      status: (code) => {
        assert.strictEqual(code, 403);
        return { json: (d) => assert(d.message.includes('credentials must be approved')) };
      }
    };
    await verifyScan(req, res);
  });

  await runAsyncTest('2.3 Doctor verification API rejects blocked doctor (403)', async () => {
    const req = {
      params: { id: 'SCAN-001' },
      body: { finalDiagnosis: 'Caries' },
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'doctor',
        verificationStatus: 'Approved',
        accountStatus: 'Blocked'
      }
    };
    const res = {
      status: (code) => {
        assert.strictEqual(code, 403);
        return { json: (d) => assert(d.message.includes('Account is blocked')) };
      }
    };
    await verifyScan(req, res);
  });

  await runAsyncTest('2.4 Doctor verification API rejects patient attempting verification (403)', async () => {
    const req = {
      params: { id: 'SCAN-001' },
      body: { finalDiagnosis: 'Caries' },
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: 'patient'
      }
    };
    const res = {
      status: (code) => {
        assert.strictEqual(code, 403);
        return { json: (d) => assert(d.message.includes('Only medical practitioners')) };
      }
    };
    await verifyScan(req, res);
  });

  // ===========================================================================
  // SECTION 3: SCAN STORAGE & SCHEMA COMPLIANCE
  // ===========================================================================
  console.log('\n--- SECTION 3: SCAN STORAGE & SCHEMA COMPLIANCE ---');

  runTest('3.1 ScanHistory status enum matches exact clinical specification', () => {
    const statuses = ScanHistory.schema.path('status').enumValues;
    assert.deepStrictEqual(statuses, ['Pending', 'Verified', 'Rejected', 'Needs Rescan']);
  });

  runTest('3.2 ScanHistory classProbabilities schema and predictedCondition virtual', () => {
    const scan = new ScanHistory({
      patientId: new mongoose.Types.ObjectId(),
      scanId: 'SCAN-TEST-001',
      condition: 'Calculus',
      confidence: 91.5,
      classProbabilities: {
        Calculus: 91.5,
        Caries: 4.2,
        Gingivitis: 2.1,
        Hypodontia: 0.1,
        Mouth_Ulcer: 0.1,
        Tooth_Discoloration: 2.0
      }
    });
    assert.strictEqual(scan.condition, 'Calculus');
    assert.strictEqual(scan.predictedCondition, 'Calculus');
    assert.strictEqual(scan.classProbabilities.Calculus, 91.5);
    assert.strictEqual(scan.status, 'Pending');
    assert.strictEqual(scan.isOverridden, false);
  });

  // ===========================================================================
  // SECTION 4: DOCTOR DIAGNOSIS CONFIRMATION, OVERRIDE & AUDIT TRAIL
  // ===========================================================================
  console.log('\n--- SECTION 4: DOCTOR DIAGNOSIS CONFIRMATION & AUDIT TRAIL ---');

  await runAsyncTest('4.1 Doctor clinical confirmation preserves original AI condition', async () => {
    const doctorId = new mongoose.Types.ObjectId();
    const mockScan = {
      _id: new mongoose.Types.ObjectId(),
      scanId: 'SCAN-CONFIRM-01',
      condition: 'Gingivitis',
      confidence: 89.4,
      finalDiagnosis: null,
      isOverridden: false,
      auditTrail: [],
      status: 'Pending',
      save: async function () { return this; }
    };

    const origFindOne = ScanHistory.findOne;
    const origFindById = ScanHistory.findById;
    ScanHistory.findOne = () => Promise.resolve(mockScan);
    ScanHistory.findById = () => ({
      populate: () => ({ populate: () => Promise.resolve(mockScan) })
    });

    const req = {
      params: { id: mockScan.scanId },
      body: {
        finalDiagnosis: 'Gingivitis',
        doctorNotes: 'Confirmed marginal gingival erythema.',
        treatmentPlan: 'Ultrasonic scaling and chlorhexidine rinse.'
      },
      user: {
        _id: doctorId,
        role: 'doctor',
        verificationStatus: 'Approved',
        accountStatus: 'Active'
      }
    };

    const res = {
      json: (d) => {
        assert.strictEqual(d.success, true);
        assert.strictEqual(mockScan.condition, 'Gingivitis', 'AI condition must never change');
        assert.strictEqual(mockScan.finalDiagnosis, 'Gingivitis');
        assert.strictEqual(mockScan.isOverridden, false);
        assert.strictEqual(mockScan.status, 'Verified');
        assert.strictEqual(mockScan.auditTrail.length, 1);
        assert.strictEqual(mockScan.auditTrail[0].action, 'CONFIRMED');
      }
    };

    await verifyScan(req, res);
    ScanHistory.findOne = origFindOne;
    ScanHistory.findById = origFindById;
  });

  await runAsyncTest('4.2 Doctor clinical override sets isOverridden=true and records audit entry', async () => {
    const doctorId = new mongoose.Types.ObjectId();
    const mockScan = {
      _id: new mongoose.Types.ObjectId(),
      scanId: 'SCAN-OVERRIDE-01',
      condition: 'Tooth_Discoloration',
      confidence: 76.5,
      finalDiagnosis: null,
      isOverridden: false,
      auditTrail: [],
      status: 'Pending',
      save: async function () { return this; }
    };

    const origFindOne = ScanHistory.findOne;
    const origFindById = ScanHistory.findById;
    ScanHistory.findOne = () => Promise.resolve(mockScan);
    ScanHistory.findById = () => ({
      populate: () => ({ populate: () => Promise.resolve(mockScan) })
    });

    const req = {
      params: { id: mockScan.scanId },
      body: {
        finalDiagnosis: 'Calculus',
        secondaryFindings: ['Cervical calculus band'],
        doctorNotes: 'Extrinsic staining was secondary; heavy subgingival calculus present.',
        treatmentPlan: 'Subgingival root planing.'
      },
      user: {
        _id: doctorId,
        role: 'doctor',
        verificationStatus: 'Approved',
        accountStatus: 'Active'
      }
    };

    const res = {
      json: (d) => {
        assert.strictEqual(d.success, true);
        assert.strictEqual(mockScan.condition, 'Tooth_Discoloration', 'AI condition must remain intact');
        assert.strictEqual(mockScan.finalDiagnosis, 'Calculus');
        assert.strictEqual(mockScan.isOverridden, true);
        assert.strictEqual(mockScan.status, 'Verified');
        assert.strictEqual(mockScan.auditTrail.length, 1);
        assert.strictEqual(mockScan.auditTrail[0].action, 'OVERRIDDEN');
        assert.strictEqual(mockScan.auditTrail[0].previousDiagnosis, 'Tooth_Discoloration');
        assert.strictEqual(mockScan.auditTrail[0].newDiagnosis, 'Calculus');
      }
    };

    await verifyScan(req, res);
    ScanHistory.findOne = origFindOne;
    ScanHistory.findById = origFindById;
  });

  // ===========================================================================
  // SECTION 5: PATIENT PRIVACY & ACCESS CONTROL (getScanById)
  // ===========================================================================
  console.log('\n--- SECTION 5: PATIENT PRIVACY & RECORD ACCESS ---');

  await runAsyncTest('5.1 Cross-tenant access rejection: Patient A cannot access Patient B scan (403)', async () => {
    const patientA = new mongoose.Types.ObjectId();
    const patientB = new mongoose.Types.ObjectId();
    const mockScan = {
      _id: new mongoose.Types.ObjectId(),
      patientId: { _id: patientB }
    };

    const origFindOne = ScanHistory.findOne;
    ScanHistory.findOne = () => ({
      populate: () => ({ populate: () => Promise.resolve(mockScan) })
    });

    const req = {
      params: { id: mockScan._id.toString() },
      user: { _id: patientA, role: 'patient' }
    };
    const res = {
      status: (code) => {
        assert.strictEqual(code, 403);
        return { json: (d) => assert(d.message.includes('Not authorized')) };
      }
    };

    await getScanById(req, res);
    ScanHistory.findOne = origFindOne;
  });

  // ===========================================================================
  // SECTION 6: OFFLINE CLINIC APPOINTMENTS & CONSULTATION LIFECYCLE
  // ===========================================================================
  console.log('\n--- SECTION 6: OFFLINE IN-PERSON APPOINTMENT BOOKING ---');

  await runAsyncTest('6.1 Appointment booking validates verified doctor and prevents client fee tampering', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();

    const mockDoctor = {
      _id: doctorId,
      name: 'Dr. Sarah Connor',
      role: 'doctor',
      specialization: 'Periodontics',
      clinic: 'Indiranagar Dental Care',
      location: 'Bengaluru',
      fee: 650,
      verificationStatus: 'Approved',
      accountStatus: 'Active'
    };

    const origUserFindById = User.findById;
    User.findById = (id) => Promise.resolve(id.toString() === doctorId.toString() ? mockDoctor : null);

    const req = {
      user: { _id: patientId, name: 'Alice Patient' },
      body: {
        doctorId: doctorId.toString(),
        consultationType: 'In-Person Clinic Visit',
        date: '2026-11-20',
        time: '10:30',
        message: 'Severe tooth sensitivity upon cold water.',
        fee: 10, // Tampered fee attempted by client
        status: 'Completed' // Tampered status attempted by client
      }
    };

    let createdDoc = null;
    const origSave = Consultation.prototype.save;
    Consultation.prototype.save = function () {
      createdDoc = this;
      return Promise.resolve(this);
    };

    const res = {
      status: (code) => {
        if (code !== 201) {
          return { json: (d) => { console.error('Test 6.1 Error Details:', d); assert.strictEqual(code, 201); } };
        }
        return { json: (d) => assert.strictEqual(d.fee, 500, 'Fee must be 500 for in-person consultation') };
      }
    };

    await createConsultation(req, res);

    assert(createdDoc, 'Consultation must be created');
    assert.strictEqual(createdDoc.fee, 500, 'Fee must be 500 for in-person consultation');
    assert.strictEqual(createdDoc.platformFee, 49);
    assert.strictEqual(createdDoc.totalAmount, 549);
    assert.strictEqual(createdDoc.status, 'Pending', 'Initial status must be Pending');
    assert.strictEqual(createdDoc.consultationType, 'In-Person Clinic Visit');

    User.findById = origUserFindById;
    Consultation.prototype.save = origSave;
  });

  await runAsyncTest('6.2 Doctor acceptance updates status to Accepted', async () => {
    const doctorId = new mongoose.Types.ObjectId();
    const mockConsultation = {
      _id: new mongoose.Types.ObjectId(),
      doctorId: doctorId.toString(),
      patientId: new mongoose.Types.ObjectId().toString(),
      status: 'Pending',
      doctorName: 'Dr. Sarah Connor',
      save: async function () { return this; },
      toObject: function () { return this; }
    };

    const origFindById = Consultation.findById;
    const origUserFindById = User.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);
    User.findById = () => Promise.resolve({
      _id: doctorId,
      name: 'Dr. Sarah Connor',
      verificationStatus: 'Approved',
      email: 'sarah@example.com'
    });

    const req = {
      params: { id: mockConsultation._id.toString() },
      user: { _id: doctorId, role: 'doctor' }
    };
    const res = {
      status: (code) => ({
        json: (d) => {
          throw new Error(`acceptConsultation failed with ${code}: ${JSON.stringify(d)}`);
        }
      }),
      json: (d) => {
        assert.strictEqual(d.status, 'Accepted');
      }
    };

    await acceptConsultation(req, res);
    Consultation.findById = origFindById;
    User.findById = origUserFindById;
  });

  await runAsyncTest('6.3 Doctor rejection records rejection reason', async () => {
    const doctorId = new mongoose.Types.ObjectId();
    const mockConsultation = {
      _id: new mongoose.Types.ObjectId(),
      doctorId: doctorId.toString(),
      status: 'Pending',
      rejectionReason: '',
      save: async function () { return this; }
    };

    const origFindById = Consultation.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);

    const req = {
      params: { id: mockConsultation._id.toString() },
      body: { reason: 'Schedule conflict on requested date.' },
      user: { _id: doctorId, role: 'doctor' }
    };
    const res = {
      json: (d) => {
        assert.strictEqual(mockConsultation.status, 'Rejected');
        assert.strictEqual(mockConsultation.rejectionReason, 'Schedule conflict on requested date.');
      }
    };

    await rejectConsultation(req, res);
    Consultation.findById = origFindById;
  });

  // ===========================================================================
  // SECTION 7: ADMIN USER & DOCTOR MANAGEMENT
  // ===========================================================================
  console.log('\n--- SECTION 7: ADMIN MANAGEMENT ---');

  await runAsyncTest('7.1 Admin can approve pending doctor', async () => {
    const mockDoc = {
      _id: new mongoose.Types.ObjectId(),
      role: 'doctor',
      verificationStatus: 'Pending',
      save: async function () { return this; }
    };

    const origUserFindById = User.findById;
    User.findById = () => Promise.resolve(mockDoc);

    const req = {
      params: { id: mockDoc._id.toString() },
      body: { status: 'Approved' }
    };
    const res = {
      json: (d) => {
        assert.strictEqual(mockDoc.verificationStatus, 'Approved');
      }
    };

    await updateDoctorStatus(req, res);
    User.findById = origUserFindById;
  });

  await runAsyncTest('7.2 Admin can block an account', async () => {
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      accountStatus: 'Active',
      save: async function () { return this; }
    };

    const origUserFindById = User.findById;
    User.findById = () => Promise.resolve(mockUser);

    const req = {
      params: { id: mockUser._id.toString() },
      body: { status: 'Blocked' },
      user: { _id: new mongoose.Types.ObjectId() } // Different admin ID
    };
    const res = {
      json: (d) => {
        assert.strictEqual(mockUser.accountStatus, 'Blocked');
      }
    };

    await updateAccountStatus(req, res);
    User.findById = origUserFindById;
  });

  // ===========================================================================
  // SECTION 8: SEPARATED CONSULTATION WORKFLOWS & ACCESS CONTROL
  // ===========================================================================
  console.log('\n--- SECTION 8: SEPARATED CONSULTATION WORKFLOWS & ACCESS CONTROL ---');

  await runAsyncTest('8.1 In-person clinic appointment pricing (₹500 + ₹49 = ₹549)', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const mockDoctor = {
      _id: doctorId,
      name: 'Dr. Sarah Connor',
      role: 'doctor',
      specialization: 'Periodontics',
      clinic: 'Indiranagar Dental Care',
      location: 'Bengaluru',
      verificationStatus: 'Approved',
      accountStatus: 'Active'
    };

    const origUserFindById = User.findById;
    User.findById = (id) => Promise.resolve(id.toString() === doctorId.toString() ? mockDoctor : null);

    let createdDoc = null;
    const origSave = Consultation.prototype.save;
    Consultation.prototype.save = function () {
      createdDoc = this;
      return Promise.resolve(this);
    };

    const req = {
      user: { _id: patientId, name: 'Patient Alice' },
      body: {
        doctorId: doctorId.toString(),
        consultationType: 'In-Person Clinic Visit',
        date: '2026-11-25',
        time: '11:00'
      }
    };
    const res = {
      status: (code) => ({
        json: (d) => {
          assert.strictEqual(code, 201);
          assert.strictEqual(d.fee, 500);
          assert.strictEqual(d.platformFee, 49);
          assert.strictEqual(d.totalAmount, 549);
        }
      })
    };

    await createConsultation(req, res);
    assert.strictEqual(createdDoc.fee, 500);
    assert.strictEqual(createdDoc.platformFee, 49);
    assert.strictEqual(createdDoc.totalAmount, 549);
    assert.strictEqual(createdDoc.consultationType, 'In-Person Clinic Visit');
    assert.strictEqual(createdDoc.clinic, 'Indiranagar Dental Care');

    User.findById = origUserFindById;
    Consultation.prototype.save = origSave;
  });

  await runAsyncTest('8.2 Online chat appointment pricing (₹200 + ₹49 = ₹249)', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const mockDoctor = {
      _id: doctorId,
      name: 'Dr. Sarah Connor',
      role: 'doctor',
      specialization: 'Periodontics',
      verificationStatus: 'Approved',
      accountStatus: 'Active'
    };

    const origUserFindById = User.findById;
    User.findById = (id) => Promise.resolve(id.toString() === doctorId.toString() ? mockDoctor : null);

    let createdDoc = null;
    const origSave = Consultation.prototype.save;
    Consultation.prototype.save = function () {
      createdDoc = this;
      return Promise.resolve(this);
    };

    const req = {
      user: { _id: patientId, name: 'Patient Bob' },
      body: {
        doctorId: doctorId.toString(),
        consultationType: 'Online Chat',
        date: '2026-11-25',
        time: '14:00'
      }
    };
    const res = {
      status: (code) => ({
        json: (d) => {
          assert.strictEqual(code, 201);
          assert.strictEqual(d.fee, 200);
          assert.strictEqual(d.platformFee, 49);
          assert.strictEqual(d.totalAmount, 249);
        }
      })
    };

    await createConsultation(req, res);
    assert.strictEqual(createdDoc.fee, 200);
    assert.strictEqual(createdDoc.platformFee, 49);
    assert.strictEqual(createdDoc.totalAmount, 249);
    assert.strictEqual(createdDoc.consultationType, 'Chat Consultation');

    User.findById = origUserFindById;
    Consultation.prototype.save = origSave;
  });

  await runAsyncTest('8.3 In-Person and Online Chat bookings cannot occupy same doctor date/time slot (409 Conflict)', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const mockDoctor = {
      _id: doctorId,
      name: 'Dr. Sarah Connor',
      role: 'doctor',
      verificationStatus: 'Approved',
      accountStatus: 'Active'
    };

    const origUserFindById = User.findById;
    User.findById = () => Promise.resolve(mockDoctor);

    // Mock slot as already occupied by an in-person appointment
    const origFindOne = DoctorSlot.findOne;
    DoctorSlot.findOne = () => Promise.resolve({
      doctorId: doctorId.toString(),
      date: '2026-11-25',
      time: '10:00',
      status: 'booked',
      consultationType: 'In-Person Clinic Visit'
    });

    const req = {
      user: { _id: patientId, name: 'Patient Charlie' },
      body: {
        doctorId: doctorId.toString(),
        consultationType: 'Online Chat',
        date: '2026-11-25',
        time: '10:00'
      }
    };

    let statusCode = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (d) => {
            assert.strictEqual(code, 409, 'Double booking must return 409 Conflict');
          }
        };
      }
    };

    await createConsultation(req, res);
    assert.strictEqual(statusCode, 409);

    User.findById = origUserFindById;
    DoctorSlot.findOne = origFindOne;
  });

  await runAsyncTest('8.4 Strict Access Control: In-person appointment rejects chat message fetch with 403 Forbidden', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const consultationId = new mongoose.Types.ObjectId();

    const mockConsultation = {
      _id: consultationId,
      patientId: patientId.toString(),
      doctorId: doctorId.toString(),
      consultationType: 'In-Person Clinic Visit',
      status: 'Confirmed'
    };

    const origFindById = Consultation.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);

    const req = {
      params: { consultationId: consultationId.toString() },
      user: { _id: patientId, role: 'patient' }
    };

    let statusCode = null;
    let errorMsg = '';
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (d) => {
            errorMsg = d.message;
          }
        };
      }
    };

    await getMessagesByConsultation(req, res);
    assert.strictEqual(statusCode, 403, 'Must return 403 Forbidden for in-person appointment message fetch');
    assert(errorMsg.includes('In-person clinic appointments do not include online chat access'));

    Consultation.findById = origFindById;
  });

  await runAsyncTest('8.5 Strict Access Control: In-person appointment rejects chat message creation with 403 Forbidden', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const consultationId = new mongoose.Types.ObjectId();

    const mockConsultation = {
      _id: consultationId,
      patientId: patientId.toString(),
      doctorId: doctorId.toString(),
      consultationType: 'In-Person Clinic Visit',
      status: 'Confirmed'
    };

    const origFindById = Consultation.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);

    const req = {
      body: {
        consultationId: consultationId.toString(),
        message: 'Hello Doctor',
        type: 'text'
      },
      user: { _id: patientId, role: 'patient' }
    };

    let statusCode = null;
    let errorMsg = '';
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (d) => {
            errorMsg = d.message;
          }
        };
      }
    };

    await createMessage(req, res);
    assert.strictEqual(statusCode, 403, 'Must return 403 Forbidden for in-person appointment message creation');
    assert(errorMsg.includes('In-person clinic appointments do not include online chat access'));

    Consultation.findById = origFindById;
  });

  await runAsyncTest('8.6 Strict Access Control: Online chat appointment permits messaging for authorized participants', async () => {
    const patientId = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const consultationId = new mongoose.Types.ObjectId();

    const mockConsultation = {
      _id: consultationId,
      patientId: patientId.toString(),
      doctorId: doctorId.toString(),
      consultationType: 'Chat Consultation',
      status: 'Accepted'
    };

    const origFindById = Consultation.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);

    const req = {
      body: {
        consultationId: consultationId.toString(),
        message: 'Hello Doctor, I have severe pain in tooth 14.',
        type: 'text'
      },
      user: { _id: patientId, role: 'patient' }
    };

    let saved = false;
    const res = {
      status: (code) => ({
        json: (d) => {
          if (code === 201 || code === 200) {
            saved = true;
            assert(d);
          } else {
            throw new Error(`Unexpected failure ${code}: ${JSON.stringify(d)}`);
          }
        }
      }),
      json: (d) => {
        saved = true;
        assert(d);
      }
    };

    await createMessage(req, res);
    assert.strictEqual(saved, true, 'Message must be saved successfully for accepted chat consultation');

    Consultation.findById = origFindById;
  });

  await runAsyncTest('8.7 Strict Access Control: Cross-patient chat access blocked with 403 Forbidden', async () => {
    const patientA = new mongoose.Types.ObjectId();
    const patientB = new mongoose.Types.ObjectId();
    const doctorId = new mongoose.Types.ObjectId();
    const consultationId = new mongoose.Types.ObjectId();

    // Consultation belongs to Patient A
    const mockConsultation = {
      _id: consultationId,
      patientId: patientA.toString(),
      doctorId: doctorId.toString(),
      consultationType: 'Chat Consultation',
      status: 'Accepted'
    };

    const origFindById = Consultation.findById;
    Consultation.findById = () => Promise.resolve(mockConsultation);

    // Patient B attempts to fetch Patient A's chat
    const req = {
      params: { consultationId: consultationId.toString() },
      user: { _id: patientB, role: 'patient' }
    };

    let statusCode = null;
    let errorMsg = '';
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (d) => {
            errorMsg = d.message;
          }
        };
      }
    };

    await getMessagesByConsultation(req, res);
    assert.strictEqual(statusCode, 403, 'Cross-patient access must be rejected with 403');
    assert(errorMsg.includes('Not authorized'));

    Consultation.findById = origFindById;
  });

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`TOTAL TESTS EXECUTED: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
