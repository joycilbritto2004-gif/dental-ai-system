import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, 
  Calendar, 
  UserCheck, 
  Printer, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Info,
  Sparkles,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { getCareSuggestions } from '../utils/careSuggestions';
import '../pages/Dashboard.css';

/**
 * PersonalPrescriptionSection
 * Renders the clinical prescription section matching DentaAI's design:
 * - Light mint background (#F0FDF9) with subtle teal border (#99E3D8)
 * - Safe pre-verification state ("Awaiting Dentist Review" + general care advice, NO AI drugs)
 * - Post-verification state (Dentist-approved medications, dosage, frequency, duration, instructions)
 * - Responsive 2-column desktop / 1-column mobile layout with print support
 */
const PersonalPrescriptionSection = ({
  condition = '',
  confidence = null,
  scanId = null,
  consultationId = null,
  existingPrescription = null,
  doctorVerification = null,
  onRefresh = null
}) => {
  const [prescription, setPrescription] = useState(existingPrescription);
  const [isLoading, setIsLoading] = useState(!existingPrescription && Boolean(consultationId || scanId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existingPrescription) {
      setPrescription(existingPrescription);
      setIsLoading(false);
      return;
    }

    const fetchPrescription = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let url = null;
        if (consultationId) {
          url = `http://localhost:5000/api/prescriptions/consultation/${consultationId}`;
        } else if (scanId) {
          url = `http://localhost:5000/api/prescriptions/scan/${scanId}`;
        } else {
          // Attempt to fetch latest prescription for patient matching condition
          url = condition 
            ? `http://localhost:5000/api/prescriptions/latest?condition=${encodeURIComponent(condition)}`
            : `http://localhost:5000/api/prescriptions/latest`;
        }

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setPrescription(data);
          } else {
            setPrescription(null);
          }
        } else if (res.status === 404) {
          setPrescription(null);
        }
      } catch (err) {
        console.warn('Prescription fetch notice:', err.message);
        // Fall back cleanly to pre-verification state
        setPrescription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescription();
  }, [consultationId, scanId, condition, existingPrescription]);

  // Derived state: has a verified dentist issued an approved prescription?
  const isVerified = Boolean(
    prescription && 
    Array.isArray(prescription.medications) && 
    prescription.medications.length > 0 &&
    prescription.status !== 'Awaiting Dentist Review'
  );

  const careData = getCareSuggestions(condition || prescription?.condition || 'Dental Condition');

  const prescriptionDateFormatted = prescription?.prescriptionDate
    ? new Date(prescription.prescriptionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="personal-prescription-wrapper"
      style={{
        marginTop: '24px',
        background: 'linear-gradient(180deg, #F0FDF9 0%, #E6FBF5 100%)',
        border: '1.5px solid #99E3D8',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 8px 30px rgba(0, 166, 166, 0.07)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative top-right ambient glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(0, 166, 166, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* HEADER SECTION */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid rgba(0, 166, 166, 0.2)',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
              flexShrink: 0
            }}
          >
            <Pill size={24} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 
                style={{
                  margin: 0,
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#17324D',
                  letterSpacing: '-0.3px'
                }}
              >
                Personal Prescription
              </h3>
            </div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginTop: '4px',
                fontSize: '0.85rem',
                color: '#52677A',
                fontWeight: 600,
                flexWrap: 'wrap'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="#00A6A6" /> Date: {prescriptionDateFormatted}
              </span>
              {isVerified && prescription?.doctorName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0F766E' }}>
                  <UserCheck size={14} /> Prescribed by: {prescription.doctorName}
                  {prescription.doctorSpecialization ? ` (${prescription.doctorSpecialization})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STATUS BADGE & ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isVerified ? (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.86rem',
                fontWeight: 800,
                background: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)'
              }}
            >
              <ShieldCheck size={16} /> Dentist Approved
            </span>
          ) : (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.86rem',
                fontWeight: 800,
                background: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FCD34D',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.1)'
              }}
            >
              <Clock size={16} /> Awaiting Dentist Review
            </span>
          )}

          {isVerified && (
            <button
              onClick={handlePrint}
              type="button"
              className="btn-print-prescription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: '#FFFFFF',
                color: '#00A6A6',
                border: '1px solid #99E3D8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0, 166, 166, 0.08)'
              }}
              title="Print official prescription"
            >
              <Printer size={15} /> Print
            </button>
          )}
        </div>
      </div>

      {/* TWO-COLUMN GRID (Medications Left, Additional Care Right) */}
      <div 
        className="prescription-grid-two-col"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}
      >
        {/* COLUMN 1: MEDICATIONS / PHARMACEUTICAL SECTION */}
        <div 
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(0, 166, 166, 0.18)',
            padding: '22px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', borderRadius: '8px', padding: '6px' }}>
              <Pill size={18} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
              {isVerified ? 'Prescribed Medications' : 'Medications'}
            </h4>
          </div>

          {isVerified ? (
            /* VERIFIED MEDICATIONS LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {prescription.medications.map((med, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderLeft: '4px solid #00A6A6',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                      {med.medicineName}
                    </h5>
                    <span 
                      style={{
                        background: 'rgba(0, 166, 166, 0.12)',
                        color: '#00777C',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {med.dosage}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: med.instructions ? '6px' : '0' }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                      <strong>Frequency:</strong> {med.frequency}
                    </span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                      <strong>Duration:</strong> {med.duration}
                    </span>
                  </div>

                  {med.instructions && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic', lineHeight: 1.4 }}>
                      Note: {med.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* PRE-VERIFICATION SAFE NOTICE */
            <div 
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                background: '#FEFCE8',
                border: '1px dashed #FDE047',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(217, 119, 6, 0.12)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <AlertCircle size={22} />
              </div>
              <h5 style={{ margin: '0 0 6px 0', fontSize: '0.96rem', fontWeight: 800, color: '#92400E' }}>
                Dentist Verification Required
              </h5>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#78350F', lineHeight: 1.45, fontWeight: 500 }}>
                Your AI screening is complete. A dentist must review your results before a personal prescription can be issued.
              </p>
              <div 
                style={{
                  fontSize: '0.78rem',
                  color: '#A16207',
                  background: '#FEF9C3',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  lineHeight: 1.4
                }}
              >
                Specific pharmaceuticals, therapeutic dosages, and treatment durations are only prescribed following professional clinical evaluation.
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: ADDITIONAL CARE INSTRUCTIONS SECTION */}
        <div 
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(0, 166, 166, 0.18)',
            padding: '22px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', borderRadius: '8px', padding: '6px' }}>
              <ShieldCheck size={18} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
              Additional Care Instructions
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {isVerified && prescription?.additionalInstructions ? (
              /* DENTIST'S SPECIFIC INSTRUCTIONS */
              <div 
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#166534',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  fontWeight: 500
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '6px', color: '#15803D' }}>
                  <CheckCircle2 size={16} /> Specialist Instructions
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                  {prescription.additionalInstructions}
                </p>
              </div>
            ) : null}

            {/* SAFE ORAL-CARE GUIDANCE (Safe for both pending and verified states) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(careData.precautions || [
                'Brush twice daily using a soft-bristled toothbrush and fluoride toothpaste.',
                'Floss gently between teeth once daily to remove plaque.',
                'Rinse with warm saline water to soothe sensitive oral tissues.',
                'Avoid excessively hot, acidic, or sugary foods.'
              ]).slice(0, 4).map((tip, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.86rem',
                    color: '#334155',
                    lineHeight: 1.45
                  }}
                >
                  <div 
                    style={{
                      background: 'rgba(0, 166, 166, 0.1)',
                      color: '#00A6A6',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    ✓
                  </div>
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            {/* CALL TO ACTION (When unverified) */}
            {!isVerified && (
              <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                <Link
                  to="/dashboard/patient/recommended-doctors"
                  state={{ condition }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                    color: '#FFFFFF',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Stethoscope size={16} /> Connect with Dentist for Prescription <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT-ONLY FORMAL PRESCRIPTION SHEET (Visible only during window.print) */}
      <div className="print-prescription-sheet" style={{ display: 'none' }}>
        <div style={{ borderBottom: '2px solid #00A6A6', paddingBottom: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#00A6A6' }}>DentaAI Specialist Clinic</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>AI-Powered Dental Screening & Clinical Diagnostics</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{prescription?.doctorName || 'Attending Dentist'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{prescription?.doctorSpecialization || 'Dental Specialist'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Date: {prescriptionDateFormatted}</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px' }}><strong>Patient Name:</strong> {prescription?.patientName || 'Patient'}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}><strong>Condition Assessed:</strong> {prescription?.condition || condition || 'Dental Assessment'}</p>
        </div>

        <h3 style={{ margin: '16px 0 8px 0', fontSize: '15px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '4px' }}>
          Rx — Prescribed Medications
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>#</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>Medication Name</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>Dosage</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>Frequency</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>Duration</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0' }}>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {(prescription?.medications || []).map((m, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{idx + 1}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{m.medicineName}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{m.dosage}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{m.frequency}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{m.duration}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{m.instructions || 'As advised'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {prescription?.additionalInstructions && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>Care Instructions:</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{prescription.additionalInstructions}</p>
          </div>
        )}

        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', minWidth: '200px', borderTop: '1px solid #94A3B8', paddingTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>Authorized Doctor Signature</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{prescription?.doctorName || 'Dentist'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalPrescriptionSection;

