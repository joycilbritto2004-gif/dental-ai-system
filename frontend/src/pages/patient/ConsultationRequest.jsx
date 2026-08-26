import { useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, CheckCircle2, ChevronLeft, Calendar, Clock, Video, MessageSquare, ShieldCheck, Info } from 'lucide-react';
import '../Dashboard.css';

const ConsultationRequest = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const predictionResult = location.state?.predictionResult;

  const [message, setMessage] = useState('');
  const [consultationType, setConsultationType] = useState('Video Consultation');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const doctorsData = [
    { id: "1", name: "Dr. Ananya Sharma", specialization: "General & Cosmetic Dentist", fee: 500, clinic: "SmileCare Dental Clinic", loc: "Bengaluru, Karnataka" },
    { id: "2", name: "Dr. Rahul Nair", specialization: "Endodontist", fee: 700, clinic: "DentalCare Advanced Clinic", loc: "Kochi, Kerala" },
    { id: "3", name: "Dr. Priya Menon", specialization: "Orthodontist", fee: 600, clinic: "Perfect Smile Dental Centre", loc: "Mangaluru, Karnataka" },
    { id: "4", name: "Dr. Arjun Patel", specialization: "Oral & Maxillofacial Surgeon", fee: 900, clinic: "City Dental Hospital", loc: "Mumbai, Maharashtra" }
  ];

  const doc = doctorsData.find(d => d.id === id) || doctorsData[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard/patient/payment/checkout', {
      state: { doctor: doc, consultationType, date, time, message, predictionResult, platformFee: 49 }
    });
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <div className="flex-align-center gap-2 mb-2">
          <Link to={`/dashboard/patient/doctor/${doc.id}`} state={{ predictionResult }} className="text-muted hover:text-primary flex-align-center gap-1">
            <ChevronLeft size={16} /> Back to Profile
          </Link>
        </div>
        <h2>Request Consultation</h2>
        <p>Book a secure appointment with {doc.name}.</p>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: Request Form */}
        <div className="dashboard-left-col">
          <motion.form variants={item} className="card glass-card" onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            <div className="card-header mb-6">
              <h3>Consultation Details</h3>
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label text-muted">Selected Specialist</label>
              <div className="patient-meta-box" style={{ borderRadius: 'var(--radius-md)', padding: '16px', background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.05), transparent)', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                <h4 className="font-semibold text-primary" style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{doc.name}</h4>
                <p className="text-sm text-muted" style={{ margin: '0 0 8px 0' }}>{doc.specialization} &bull; {doc.clinic}</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>{doc.loc}</span>
                </div>
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Consultation Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConsultationType('Video Consultation')}
                  style={{ 
                    padding: '16px', border: `2px solid ${consultationType === 'Video Consultation' ? 'var(--secondary)' : 'var(--border-color)'}`,
                    borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    background: consultationType === 'Video Consultation' ? 'rgba(0, 210, 255, 0.05)' : 'transparent',
                    transition: 'all 0.3s'
                  }}
                >
                  <Video size={24} color={consultationType === 'Video Consultation' ? 'var(--secondary)' : 'var(--text-muted)'} />
                  <span className={consultationType === 'Video Consultation' ? 'font-semibold text-primary' : 'text-muted'}>Video Call</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConsultationType('Chat Consultation')}
                  style={{ 
                    padding: '16px', border: `2px solid ${consultationType === 'Chat Consultation' ? 'var(--secondary)' : 'var(--border-color)'}`,
                    borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    background: consultationType === 'Chat Consultation' ? 'rgba(0, 210, 255, 0.05)' : 'transparent',
                    transition: 'all 0.3s'
                  }}
                >
                  <MessageSquare size={24} color={consultationType === 'Chat Consultation' ? 'var(--secondary)' : 'var(--text-muted)'} />
                  <span className={consultationType === 'Chat Consultation' ? 'font-semibold text-primary' : 'text-muted'}>Text / Chat</span>
                </motion.div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Time</label>
                <input type="time" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Describe your concern (Optional)</label>
              <textarea className="form-input" rows="4" placeholder="Briefly describe your symptoms or reason for consultation..." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
            </div>
            
            {/* BOOKING SUMMARY */}
            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontWeight: 700 }}>Booking Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="text-muted">Doctor Fee</span>
                <span className="font-semibold text-primary">₹{doc.fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="text-muted">Platform Fee</span>
                <span className="font-semibold text-primary">₹49</span>
              </div>
              <hr style={{ borderTop: '1px dashed var(--border-color)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-bold text-primary">Total Amount</span>
                <span className="font-bold text-secondary" style={{ fontSize: '1.5rem' }}>₹{doc.fee + 49}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg mt-4 pulse-glow">
               Proceed to Secure Payment
            </button>
          </motion.form>
        </div>

        {/* RIGHT COLUMN: AI Report Attachment */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card glass-card">
            <div className="card-header">
              <h3>Attached AI Report</h3>
            </div>
            
            {predictionResult ? (
              <div className="prediction-result" style={{ padding: '24px', background: 'var(--bg-dark)', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
                
                <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff' }}>
                  <ShieldCheck size={24} /> AI Analysis Snapshot
                </h4>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Detected Anomaly</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginTop: '4px', textTransform: 'capitalize' }}>
                    {predictionResult.condition?.replace('_', ' ')}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#00f0ff' }}>{predictionResult.confidence}%</div>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${predictionResult.confidence}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }}></motion.div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.2)', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '12px', color: '#00f0ff', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> AI Recommendation
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                    {predictionResult.recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                <BrainCircuit size={48} className="text-muted mx-auto mb-4" />
                <h4 className="text-primary font-bold">No AI Analysis Attached</h4>
                <p className="text-sm text-muted mt-2" style={{ lineHeight: '1.6' }}>You are proceeding with a standard consultation without a preliminary AI scan.</p>
              </div>
            )}

            <p className="text-sm text-muted mt-6 text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck size={16} className="text-success" /> This health data is securely encrypted.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConsultationRequest;
