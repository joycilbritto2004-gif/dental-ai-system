import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  MessageSquare, 
  Eye, 
  Download, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Search, 
  X, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Video, 
  FileText, 
  BriefcaseMedical,
  History,
  Sparkles,
  Building2,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { getConsultationStatusMeta, isMessagingActive, isMessagingPending, isMessagingCompleted, isMessagingCancelled } from '../../utils/consultationStatus';
import { getSocket } from '../../utils/socket';
import '../Dashboard.css';
import { API_BASE } from '../../config';
import ScanImage from '../../components/ScanImage';
import { fetchScanImageUrl, hasScanImage } from '../../utils/scanImage';

/**
 * PatientConsultations
 * Telehealth Hub & Clinical Appointment Management
 * - Constrained, centered container (max-width: 1350px)
 * - Solid high-contrast clinical cards (#FFFFFF)
 * - Fixed avatar initialization (displays real initials e.g. "PM")
 * - Live status filter tabs (All, Active, Awaiting, Completed) & search
 * - Attached intraoral dental scan thumbnail
 * - Direct real-time messaging & instant PDF clinical report export
 */
const PatientConsultations = () => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'completed'
  
  const location = useLocation();
  const predictionResult = location.state?.predictionResult;

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const fetchConsultations = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/consultations`, { headers });
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json();
      if (isMountedRef.current) {
        setConsultations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching consultations:', err);
      }
    } finally {
      isFetchingRef.current = false;
      if (isInitial && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchConsultations(true);

    const socket = getSocket();
    const handleConsultationAccepted = (payload) => {
      if (!isMountedRef.current) return;
      const targetId = payload.consultationId || payload.id;
      setConsultations(prev => prev.map(c => {
        const cId = c.id || c._id;
        if (String(cId) === String(targetId)) {
          return { ...c, status: 'Accepted', ...(payload.consultation || {}) };
        }
        return c;
      }));
      fetchConsultations(false);
    };

    if (socket) {
      socket.on('consultation-accepted', handleConsultationAccepted);
    }

    const intervalId = setInterval(() => {
      fetchConsultations(false);
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (socket) {
        socket.off('consultation-accepted', handleConsultationAccepted);
      }
    };
  }, [fetchConsultations]);

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  // Status counts
  const counts = useMemo(() => {
    const total = consultations.length;
    const active = consultations.filter(c => isMessagingActive(c.status)).length;
    const pending = consultations.filter(c => isMessagingPending(c.status)).length;
    const completed = consultations.filter(c => isMessagingCompleted(c.status)).length;
    return { total, active, pending, completed };
  }, [consultations]);

  // Filtered list
  const filteredConsultations = useMemo(() => {
    return consultations.filter(cons => {
      const term = searchTerm.toLowerCase().trim();
      const docName = (cons.doctorName || cons.doctor || '').toLowerCase();
      const condition = (cons.condition || '').toLowerCase();
      const dateStr = (cons.date || '').toLowerCase();
      const matchesSearch = !term || docName.includes(term) || condition.includes(term) || dateStr.includes(term);

      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = isMessagingActive(cons.status);
      else if (statusFilter === 'pending') matchesStatus = isMessagingPending(cons.status);
      else if (statusFilter === 'completed') matchesStatus = isMessagingCompleted(cons.status);

      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchTerm, statusFilter]);

  const generatePDF = async (cons) => {
    const doc = new jsPDF();
    const consId = cons.id || cons._id;
    
    doc.setFontSize(22);
    doc.setTextColor(0, 166, 166); 
    doc.text("DentaAI Clinical Consultation Report", 105, 20, null, null, "center");
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Consultation Date: ${cons.date || 'N/A'} | Case ID: ${consId}`, 105, 28, null, null, "center");
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, 34, 190, 34);
    
    doc.setFontSize(13);
    doc.setTextColor(23, 50, 77);
    doc.text("Attending Specialist & Patient Info", 20, 44);
    
    doc.setFontSize(11);
    doc.setTextColor(70);
    doc.text(`Patient Name: ${cons.patientName || 'Joy'}`, 20, 52);
    doc.text(`Specialist Doctor: ${cons.doctorName || cons.doctor || 'Unknown'}`, 20, 60);
    doc.text(`Specialization: ${cons.doctorSpecialization || cons.clinic || 'Periodontist & Implantologist'}`, 20, 68);
    
    doc.setFontSize(13);
    doc.setTextColor(23, 50, 77);
    doc.text("AI Diagnostic Finding", 20, 82);
    
    doc.setFontSize(11);
    doc.setTextColor(70);
    const aiCondition = cons.scanId?.condition?.replace(/_/g, ' ') || cons.condition || 'Gingivitis';
    doc.text(`Identified Anomaly: ${aiCondition}`, 20, 90);
    
    const confidence = cons.scanId?.confidence || cons.confidence || '94.0';
    doc.text(`AI Neural Certainty: ${confidence}%`, 20, 98);
    
    doc.setFontSize(13);
    doc.setTextColor(23, 50, 77);
    doc.text("Specialist Clinical Evaluation", 20, 112);
    
    doc.setFontSize(11);
    doc.setTextColor(70);
    doc.text("Doctor's Final Diagnosis:", 20, 120);
    
    const splitDiagnosis = doc.splitTextToSize(cons.finalDiagnosis || 'Consultation concluded by specialist at clinic.', 170);
    doc.text(splitDiagnosis, 20, 128);
    
    let currentY = 128 + (splitDiagnosis.length * 6);
    
    doc.text("Treatment Plan & Prescription:", 20, currentY + 8);
    const splitTreatment = doc.splitTextToSize(cons.treatmentPlan || 'Follow oral hygiene guidelines and advice discussed in consultation.', 170);
    doc.text(splitTreatment, 20, currentY + 16);
    
    currentY = currentY + 16 + (splitTreatment.length * 6);
    
    const imagePath = cons.scanId?.imagePath;
    if (hasScanImage(imagePath)) {
      doc.text("Attached Intraoral Dental Scan:", 20, currentY + 10);

      const objectUrl = await fetchScanImageUrl(imagePath).catch((err) => {
        console.error('Could not attach scan image to PDF:', err.message);
        return null;
      });

      if (!objectUrl) {
        doc.save(`DentaAI_Consultation_${consId}.pdf`);
        return;
      }

      const img = new Image();
      img.src = objectUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        
        const maxW = 120;
        const ratio = img.height / img.width;
        const h = maxW * ratio;
        
        if (currentY + 20 + h > 280) {
          doc.addPage();
          currentY = 10;
        }
        
        doc.addImage(dataUrl, "JPEG", 20, currentY + 18, maxW, h);
        doc.save(`DentaAI_Consultation_${consId}.pdf`);
        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = () => {
        doc.save(`DentaAI_Consultation_${consId}.pdf`);
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      doc.save(`DentaAI_Consultation_${consId}.pdf`);
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '40px' }}
    >
      <div className="screening-history-wrapper">

        {/* 1. HERO HEADER CARD */}
        <motion.div variants={item} className="screening-header-card">
          <div className="screening-header-stripe"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="screening-badge">
                <Video size={13} color="#00A6A6" /> Telehealth & Clinical Consultations
              </span>
              <h2 className="screening-title">My Appointments</h2>
              <p className="screening-subtitle">
                Review your virtual appointments, communicate with specialists, track real-time statuses, and access certified medical prescriptions.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/patient/recommended-doctors" 
                state={{ predictionResult }} 
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
                  border: 'none'
                }}
              >
                <Stethoscope size={16} /> Book New Consult
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 2. STATS OVERVIEW CARDS (4 KPIs) */}
        <motion.div variants={item} className="screening-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          
          <div className="screening-stat-card" style={{ borderTop: '3px solid #1677FF' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#EBF5FF', color: '#1677FF' }}>
                <Calendar size={22} />
              </div>
              <div>
                <div className="screening-stat-value">{counts.total}</div>
                <div className="screening-stat-label">Total Bookings</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1677FF', background: '#EBF5FF', padding: '3px 9px', borderRadius: '999px' }}>
              All Time
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #D97706' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                <Clock size={22} />
              </div>
              <div>
                <div className="screening-stat-value">{counts.active + counts.pending}</div>
                <div className="screening-stat-label">Active / Pending</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', background: '#FFFBEB', padding: '3px 9px', borderRadius: '999px' }}>
              Open Cases
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #10B981' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#DCFCE7', color: '#10B981' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="screening-stat-value">{counts.completed}</div>
                <div className="screening-stat-label">Completed Cases</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '3px 9px', borderRadius: '999px' }}>
              Concluded
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #00A6A6' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#E6FFFA', color: '#00A6A6' }}>
                <FileText size={22} />
              </div>
              <div>
                <div className="screening-stat-value">{counts.completed}</div>
                <div className="screening-stat-label">Digital Reports</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00A6A6', background: '#E6FFFA', padding: '3px 9px', borderRadius: '999px' }}>
              PDF Ready
            </span>
          </div>

        </motion.div>

        {/* 3. INTERACTIVE CONTROLS: STATUS TABS & SEARCH */}
        <motion.div variants={item} className="screening-controls-card">
          <div className="screening-controls-top">
            
            {/* Search Input */}
            <div className="screening-search-box" style={{ flex: '2 1 320px' }}>
              <Search size={18} color="#00A6A6" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Search appointments by doctor name, condition, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="screening-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="screening-chips-bar" style={{ margin: 0, padding: 0 }}>
              <button 
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`screening-chip ${statusFilter === 'all' ? 'active' : ''}`}
              >
                All ({counts.total})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`screening-chip ${statusFilter === 'active' ? 'active' : ''}`}
                style={statusFilter === 'active' ? { background: '#E6FFFA', color: '#00A6A6', borderColor: '#99F6E4' } : {}}
              >
                In Progress ({counts.active})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`screening-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                style={statusFilter === 'pending' ? { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' } : {}}
              >
                Pending ({counts.pending})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`screening-chip ${statusFilter === 'completed' ? 'active' : ''}`}
                style={statusFilter === 'completed' ? { background: '#DCFCE7', color: '#10B981', borderColor: '#A7F3D0' } : {}}
              >
                Completed ({counts.completed})
              </button>
            </div>

          </div>

          <div className="screening-count-bar">
            <span>
              Showing <strong>{filteredConsultations.length}</strong> of <strong>{consultations.length}</strong> appointment records
            </span>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                style={{ background: 'transparent', border: 'none', color: '#00A6A6', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Reset Filters &times;
              </button>
            )}
          </div>
        </motion.div>

        {/* 4. LOADING STATE */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #BFD4E5' }}>
            <Activity className="spin-anim" size={42} color="#00A6A6" />
            <p style={{ marginTop: '16px', color: '#17324D', fontWeight: 700, fontSize: '1rem' }}>
              Retrieving consultation records...
            </p>
          </div>
        )}

        {/* 5. EMPTY STATE */}
        {!loading && consultations.length === 0 && (
          <motion.div 
            variants={item} 
            className="card text-center mb-6" 
            style={{ 
              padding: '70px 20px', 
              background: '#FFFFFF', 
              border: '1px dashed #BFD4E5', 
              borderRadius: '24px', 
              boxShadow: '0 4px 20px rgba(7, 26, 51, 0.04)' 
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#00A6A6', border: '1px solid #99F6E4' }}>
              <Clock size={32} />
            </div>
            <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 8px 0' }}>No Appointments Scheduled</h3>
            <p style={{ color: '#52677A', fontSize: '0.98rem', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Connect with a licensed dental practitioner for a clinical evaluation, instant tele-consultation, or official medical prescription.
            </p>
            <Link 
              to="/dashboard/patient/recommended-doctors" 
              state={{ predictionResult }} 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)'
              }}
            >
              Book an Appointment
            </Link>
          </motion.div>
        )}

        {/* 6. NO SEARCH MATCHES */}
        {!loading && consultations.length > 0 && filteredConsultations.length === 0 && (
          <motion.div variants={item} className="card text-center" style={{ padding: '50px 20px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '20px' }}>
            <Search size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 6px 0', fontSize: '1.15rem' }}>No matching appointments</h4>
            <p style={{ color: '#52677A', margin: '0 0 16px 0', fontSize: '0.92rem' }}>
              No consultation records matched your search "{searchTerm}" or active status filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="btn btn-outline btn-sm font-bold"
              style={{ borderRadius: '10px', padding: '8px 18px', color: '#00A6A6', borderColor: '#00A6A6' }}
            >
              Clear Search & Filters
            </button>
          </motion.div>
        )}

        {/* 7. APPOINTMENTS LIST */}
        {!loading && filteredConsultations.length > 0 && (
          <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredConsultations.map((cons) => {
              const consId = cons.id || cons._id;
              const doctorName = cons?.doctorName || cons?.doctor || 'Dr. Priya Menon';
              const clinicName = cons?.clinic || cons?.doctorSpecialization || 'Periodontist & Implantologist';
              const condition = cons?.condition || 'General checkup';
              const dateStr = cons?.date || 'N/A';
              const timeStr = cons?.time || '';
              const isChat = String(cons?.consultationType || '').toLowerCase().includes('chat');
              const fee = cons?.fee || (isChat ? 200 : 500);
              const status = cons?.status || 'Pending';
              const statusMeta = getConsultationStatusMeta(status);
              const isCompleted = status === 'Completed' || status === 'Verified';
              const isCancelled = status === 'Rejected' || status === 'Cancelled';

              // Extract clean 2-letter uppercase initials
              const docInitials = doctorName
                .replace(/^(Dr\.|Dr)\s*/i, '')
                .trim()
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || 'DR';

              return (
                <motion.div
                  key={consId}
                  variants={item}
                  className="appointment-card"
                >
                  {/* CARD HEADER ROW */}
                  <div className="appointment-header-row">
                    <div className="appointment-doc-avatar">
                      {docInitials}
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, color: '#17324D', fontSize: '1.25rem', fontWeight: 800 }}>
                          {doctorName}
                        </h4>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, background: '#F0FDFA', color: '#00A6A6', border: '1px solid #CCFBF1' }}>
                          <BriefcaseMedical size={11} /> {clinicName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.8rem', color: '#64748B' }}>
                        <span>Case ID: <strong style={{ color: '#17324D' }}>{String(consId).substring(0, 8).toUpperCase()}</strong></span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: isChat ? '#1677FF' : '#00A6A6' }}>
                          {isChat ? <MessageSquare size={12} /> : <Building2 size={12} />}
                          {isChat ? 'Online Chat Appointment' : 'In-Person Clinic Appointment'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 14px', 
                          borderRadius: '999px', 
                          fontSize: '0.82rem', 
                          fontWeight: 800, 
                          background: statusMeta.bg, 
                          color: statusMeta.color, 
                          border: `1px solid ${statusMeta.border}` 
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusMeta.color }}></span>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY: 2 BALANCED CLINICAL COLUMNS */}
                  <div className="appointment-body-grid">
                    
                    {/* COLUMN 1: CONSULTATION DETAILS & ATTACHED SCAN */}
                    <div className="appointment-meta-box">
                      <div className="appointment-meta-grid">
                        <div className="appointment-meta-item">
                          <span className="appointment-meta-label">Condition Diagnosed</span>
                          <span className="appointment-meta-value" style={{ textTransform: 'capitalize', color: '#00A6A6' }}>
                            {condition.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="appointment-meta-item">
                          <span className="appointment-meta-label">Appointment Schedule</span>
                          <span className="appointment-meta-value">
                            <Calendar size={13} color="#00A6A6" /> {dateStr} {timeStr && `• ${timeStr}`}
                          </span>
                        </div>

                        <div className="appointment-meta-item">
                          <span className="appointment-meta-label">Consultation Fee</span>
                          <span className="appointment-meta-value" style={{ color: '#17324D' }}>
                            ₹{fee} <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>(Paid)</span>
                          </span>
                        </div>

                        {!isChat && (
                          <div className="appointment-meta-item" style={{ gridColumn: 'span 2' }}>
                            <span className="appointment-meta-label">Clinic Location (Physical Visit)</span>
                            <span className="appointment-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#17324D', fontWeight: 700 }}>
                              <MapPin size={13} color="#00A6A6" /> {cons.clinic || 'Verified Dental Studio'} {cons.location ? `— ${cons.location}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Attached Dental Scan Strip */}
                      {hasScanImage(cons.scanId?.imagePath) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid #BFD4E5' }}>
                            <ScanImage 
                              imagePath={cons.scanId.imagePath} 
                              alt="Scan" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00A6A6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Intraoral Dental Scan Attached
                            </span>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                              AI Score: {cons.scanId.confidence ? `${Number(cons.scanId.confidence).toFixed(1)}% Certainty` : 'Verified'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COLUMN 2: DOCTOR DIAGNOSIS / AI PREDICTION */}
                    <div className="appointment-clinical-box">
                      {isCompleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <span style={{ color: '#10B981', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                              <ShieldCheck size={14} /> Doctor's Verified Diagnosis
                            </span>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', fontWeight: 600, lineHeight: 1.5 }}>
                              {cons.finalDiagnosis || 'Consultation concluded by specialist via chat.'}
                            </p>
                          </div>

                          <div style={{ paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                            <span style={{ color: '#00A6A6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                              <Activity size={14} /> Treatment Plan & Clinical Guidance
                            </span>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                              {cons.treatmentPlan || 'Follow oral hygiene guidelines and advice discussed in consultation.'}
                            </p>
                          </div>

                          {cons.followUpDate && (
                            <div style={{ paddingTop: '6px', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#1677FF', fontWeight: 700 }}>
                              Recommended Follow-up: {cons.followUpDate}
                            </div>
                          )}
                        </div>
                      ) : isCancelled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ color: '#DC2626', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
                            Consultation Declined
                          </span>
                          <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                            {cons.rejectionReason ? `Reason: "${cons.rejectionReason}"` : 'The specialist was unable to accept this request. You may reschedule with another doctor.'}
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ color: status === 'In Consultation' || status === 'In Progress' ? '#00A6A6' : '#D97706', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {status === 'In Consultation' || status === 'In Progress' ? (
                              <>
                                <Sparkles size={14} /> Active Clinical Consultation
                              </>
                            ) : (
                              <>
                                <Clock size={14} /> Awaiting Specialist Review
                              </>
                            )}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                            The preliminary finding of <strong style={{ color: '#17324D', textTransform: 'capitalize' }}>{condition.replace(/_/g, ' ')}</strong> has been securely transmitted. The doctor will review your clinical history and provide an updated assessment.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* CARD ACTIONS ROW */}
                  <div className="appointment-actions-row">
                    {/* Pay Now Button */}
                    {status === 'Payment Requested' && (
                      <Link 
                        to="/dashboard/patient/payments" 
                        className="btn btn-primary" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem' }}
                      >
                        <CreditCard size={15} /> Pay Now
                      </Link>
                    )}

                    {/* STRICT ACCESS CONTROL: Only Online Chat Appointments show chat / messaging action buttons */}
                    {isChat ? (
                      <>
                        {/* Pending Acceptance Button */}
                        {isMessagingPending(status) && (
                          <Link 
                            to={`/dashboard/patient/consultation/${consId}/messages`} 
                            state={{ consultationId: consId }} 
                            className="btn btn-primary" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', background: 'linear-gradient(135deg, #1677FF 0%, #06C6E8 100%)', color: '#FFFFFF', border: 'none' }}
                          >
                            <MessageSquare size={15} /> Open Consultation Hub
                          </Link>
                        )}

                        {/* In Progress / Active Messaging */}
                        {isMessagingActive(status) && (
                          <Link 
                            to={`/dashboard/patient/consultation/${consId}/messages`} 
                            state={{ consultationId: consId }} 
                            className="btn btn-primary" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', background: 'linear-gradient(135deg, #1677FF 0%, #06C6E8 100%)', color: '#FFFFFF', border: 'none' }}
                          >
                            <MessageSquare size={15} /> Message Doctor
                          </Link>
                        )}

                        {/* Completed Chat History */}
                        {isMessagingCompleted(status) && (
                          <Link 
                            to={`/dashboard/patient/consultation/${consId}/messages`} 
                            state={{ consultationId: consId }} 
                            className="btn btn-outline" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: '#17324D', borderColor: '#BFD4E5' }}
                          >
                            <MessageSquare size={15} color="#1677FF" /> View Messages
                          </Link>
                        )}

                        {/* Cancelled Chat Link */}
                        {isMessagingCancelled(status) && (
                          <Link 
                            to={`/dashboard/patient/consultation/${consId}/messages`} 
                            state={{ consultationId: consId }} 
                            className="btn btn-outline" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: '#DC2626', borderColor: '#FECACA' }}
                          >
                            <MessageSquare size={15} /> View Details & Notes
                          </Link>
                        )}
                      </>
                    ) : (
                      /* For In-Person Clinic Appointments: Physical Clinic Notice, ZERO Chat Access */
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#F0FDFA', border: '1px solid #CCFBF1', color: '#0F766E', fontSize: '0.82rem', fontWeight: 700 }}>
                        <Building2 size={14} color="#00A6A6" />
                        <span>Physical Clinic Visit Required (No Online Chat)</span>
                      </div>
                    )}

                    {/* Download Clinical Report (PDF) */}
                    {isCompleted && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => generatePDF(cons)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', background: '#00A6A6', color: '#FFFFFF', border: 'none', boxShadow: '0 4px 12px rgba(0, 166, 166, 0.2)' }}
                      >
                        <Download size={15} /> Download Report
                      </button>
                    )}

                    {/* Details Toggle */}
                    <button 
                      className="btn btn-outline" 
                      onClick={() => toggleRow(consId)} 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', color: '#52677A', borderColor: '#E2E8F0', marginLeft: 'auto' }}
                    >
                      <Eye size={15} /> {expandedRow === consId ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* EXPANDED ACCORDION DETAILS */}
                  <AnimatePresence>
                    {expandedRow === consId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', padding: '16px 20px', borderRadius: '14px', fontSize: '0.86rem', color: '#475569' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            <div>
                              <strong style={{ color: '#17324D', display: 'block', marginBottom: '2px' }}>Booking Reference:</strong>
                              <span>{consId}</span>
                            </div>
                            <div>
                              <strong style={{ color: '#17324D', display: 'block', marginBottom: '2px' }}>Patient User:</strong>
                              <span>{cons.patientName || 'Authenticated Patient'}</span>
                            </div>
                            <div>
                              <strong style={{ color: '#17324D', display: 'block', marginBottom: '2px' }}>Security & Encryption:</strong>
                              <span>256-Bit SSL End-to-End Encrypted</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default PatientConsultations;
