const DoctorSlot = require('../models/DoctorSlot');
const Consultation = require('../models/Consultation');

// Standard clinical time slots for DentaAI dental practitioners
const STANDARD_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30'
];

/**
 * Normalizes any time representation to strict 24-hr 'HH:mm'
 * Examples:
 * '10:00 AM' -> '10:00'
 * '10:00'    -> '10:00'
 * '02:30 PM' -> '14:30'
 * '2:30 PM'  -> '14:30'
 * '14:30'    -> '14:30'
 */
function normalizeTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return trimmed;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  const hh = String(hours).padStart(2, '0');
  return `${hh}:${minutes}`;
}

/**
 * Normalizes date to 'YYYY-MM-DD'
 */
function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
}

/**
 * Formats 24-hr 'HH:mm' to human-friendly 'hh:mm AM/PM'
 */
function formatTimeDisplay(hhmm) {
  if (!hhmm) return '';
  const parts = hhmm.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/**
 * Deterministic unique slot key across doctors, dates and times
 */
function buildSlotKey(doctorId, dateStr, timeStr) {
  return `${String(doctorId)}_${normalizeDate(dateStr)}_${normalizeTime(timeStr)}`;
}

/**
 * Check whether a specific slot is currently occupied.
 * Considers both active consultations and dedicated atomic doctor slots.
 */
async function isSlotOccupied(doctorId, dateStr, timeStr, excludeConsultationId = null) {
  const normDate = normalizeDate(dateStr);
  const normTime = normalizeTime(timeStr);
  const slotKey = buildSlotKey(doctorId, normDate, normTime);
  const now = new Date();
  const RESERVATION_EXPIRY_MS = 15 * 60 * 1000;

  // 1. Check DoctorSlot record
  const slot = await DoctorSlot.findOne({ slotKey });
  if (slot) {
    const isReleased = slot.status === 'RELEASED';
    const isExpired = slot.status === 'RESERVED' && slot.reservationExpiresAt && slot.reservationExpiresAt < now;
    if (!isReleased && !isExpired) {
      if (!excludeConsultationId || String(slot.consultationId) !== String(excludeConsultationId)) {
        return {
          occupied: true,
          reason: slot.status === 'CONFIRMED' ? 'Confirmed appointment' : 'Active reservation pending payment',
          slot
        };
      }
    }
  }

  // 2. Cross-check Consultation collection for confirmed bookings or recent pending reservations
  const consultQuery = {
    doctorId: String(doctorId),
    date: normDate,
    time: normTime,
    status: { $nin: ['Cancelled', 'Rejected'] }
  };
  if (excludeConsultationId) {
    consultQuery._id = { $ne: excludeConsultationId };
  }

  // Match either paid/confirmed consultations or reservations within 15 minutes
  consultQuery.$or = [
    { paymentStatus: { $in: ['Paid', 'Verified', 'Completed'] } },
    { createdAt: { $gte: new Date(now.getTime() - RESERVATION_EXPIRY_MS) } }
  ];

  const activeConsult = await Consultation.findOne(consultQuery);
  if (activeConsult) {
    return {
      occupied: true,
      reason: 'Existing consultation booking',
      consultation: activeConsult
    };
  }

  return { occupied: false };
}

/**
 * Atomically acquire or reserve a doctor slot lock.
 * Prevents double-booking even under intense concurrent race conditions.
 */
async function acquireSlotLock({
  doctorId,
  date,
  time,
  patientId,
  consultationId = null,
  consultationType = undefined,
  isPaid = true,
  reservationMinutes = 15
}) {
  const normDate = normalizeDate(date);
  const normTime = normalizeTime(time);
  const slotKey = buildSlotKey(doctorId, normDate, normTime);
  const now = new Date();

  // 1. Cross-check active consultations in database
  const activeConsult = await Consultation.findOne({
    doctorId: String(doctorId),
    date: normDate,
    time: normTime,
    status: { $nin: ['Cancelled', 'Rejected'] },
    ...(consultationId ? { _id: { $ne: consultationId } } : {}),
    $or: [
      { paymentStatus: { $in: ['Paid', 'Verified', 'Completed'] } },
      { createdAt: { $gte: new Date(now.getTime() - reservationMinutes * 60 * 1000) } }
    ]
  });

  if (activeConsult) {
    const err = new Error('This appointment slot has already been booked. Please choose another time slot.');
    err.statusCode = 409;
    throw err;
  }

  // 2. Check if a slot document already exists
  const existingSlot = await DoctorSlot.findOne({ slotKey });
  if (existingSlot) {
    const isReleased = existingSlot.status === 'RELEASED';
    const isExpired = existingSlot.status === 'RESERVED' && existingSlot.reservationExpiresAt && existingSlot.reservationExpiresAt < now;

    if (!isReleased && !isExpired) {
      const conflictErr = new Error('This appointment slot has already been booked. Please choose another time slot.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    // Atomically claim the released or expired slot
    const claimed = await DoctorSlot.findOneAndUpdate(
      {
        slotKey,
        $or: [
          { status: 'RELEASED' },
          { status: 'RESERVED', reservationExpiresAt: { $lt: now } }
        ]
      },
      {
        $set: {
          doctorId: String(doctorId),
          date: normDate,
          time: normTime,
          patientId: patientId ? String(patientId) : undefined,
          consultationId: consultationId || undefined,
          consultationType: consultationType || undefined,
          status: isPaid ? 'CONFIRMED' : 'RESERVED',
          reservationExpiresAt: isPaid ? null : new Date(now.getTime() + reservationMinutes * 60 * 1000),
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!claimed) {
      const conflictErr = new Error('This appointment slot has already been booked. Please choose another time slot.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
    return claimed;
  }

  // 3. New slot insertion: protected by MongoDB unique index on slotKey
  try {
    const newSlot = new DoctorSlot({
      slotKey,
      doctorId: String(doctorId),
      date: normDate,
      time: normTime,
      patientId: patientId ? String(patientId) : undefined,
      consultationId: consultationId || undefined,
      consultationType: consultationType || undefined,
      status: isPaid ? 'CONFIRMED' : 'RESERVED',
      reservationExpiresAt: isPaid ? null : new Date(now.getTime() + reservationMinutes * 60 * 1000)
    });
    await newSlot.save();
    return newSlot;
  } catch (insertErr) {
    if (insertErr.code === 11000) {
      // Collision occurred: another thread inserted simultaneously
      // Attempt atomic claim if released or expired
      const claimed = await DoctorSlot.findOneAndUpdate(
        {
          slotKey,
          $or: [
            { status: 'RELEASED' },
            { status: 'RESERVED', reservationExpiresAt: { $lt: now } }
          ]
        },
        {
          $set: {
            doctorId: String(doctorId),
            date: normDate,
            time: normTime,
            patientId: patientId ? String(patientId) : undefined,
            consultationId: consultationId || undefined,
            consultationType: consultationType || undefined,
            status: isPaid ? 'CONFIRMED' : 'RESERVED',
            reservationExpiresAt: isPaid ? null : new Date(now.getTime() + reservationMinutes * 60 * 1000),
            updatedAt: now
          }
        },
        { returnDocument: 'after' }
      );

      if (!claimed) {
        const conflictErr = new Error('This appointment slot has already been booked. Please choose another time slot.');
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      return claimed;
    }
    throw insertErr;
  }
}

/**
 * Release a previously locked or reserved slot (e.g. upon cancellation or doctor rejection).
 */
async function releaseSlotLock({ doctorId, date, time, consultationId = null }) {
  const query = {};
  if (consultationId) {
    query.consultationId = consultationId;
  } else if (doctorId && date && time) {
    query.slotKey = buildSlotKey(doctorId, date, time);
  } else {
    return null;
  }

  return await DoctorSlot.updateMany(
    query,
    {
      $set: {
        status: 'RELEASED',
        reservationExpiresAt: null,
        updatedAt: new Date()
      }
    }
  );
}

/**
 * Fetch all available and booked slots for a doctor on a specific date.
 */
async function getDoctorSlots({ doctorId, date }) {
  const normDate = normalizeDate(date);
  const now = new Date();
  const RESERVATION_EXPIRY_MS = 15 * 60 * 1000;

  // 1. Query occupied DoctorSlot documents
  const slots = await DoctorSlot.find({
    doctorId: String(doctorId),
    date: normDate,
    $or: [
      { status: 'CONFIRMED' },
      { status: 'RESERVED', reservationExpiresAt: { $gt: now } }
    ]
  });

  const occupiedTimes = new Set();
  slots.forEach(s => {
    if (s.time) occupiedTimes.add(normalizeTime(s.time));
  });

  // 2. Query active Consultation documents for this doctor & date
  const activeConsultations = await Consultation.find({
    doctorId: String(doctorId),
    date: normDate,
    status: { $nin: ['Cancelled', 'Rejected'] },
    $or: [
      { paymentStatus: { $in: ['Paid', 'Verified', 'Completed'] } },
      { createdAt: { $gte: new Date(now.getTime() - RESERVATION_EXPIRY_MS) } }
    ]
  });

  activeConsultations.forEach(c => {
    if (c.time) occupiedTimes.add(normalizeTime(c.time));
  });

  // 3. Map against STANDARD_SLOTS
  const allSlots = STANDARD_SLOTS.map(t => {
    const normalized = normalizeTime(t);
    const isBooked = occupiedTimes.has(normalized);
    return {
      time: normalized,
      displayTime: formatTimeDisplay(normalized),
      available: !isBooked
    };
  });

  const bookedSlots = Array.from(occupiedTimes).sort();
  const availableSlots = allSlots.filter(s => s.available).map(s => s.time);

  return {
    doctorId: String(doctorId),
    date: normDate,
    bookedSlots,
    availableSlots,
    allSlots
  };
}

module.exports = {
  STANDARD_SLOTS,
  normalizeTime,
  normalizeDate,
  formatTimeDisplay,
  buildSlotKey,
  isSlotOccupied,
  acquireSlotLock,
  releaseSlotLock,
  getDoctorSlots
};
