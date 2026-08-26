import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, CreditCard, Lock, ShieldCheck, Smartphone, Landmark, Loader2 } from 'lucide-react';
import '../Dashboard.css';

const PatientPaymentCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor, consultationType, date, time, platformFee, message, predictionResult } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (!doctor) {
    return (
      <div className="dashboard-view" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Invalid Secure Session</h2>
        <p className="text-muted mb-4">You have accessed the secure checkout without an active session token.</p>
        <button onClick={() => navigate(-1)} className="btn btn-outline">Go Back</button>
      </div>
    );
  }

  const totalAmount = doctor.fee + (platformFee || 0);

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate secure network transaction delay
    setTimeout(() => {
      const txnId = `TXN-AI-${Math.floor(Math.random() * 1000000000)}`;
      
      const newConsultation = {
        id: Date.now().toString(),
        transactionId: txnId,
        patientName: "Jane Doe", 
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        condition: predictionResult?.condition?.replace('_', ' ') || "N/A",
        confidence: predictionResult ? `${predictionResult.confidence}%` : "N/A",
        recommendation: predictionResult?.recommendation || "",
        message: message || "",
        consultationType,
        date,
        time,
        fee: doctor.fee,
        platformFee,
        totalAmount,
        paymentStatus: "Verified",
        status: "Pending Request",
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
      localStorage.setItem('dental_consultations', JSON.stringify([...existing, newConsultation]));

      setTransactionId(txnId);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2500);
  };

  if (isSuccess) {
    return (
      <motion.div className="dashboard-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card glass-card text-center" style={{ maxWidth: '500px', padding: '4rem 2.5rem', border: '1px solid var(--success)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--bg-card))' }}>
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1, rotate: 360 }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-success mx-auto mb-6" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)' }}
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-primary mb-2" style={{ fontWeight: 800 }}>Transaction Verified</h2>
          <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
            Your encrypted booking for {consultationType.toLowerCase()} with <strong>{doctor.name}</strong> is confirmed.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', margin: '0 auto 24px', textAlign: 'left', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="text-muted">Total Authorized</span>
              <span className="font-bold text-primary">₹{totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Network Hash ID:</span>
              <span className="font-bold text-secondary">{transactionId}</span>
            </div>
          </div>
          <Link to="/dashboard/patient/consultations" className="btn btn-primary w-full btn-lg pulse-glow text-center" style={{ display: 'block' }}>
            Initialize Dashboard View
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <div className="flex-align-center gap-2 mb-2">
          <button onClick={() => navigate(-1)} className="text-muted hover:text-primary flex-align-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={16} /> Abort Transaction
          </button>
        </div>
        <h2>Secure Payment Gateway</h2>
        <p>End-to-end encrypted medical checkout.</p>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: Payment Methods */}
        <div className="dashboard-left-col">
          <motion.div variants={item} className="card glass-card mb-6" style={{ padding: '2.5rem' }}>
            <h4 className="mb-4" style={{ fontSize: '1.25rem' }}>Select Secure Protocol</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => setPaymentMethod('upi')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'upi' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'upi' ? 'rgba(0, 210, 255, 0.05)' : 'transparent', textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <Smartphone size={28} color={paymentMethod === 'upi' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'upi' ? 'font-bold text-primary' : 'text-muted'}`}>UPI Network</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => setPaymentMethod('card')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'card' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'card' ? 'rgba(0, 210, 255, 0.05)' : 'transparent', textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <CreditCard size={28} color={paymentMethod === 'card' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'card' ? 'font-bold text-primary' : 'text-muted'}`}>Credit Card</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => setPaymentMethod('netbanking')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'netbanking' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'netbanking' ? 'rgba(0, 210, 255, 0.05)' : 'transparent', textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <Landmark size={28} color={paymentMethod === 'netbanking' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'netbanking' ? 'font-bold text-primary' : 'text-muted'}`}>Net Banking</span>
              </motion.div>
            </div>

            <form onSubmit={handlePayment}>
              {paymentMethod === 'card' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="form-group mb-4">
                    <label className="form-label">Cardholder Identity</label>
                    <input type="text" className="form-input" placeholder="JOHN DOE" required />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label">Encrypted Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" className="form-input" placeholder="**** **** **** ****" required maxLength="19" />
                      <Lock size={18} className="text-secondary" style={{ position: 'absolute', right: '16px', top: '14px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input type="text" className="form-input" placeholder="00/00" required maxLength="5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Security Code (CVV)</label>
                      <input type="password" className="form-input" placeholder="***" required maxLength="4" />
                    </div>
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'upi' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <div className="form-group">
                    <label className="form-label">Virtual Payment Address (UPI ID)</label>
                    <input type="text" className="form-input" placeholder="patient@upi" required />
                  </div>
                  <p className="text-sm text-secondary mt-2 flex-align-center gap-1"><ShieldCheck size={14}/> Network ping will be sent to your device.</p>
                </motion.div>
              )}

              {paymentMethod === 'netbanking' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <div className="form-group">
                    <label className="form-label">Select Financial Institution</label>
                    <select className="form-input" required>
                      <option value="">Establish secure connection with...</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                    </select>
                  </div>
                </motion.div>
              )}

              <button 
                type="submit" 
                className={`btn btn-primary w-full btn-lg ${isProcessing ? '' : 'pulse-glow'}`} 
                disabled={isProcessing}
                style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}
              >
                {isProcessing ? (
                  <><Loader2 size={20} className="animate-spin" /> Establishing Secure Connection...</>
                ) : (
                  <><Lock size={20} /> Authorize Payment of ₹{totalAmount}</>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card border-none" style={{ background: 'var(--bg-dark)', color: 'white', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.2), transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span className="font-bold text-secondary" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Amount Due</span>
              <span className="font-bold" style={{ fontSize: '2.5rem', color: '#00f0ff', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}>
                ₹{totalAmount}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-between mb-3" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Doctor Consultation</span>
                <span className="font-bold text-white">₹{doctor.fee}</span>
              </div>
              <div className="flex-between mb-3" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Platform Encryption Fee</span>
                <span className="font-bold text-white">₹{platformFee}</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={item} className="card glass-card">
            <h4 className="font-bold mb-4 flex-align-center gap-2 text-primary" style={{ fontSize: '1.1rem' }}><ShieldCheck size={20} className="text-secondary" /> Data Integrity Confirmed</h4>
            <div className="text-sm" style={{ background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px' }}>
              <p className="mb-3"><strong className="text-primary">Specialist:</strong> {doctor.name} ({doctor.specialization})</p>
              <p className="mb-3"><strong className="text-primary">Facility:</strong> {doctor.clinic}</p>
              <p className="mb-3"><strong className="text-primary">Temporal Data:</strong> {date} @ {time}</p>
              <p className="mb-0"><strong className="text-primary">Protocol:</strong> {consultationType}</p>
            </div>
            
            <div style={{ marginTop: '20px', background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#b45309', fontSize: '13px', display: 'flex', gap: '10px' }}>
              <Info size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Simulation Notice</strong><br/>
                No physical currency is exchanged. This terminal executes a sandboxed demo sequence.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientPaymentCheckout;
