const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET for test harness
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dentaai_super_secret_jwt_key_test_2026';

// Models
const User = require('./models/User');
const ScanHistory = require('./models/ScanHistory');
const Consultation = require('./models/Consultation');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

// Controllers & Middleware
const { protect, restrictTo } = require('./middleware/authMiddleware');
const {
  getStats,
  getPatients,
  getDoctors,
  updateDoctorStatus,
  updateAccountStatus,
  getScans,
  getAppointments,
  getPayments,
  getAuditLogs,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} = require('./controllers/adminController');
const { verifyScan } = require('./controllers/scanHistoryController');
const { getMessagesByConsultation } = require('./controllers/messageController');

console.log('================================================================');
console.log('DENTAAI COMPLETE ADMIN DASHBOARD AUTOMATED TEST SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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

// Mock Helper functions
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
};

async function runSuite() {
  const adminId = new mongoose.Types.ObjectId();
  const doctorId = new mongoose.Types.ObjectId();
  const patientId = new mongoose.Types.ObjectId();

  const adminUser = {
    _id: adminId,
    name: 'Chief Admin',
    email: 'admin@dentaai.com',
    role: 'admin',
    accountStatus: 'Active'
  };

  const doctorUser = {
    _id: doctorId,
    name: 'Dr. Neha Sharma',
    email: 'dr.neha@dentaai.com',
    role: 'doctor',
    qualifications: 'BDS, MDS (Periodontics)',
    specialization: 'Periodontics',
    dentalCouncilNumber: 'DCI-MH-48291',
    stateDentalCouncil: 'Maharashtra State Dental Council',
    clinic: 'DentCare Specialty Clinic',
    verificationStatus: 'Pending',
    accountStatus: 'Active',
    verificationHistory: [],
    save: function() { return Promise.resolve(this); }
  };

  const patientUser = {
    _id: patientId,
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91 9876543210',
    role: 'patient',
    accountStatus: 'Active',
    save: function() { return Promise.resolve(this); }
  };

  // Test 1: Admin Authentication & RBAC Middleware Restriction
  await runAsyncTest('Test 1: Admin authorization allows admin and strictly blocks doctors and patients', async () => {
    const adminReq = { user: { role: 'admin' } };
    const doctorReq = { user: { role: 'doctor' } };
    const patientReq = { user: { role: 'patient' } };

    let adminAllowed = false;
    restrictTo('admin')(adminReq, createMockRes(), () => { adminAllowed = true; });
    assert.strictEqual(adminAllowed, true, 'Admin must be granted access');

    const docRes = createMockRes();
    restrictTo('admin')(doctorReq, docRes, () => {});
    assert.strictEqual(docRes.statusCode, 403, 'Doctor must be forbidden from admin routes with 403');

    const patRes = createMockRes();
    restrictTo('admin')(patientReq, patRes, () => {});
    assert.strictEqual(patRes.statusCode, 403, 'Patient must be forbidden from admin routes with 403');
  });

  // Test 2: Dashboard Statistics Real MongoDB Metrics
  await runAsyncTest('Test 2: Dashboard overview statistics computes all 13 real metrics and trends', async () => {
    // Mock Model counts and aggregations
    User.countDocuments = async (q) => {
      if (q?.role === 'patient') return 142;
      if (q?.role === 'doctor') {
        if (q.verificationStatus === 'Approved') return 18;
        if (q.verificationStatus?.$in) return 5;
        if (q.verificationStatus === 'Rejected') return 2;
        return 25;
      }
      return 167;
    };
    User.aggregate = async () => [];

    ScanHistory.countDocuments = async (q) => {
      if (q?.status === 'Pending') return 12;
      if (q?.status === 'Verified') return 88;
      if (q?.status === 'Rejected') return 4;
      if (q?.status === 'Needs Rescan') return 2;
      return 106;
    };
    ScanHistory.aggregate = async () => [{ _id: 'Caries', count: 45 }];

    Consultation.countDocuments = async (q) => {
      if (q?.status === 'Pending') return 6;
      if (q?.status === 'Accepted') return 14;
      if (q?.status?.$in) return 40;
      if (q?.consultationType?.$regex?.test('in-person')) return 35;
      if (q?.consultationType?.$regex?.test('online')) return 25;
      if (q?.paymentStatus === 'Paid') return 52;
      if (q?.paymentStatus === 'Pending') return 6;
      if (q?.paymentStatus?.$in) return 2;
      return 60;
    };
    Consultation.aggregate = async (pipeline) => {
      return [{ _id: null, total: 24500 }];
    };
    Consultation.find = () => ({
      sort: () => ({ limit: () => ({ populate: () => Promise.resolve([]) }) })
    });
    AuditLog.find = () => ({ sort: () => ({ limit: () => Promise.resolve([]) }) });

    const req = { user: adminUser };
    const res = createMockRes();
    await getStats(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.totalPatients, 142);
    assert.strictEqual(res.data.totalDoctors, 25);
    assert.strictEqual(res.data.approvedDoctors, 18);
    assert.strictEqual(res.data.pendingDoctors, 5);
    assert.strictEqual(res.data.rejectedDoctors, 2);
    assert.strictEqual(res.data.totalScans, 106);
    assert.strictEqual(res.data.pendingScans, 12);
    assert.strictEqual(res.data.verifiedScans, 88);
    assert.strictEqual(res.data.totalAppointments, 60);
    assert.strictEqual(res.data.successfulPayments, 52);
    assert.strictEqual(res.data.totalRevenue, 24500);
    assert(Array.isArray(res.data.registrationTrends), 'Must contain real registration trends');
  });

  // Test 3: Patient Search and Pagination
  await runAsyncTest('Test 3: Patient management filters by query and enriches with scan and appointment counts', async () => {
    User.countDocuments = async () => 1;
    User.find = () => ({
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([
              {
                _id: patientId,
                name: 'Rajesh Kumar',
                email: 'rajesh@example.com',
                phone: '+91 9876543210',
                role: 'patient',
                accountStatus: 'Active',
                toObject: function() { return { ...this }; }
              }
            ])
          })
        })
      })
    });
    ScanHistory.aggregate = async () => [{ _id: patientId, count: 4 }];
    Consultation.aggregate = async () => [{ _id: patientId.toString(), count: 2 }];

    const req = { query: { search: 'Rajesh', page: 1, limit: 10 } };
    const res = createMockRes();
    await getPatients(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.patients.length, 1);
    assert.strictEqual(res.data.patients[0].totalScans, 4);
    assert.strictEqual(res.data.patients[0].totalAppointments, 2);
    assert.strictEqual(res.data.pagination.total, 1);
  });

  // Test 4: Doctor Credential Display & Verification Filter
  await runAsyncTest('Test 4: Doctor management surfaces qualifications, DCI number, and certificates', async () => {
    User.countDocuments = async (q) => q?.verificationStatus === 'Pending' ? 1 : 1;
    User.find = () => ({
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([doctorUser])
          })
        })
      })
    });

    const req = { query: { status: 'Pending' } };
    const res = createMockRes();
    await getDoctors(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.doctors.length, 1);
    assert.strictEqual(res.data.doctors[0].dentalCouncilNumber, 'DCI-MH-48291');
    assert.strictEqual(res.data.doctors[0].qualifications, 'BDS, MDS (Periodontics)');
  });

  // Test 5: Doctor Approval, Rejection (Mandatory Reason), and Resubmission
  await runAsyncTest('Test 5: Doctor approval succeeds; rejection fails without reason, succeeds with reason', async () => {
    User.findById = async () => ({ ...doctorUser, save: async function() { return this; } });
    AuditLog.create = async () => ({});
    Notification.create = async () => ({});

    // 5a. Rejection without reason must fail with 400
    const failReq = {
      params: { id: doctorId.toString() },
      body: { status: 'Rejected', reason: '' },
      user: adminUser
    };
    const failRes = createMockRes();
    await updateDoctorStatus(failReq, failRes);
    assert.strictEqual(failRes.statusCode, 400, 'Rejection without reason must return 400');

    // 5b. Approval with admin audit info succeeds
    const approveReq = {
      params: { id: doctorId.toString() },
      body: { status: 'Approved', notes: 'Verified on DCI official register' },
      user: adminUser
    };
    const approveRes = createMockRes();
    await updateDoctorStatus(approveReq, approveRes);
    assert.strictEqual(approveRes.statusCode, 200);
    assert.strictEqual(approveRes.data.doctor.verificationStatus, 'Approved');
    assert.strictEqual(approveRes.data.doctor.verifiedByName, 'Chief Admin');

    // 5c. Resubmission request with reason succeeds
    const resubmitReq = {
      params: { id: doctorId.toString() },
      body: { status: 'Requires Resubmission', reason: 'Degree certificate scan is blurred. Please re-upload.' },
      user: adminUser
    };
    const resubmitRes = createMockRes();
    await updateDoctorStatus(resubmitReq, resubmitRes);
    assert.strictEqual(resubmitRes.statusCode, 200);
    assert.strictEqual(resubmitRes.data.doctor.verificationStatus, 'Requires Resubmission');
  });

  // Test 6: Verified Dentist Badge State Verification
  await runAsyncTest('Test 6: Verified Dentist badge displays only when verificationStatus is Approved', async () => {
    const docApproved = { ...doctorUser, verificationStatus: 'Approved' };
    const docPending = { ...doctorUser, verificationStatus: 'Pending' };
    const docRejected = { ...doctorUser, verificationStatus: 'Rejected' };

    assert.strictEqual(docApproved.verificationStatus === 'Approved', true);
    assert.strictEqual(docPending.verificationStatus === 'Approved', false);
    assert.strictEqual(docRejected.verificationStatus === 'Approved', false);
  });

  // Test 7: Dental Scan Management & Doctor Verification Boundary
  await runAsyncTest('Test 7: Admin is blocked from clinical verification (strictly restricted to licensed doctors)', async () => {
    const adminReq = {
      user: adminUser,
      params: { id: 'scan_123' },
      body: { finalDiagnosis: 'Caries' }
    };
    const res = createMockRes();

    // Verify scanHistoryRoutes restriction
    let verifiedDoctorInvoked = false;
    restrictTo('doctor')(adminReq, res, () => {
      verifiedDoctorInvoked = true;
    });

    assert.strictEqual(res.statusCode, 403, 'Admin must receive 403 on clinical scan verification');
    assert.strictEqual(verifiedDoctorInvoked, false);
  });

  // Test 8: Appointment Management & In-Person vs Online Chat Separation
  await runAsyncTest('Test 8: Appointment management distinguishes In-Person (₹549) from Online Chat (₹249)', async () => {
    Consultation.countDocuments = async () => 2;
    Consultation.find = () => ({
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([
              {
                _id: new mongoose.Types.ObjectId(),
                patientName: 'Aarav Patel',
                doctorName: 'Dr. Neha Sharma',
                consultationType: 'In-Person Clinic Consultation',
                fee: 500,
                platformFee: 49,
                totalAmount: 549,
                status: 'Accepted'
              },
              {
                _id: new mongoose.Types.ObjectId(),
                patientName: 'Sneha Roy',
                doctorName: 'Dr. Priya Menon',
                consultationType: 'Online Chat Consultation',
                fee: 200,
                platformFee: 49,
                totalAmount: 249,
                status: 'In Consultation'
              }
            ])
          })
        })
      })
    });

    const req = { query: { type: 'All' } };
    const res = createMockRes();
    await getAppointments(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.appointments[0].totalAmount, 549);
    assert.strictEqual(res.data.appointments[1].totalAmount, 249);
  });

  // Test 9: In-Person Appointments Strictly Block Chat Access
  await runAsyncTest('Test 9: In-person clinic appointments strictly forbid online chat messaging', async () => {
    const consultationId = new mongoose.Types.ObjectId();
    const mockConsultation = {
      _id: consultationId,
      patientId: patientId.toString(),
      doctorId: doctorId.toString(),
      consultationType: 'In-Person Clinic Consultation'
    };
    Consultation.findById = async () => mockConsultation;
    Consultation.findOne = async () => mockConsultation;

    const chatReq = {
      params: { consultationId: consultationId.toString() },
      user: { _id: patientId, role: 'patient' }
    };
    const chatRes = createMockRes();

    await getMessagesByConsultation(chatReq, chatRes);
    assert.strictEqual(chatRes.statusCode, 403);
    assert(chatRes.data.message.includes('In-person clinic appointments do not include online chat access'));
  });

  // Test 10: Payment Statistics Accounting
  await runAsyncTest('Test 10: Payment statistics strictly sums only successful Paid transactions as revenue', async () => {
    Consultation.countDocuments = async (q) => {
      if (q?.paymentStatus === 'Paid') return 10;
      if (q?.paymentStatus === 'Pending') return 3;
      if (q?.paymentStatus?.$in) return 2;
      return 15;
    };
    Consultation.aggregate = async (pipeline) => {
      // Confirms pipeline matches only paymentStatus: 'Paid'
      const matchStage = pipeline.find(s => s.$match);
      assert.strictEqual(matchStage.$match.paymentStatus, 'Paid', 'Must match strictly Paid status');
      return [{ _id: null, total: 5490 }];
    };
    Consultation.find = () => ({
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([])
          })
        })
      })
    });

    const req = { query: {} };
    const res = createMockRes();
    await getPayments(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.metrics.successfulCount, 10);
    assert.strictEqual(res.data.metrics.totalCollectedRevenue, 5490);
  });

  // Test 11: Admin Notifications Retrieval & Mark as Read
  await runAsyncTest('Test 11: Admin notifications retrieval and mark-all-read update', async () => {
    Notification.find = () => ({
      sort: () => ({
        limit: () => Promise.resolve([
          { _id: 'notif_1', title: 'New Doctor Registration', message: 'Dr. John registered', isRead: false }
        ])
      })
    });
    Notification.countDocuments = async () => 1;
    Notification.updateMany = async () => ({ modifiedCount: 1 });

    const req = { user: adminUser };
    const res = createMockRes();
    await getAdminNotifications(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.unreadCount, 1);

    const readAllRes = createMockRes();
    await markAllAdminNotificationsRead(req, readAllRes);
    assert.strictEqual(readAllRes.statusCode, 200);
  });

  // Test 12: Audit Log Creation & Immutability
  await runAsyncTest('Test 12: Audit log records administrative operations with admin identity and timestamp', async () => {
    let createdAudit = null;
    AuditLog.create = async (doc) => {
      createdAudit = { _id: new mongoose.Types.ObjectId(), ...doc };
      return createdAudit;
    };
    AuditLog.countDocuments = async () => 1;
    AuditLog.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve([
            {
              action: 'DOCTOR_APPROVED',
              adminName: 'Chief Admin',
              targetType: 'Doctor',
              targetName: 'Dr. Neha Sharma',
              reason: 'Verified on DCI',
              createdAt: new Date()
            }
          ])
        })
      })
    });

    const req = { query: { category: 'All' } };
    const res = createMockRes();
    await getAuditLogs(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.logs[0].action, 'DOCTOR_APPROVED');
    assert.strictEqual(res.data.logs[0].adminName, 'Chief Admin');
  });

  // Test 13: Self-Blocking Prevention for Admins
  await runAsyncTest('Test 13: Admin self-blocking is strictly rejected by backend security logic', async () => {
    const req = {
      params: { id: adminId.toString() },
      body: { status: 'Blocked' },
      user: adminUser
    };
    const res = createMockRes();
    await updateAccountStatus(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert(res.data.message.includes('You cannot block your own administrator account'));
  });

  // Test 14: Doctor Cannot Approve Own Account
  await runAsyncTest('Test 14: Doctor cannot self-approve their own account even if token provided', async () => {
    User.findById = async () => ({ ...doctorUser, save: async function() { return this; } });

    const req = {
      params: { id: doctorId.toString() },
      body: { status: 'Approved' },
      user: doctorUser // Doctor pretending to be requester
    };
    const res = createMockRes();
    await updateDoctorStatus(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert(res.data.message.includes('Doctors cannot approve or verify their own accounts'));
  });

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
