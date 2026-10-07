import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, CreditCard, MessageSquare, Eye, Download, Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import '../Dashboard.css';

const PatientConsultations = () => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const predictionResult = location.state?.predictionResult;

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/consultations');
        if (!res.ok) throw new Error('Failed to fetch consultations');
        const data = await res.json();
        setConsultations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultations();
  }, []);

  const getStatusType = (status) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return 'success';
      case 'Payment Requested':
      case 'Pending':
        return 'warning';
      case 'Accepted':
      case 'In Consultation':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const generatePDF = (cons) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(0, 160, 255); 
    doc.text("DentaAI Clinical Report", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Date: ${cons.date || 'N/A'}`, 105, 30, null, null, "center");
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Consultation Details", 20, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(`Patient Name: ${cons.patientName || 'Unknown'}`, 20, 55);
    doc.text(`Attending Specialist: ${cons.doctorName || cons.doctor || 'Unknown'}`, 20, 65);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("AI Diagnostic Prediction", 20, 80);
    
    doc.setFontSize(12);
    doc.setTextColor(60);
    const aiCondition = cons.scanId?.condition?.replace('_', ' ') || cons.condition || 'N/A';
    doc.text(`Identified Pathology: ${aiCondition}`, 20, 90);
    
    const confidence = cons.scanId?.confidence || cons.confidence || 'N/A';
    doc.text(`Algorithmic Confidence: ${confidence}%`, 20, 100);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Clinical Verification", 20, 115);
    
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text("Final Diagnosis:", 20, 125);
    
    const splitDiagnosis = doc.splitTextToSize(cons.finalDiagnosis || 'None provided', 170);
    doc.text(splitDiagnosis, 20, 135);
    
    let currentY = 135 + (splitDiagnosis.length * 7);
    
    doc.text("Treatment Plan & Prescription:", 20, currentY + 10);
    const splitTreatment = doc.splitTextToSize(cons.treatmentPlan || 'None provided', 170);
    doc.text(splitTreatment, 20, currentY + 20);
    
    currentY = currentY + 20 + (splitTreatment.length * 7);
    
    const imagePath = cons.scanId?.imagePath;
    if (imagePath && imagePath !== 'uploaded_image') {
      doc.text("Uploaded Intraoral Scan:", 20, currentY + 10);
      
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
      
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
        
        doc.addImage(dataUrl, "JPEG", 20, currentY + 20, maxW, h);
        doc.save(`DentaAI_Report_${cons.id}.pdf`);
      };
      
      img.onerror = () => {
        doc.save(`DentaAI_Report_${cons.id}.pdf`);
      };
    } else {
      doc.save(`DentaAI_Report_${cons.id}.pdf`);
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <motion.div 
        variants={item} 
        className="mb-8" 
        style={{ 
          background: 'var(--bg-secondary)', 
          padding: '32px 40px', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className="flex-between">
            <div>
              <h2 className="font-extrabold mb-2" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>My Consultations</h2>
              <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>View and manage your dental consultations.</p>
            </div>
            <Link to="/dashboard/patient/recommended-doctors" state={{ predictionResult }} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>
              Find New Doctor
            </Link>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary)" />
        </div>
      ) : consultations.length === 0 ? (
        <motion.div variants={item} className="card text-center mb-6" style={{ padding: '80px 20px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              <Clock size={48} className="text-secondary" />
            </div>
          </div>
          <h3 className="mb-3 font-extrabold text-primary" style={{ fontSize: '1.5rem' }}>No Consultations Yet</h3>
          <p className="text-muted mb-8 font-medium" style={{ fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 32px' }}>Your dental consultations will appear here.</p>
          <Link to="/dashboard/patient/recommended-doctors" state={{ predictionResult }} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', padding: '0 32px', height: '56px', borderRadius: '999px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>Book a Consultation</Link>
        </motion.div>
      ) : (
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {consultations.map(cons => {
            const doctorName = cons?.doctorName || cons?.doctor || 'Unknown Doctor';
            const clinicName = cons?.doctorSpecialization || cons?.clinic || 'DentaAI Specialist';
            const condition = cons?.condition || 'General checkup';
            const dateStr = cons?.date || 'N/A';
            const timeStr = cons?.time || '';
            const fee = cons?.fee || cons?.totalAmount || 0;
            const status = cons?.status || 'Pending';
            const statusType = cons?.statusType || getStatusType(status);
            const isCompleted = status === 'Completed' || status === 'Verified';

            return (
              <div key={cons._id || cons.id || 'cons'} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'stretch' }}>
                
                {/* LEFT: DOCTOR & BASIC INFO */}
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Doctor Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                      {doctorName.charAt(0) === 'D' && doctorName.charAt(1) === 'r' ? doctorName.charAt(3) || 'D' : doctorName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{doctorName}</h4>
                      <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>{clinicName}</p>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span className={`badge bg-${statusType}-light text-${statusType}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800 }}>
                        {status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Consultation Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Condition</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{condition.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Schedule</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {dateStr} {timeStr && `| ${timeStr}`}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fee</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>₹{fee}</strong>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'auto' }}>
                    {status === 'Payment Requested' && (
                      <Link to="/dashboard/patient/payments" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 'bold' }}>
                        <CreditCard size={16} /> Pay Now
                      </Link>
                    )}
                    {(status === 'Accepted' || status === 'In Consultation') && (
                      <Link to="/dashboard/patient/messages" state={{ consultationId: cons.id }} className="btn btn-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 'bold' }}>
                        <MessageSquare size={16} /> Message Doctor
                      </Link>
                    )}
                    
                    {/* View Report is still a functional expansion option for uncompleted ones, or for checking notes if not rendered right */}
                    <button className="btn btn-outline" onClick={() => toggleRow(cons.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 'bold' }}>
                      <Eye size={16} /> {expandedRow === cons.id ? 'Hide Details' : 'View Details'}
                    </button>
                    
                    {isCompleted && (
                      <button className="btn btn-primary" onClick={() => generatePDF(cons)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0, 210, 255, 0.2)' }}>
                        <Download size={16} /> Download Report
                      </button>
                    )}
                  </div>
                  
                </div>

                {/* RIGHT: DOCTOR FINAL DIAGNOSIS OR AI PREDICTION */}
                {isCompleted ? (
                  <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--success)', flex: 1 }}>
                      <h5 style={{ color: 'var(--success)', margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} /> Doctor's Final Diagnosis
                      </h5>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 16px 0', lineHeight: '1.6', fontWeight: 500 }}>
                        {cons.finalDiagnosis || 'No specific diagnosis was documented.'}
                      </p>
                      
                      <h5 style={{ color: 'var(--success)', margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} /> Treatment Plan
                      </h5>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text)', margin: 0, lineHeight: '1.6', fontWeight: 500, whiteSpace: 'pre-line' }}>
                        {cons.treatmentPlan || 'No additional treatment plan was prescribed.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {expandedRow === cons.id ? (
                      <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
                          This consultation is currently marked as <strong style={{ color: `var(--${statusType})` }}>{status}</strong>. Please wait for the doctor to review your case and provide a final diagnosis.
                        </p>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--secondary)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h5 style={{ color: 'var(--secondary)', margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>AI Preliminary Prediction</h5>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text)', margin: 0, lineHeight: '1.6', fontWeight: 500 }}>
                          The AI originally predicted <strong style={{ textTransform: 'capitalize' }}>{condition.replace('_', ' ')}</strong>. The doctor will verify this condition and provide an updated diagnosis once the consultation completes.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PatientConsultations;
