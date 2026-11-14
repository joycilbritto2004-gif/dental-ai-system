import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Landmark,
  Loader2,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Building2,
  MapPin,
  Sparkles,
  BrainCircuit,
  FileText,
  BadgeCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const PatientPaymentCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Persist and restore checkout state across browser refreshes
  const [sessionData] = useState(() => {
    if (location.state && location.state.doctor) {
      sessionStorage.setItem('dentaai_checkout_session', JSON.stringify(location.state));
      return location.state;
    }
    const saved = sessionStorage.getItem('dentaai_checkout_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved checkout session', e);
      }
    }
    return {};
  });

  const { doctor, consultationType = 'In-Person Clinic Visit', date, time, message, predictionResult } = sessionData;

  // Preserve active scan across page refreshes or route transitions
  const activeScan = predictionResult || (() => {
    const savedScan = sessionStorage.getItem('dentaai_active_scan');
    if (savedScan) {
      try {
        return JSON.parse(savedScan);
      } catch (e) {
        console.error('Failed to parse saved active scan', e);
      }
    }
    return null;
  })();

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdConsultationId, setCreatedConsultationId] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [slotConflictError, setSlotConflictError] = useState(null);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!doctor) {
    return (
      <div className="dashboard-view" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center" style={{ maxWidth: '440px', padding: '40px 24px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #BFD4E5' }}>
          <AlertCircle size={48} color="#00A6A6" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#17324D', marginBottom: '12px' }}>Session Expired</h2>
          <p style={{ color: '#52677A', marginBottom: '24px', fontSize: '0.95rem' }}>Your checkout session could not be found or has expired. Please select a specialist to begin.</p>
          <button onClick={() => navigate('/dashboard/patient/recommended-doctors')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px' }}>
            <ChevronLeft size={16} /> Choose a Specialist
          </button>
        </div>
      </div>
    );
  }

  const isChat = String(consultationType || '').toLowerCase().includes('chat');
  const docFee = isChat ? 200 : 500;
  const platformFee = 49;
  const totalAmount = docFee + platformFee;

  // Generate doctor initials
  const initials = doctor.name
    ? doctor.name.replace(/^(Dr\.|Dr)\s*/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setSlotConflictError(null);
    
    try {
      const token = localStorage.getItem('dentaai_token');

      // Pre-check slot availability before initiating payment gateway
      if (date && time) {
        try {
          const checkRes = await fetch(`${API_BASE}/api/consultations/check-slot?doctorId=${doctor.id || doctor._id}&date=${date}&time=${time}`);
          const checkData = await checkRes.json();
          if (!checkRes.ok || checkData.available === false) {
            setSlotConflictError(checkData.message || `Dr. ${doctor.name} is no longer available at ${time} on ${date}. Please choose another slot.`);
            setIsProcessing(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Slot pre-check network issue:', checkErr.message);
        }
      }

      const orderRes = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: totalAmount })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

      let dynamicPatientName = "Patient";
      let dynamicPatientEmail = "patient@dentaai.com";
      let dynamicPatientContact = "9999999999";
      let dynamicPatientId = undefined;
      const userStr = localStorage.getItem('dentaai_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        dynamicPatientName = user.name || user.firstName || user.username || "Patient";
        dynamicPatientId = user._id || user.id;
        if (user.email) dynamicPatientEmail = user.email;
        if (user.phone) dynamicPatientContact = user.phone;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_ThUYucTjYw8zFR', 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DentaAI Clinical Services",
        description: `Consultation with ${doctor.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify signature on backend
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.verified) {
               // Proceed to create consultation in database
               const txnId = response.razorpay_payment_id;
               const scanMongoId = activeScan ? (activeScan._id || activeScan.id) : undefined;
               
               const newConsultation = {
                 id: Date.now().toString(),
                 transactionId: txnId,
                 patientId: dynamicPatientId,
                 patientName: dynamicPatientName, 
                 doctorId: doctor.id || doctor._id,
                 doctorName: doctor.name,
                 doctorSpecialization: doctor.specialization,
                 scanId: scanMongoId,
                 condition: activeScan?.condition ? activeScan.condition.replace(/_/g, ' ') : "General Dental Consultation",
                 confidence: activeScan?.confidence ? (String(activeScan.confidence).includes('%') ? activeScan.confidence : `${activeScan.confidence}%`) : "N/A",
                 recommendation: activeScan?.recommendation || "",
                 message: message || "",
                 consultationType,
                 date: date || new Date().toISOString().split('T')[0],
                 time: time || '10:00',
                 fee: docFee,
                 platformFee,
                 totalAmount,
                 paymentStatus: "Paid",
                 status: "Pending",
                 createdAt: new Date().toISOString()
               };

               const consRes = await fetch(`${API_BASE}/api/consultations`, {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify(newConsultation),
               });
               
               if (!consRes.ok) {
                 const errJson = await consRes.json().catch(() => ({}));
                 if (consRes.status === 409) {
                   setSlotConflictError(errJson.message || 'This appointment slot has already been booked by another patient. Please choose another slot.');
                   setIsProcessing(false);
                   return;
                 }
                 throw new Error(errJson.message || 'Failed to create consultation record after payment');
               }

               const createdData = await consRes.json().catch(() => ({}));
               const newId = createdData?._id || createdData?.id;
               if (newId) setCreatedConsultationId(newId);

               // Clean up persisted booking cache on success
               sessionStorage.removeItem('dentaai_checkout_session');
               sessionStorage.removeItem('dentaai_active_scan');

               setTransactionId(txnId);
               setIsProcessing(false);
               setIsSuccess(true);
            } else {
               throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyErr) {
             console.error("Verification error:", verifyErr);
             setIsProcessing(false);
             alert("Payment verification failed or consultation could not be created.");
          }
        },
        prefill: {
          name: dynamicPatientName,
          email: dynamicPatientEmail,
          contact: dynamicPatientContact
        },
        theme: {
          color: "#00A6A6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         setIsProcessing(false);
         alert(response.error.description || 'Payment was cancelled or failed.');
      });
      rzp.open();

    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      setIsProcessing(false);
      alert("Failed to initialize payment gateway. Please try again.");
    }
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <motion.div className="dashboard-view checkout-page-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="checkout-success-card">
          
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1, rotate: 360 }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="success-icon-badge"
          >
            <CheckCircle2 size={44} color="#FFFFFF" />
          </motion.div>

          <span className="success-tag">Payment Verified &amp; Confirmed</span>
          <h2 className="success-title">
            {isChat ? 'Online Chat Appointment Confirmed!' : 'In-Person Clinic Appointment Confirmed!'}
          </h2>
          <p className="success-desc">
            {isChat ? (
              <>Your online chat consultation with <strong style={{ color: '#00A6A6' }}>{doctor.name}</strong> is scheduled. Chat messaging unlocks upon doctor acceptance.</>
            ) : (
              <>Your in-person dental appointment with <strong style={{ color: '#00A6A6' }}>{doctor.name}</strong> is scheduled at the clinic. Please attend physically.</>
            )}
          </p>

          {/* In-Person Physical Clinic Details Callout */}
          {!isChat && (
            <div style={{ background: '#F0FDFA', border: '1px solid #99E3D8', borderRadius: '12px', padding: '14px 18px', margin: '16px 0', textAlign: 'left', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0D9488', fontWeight: 800, marginBottom: '4px' }}>
                <Building2 size={16} /> Physical Clinic Address:
              </div>
              <div style={{ color: '#17324D', fontWeight: 700 }}>
                {doctor.clinic || 'Verified Dental Studio'}
              </div>
              <div style={{ color: '#52677A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#00A6A6" /> {doctor.location || 'Clinic Address on Record'}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#B45309', background: '#FEF3C7', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                <AlertCircle size={12} /> Physical visit required. In-person appointments do not include online chat.
              </div>
            </div>
          )}

          <div className="success-receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Amount Paid</span>
              <strong className="receipt-val price-val">₹{totalAmount}</strong>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Transaction Reference</span>
              <strong className="receipt-val">{transactionId || `TXN-${Date.now().toString().slice(-8)}`}</strong>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Consultation Mode</span>
              <strong className="receipt-val" style={{ textTransform: 'capitalize' }}>
                {isChat ? 'Online Chat Appointment' : 'In-Person Clinic Appointment'}
              </strong>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Scheduled Slot</span>
              <strong className="receipt-val">{date || 'Confirmed Today'} at {time || '10:00'}</strong>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Status</span>
              <span className="receipt-status-pill">Active • Doctor Notified</span>
            </div>
          </div>

          <div className="success-action-btns">
            {/* ONLY online chat appointments get the chat entry button */}
            {isChat && createdConsultationId ? (
              <Link 
                to={`/dashboard/patient/consultation/${createdConsultationId}/messages`} 
                state={{ consultationId: createdConsultationId }}
                className="btn-success-primary"
              >
                <span>Enter Chat Workspace</span>
                <ArrowRight size={18} />
              </Link>
            ) : null}

            <Link to="/dashboard/patient/consultations" className={isChat ? "btn-success-outline" : "btn-success-primary"}>
              <span>View Appointment Details</span>
              {!isChat && <ArrowRight size={18} />}
            </Link>
          </div>

        </div>
      </motion.div>
    );
  }

  // MAIN CHECKOUT SCREEN
  return (
    <motion.div className="dashboard-view checkout-page-view" initial="hidden" animate="show" variants={stagger}>
      
      {/* HEADER CARD */}
      <motion.div variants={item} className="checkout-header-card">
        <div className="checkout-header-top">
          <button onClick={() => navigate(-1)} className="checkout-back-btn">
            <ChevronLeft size={18} color="#00A6A6" /> Back to Details
          </button>

          <div className="checkout-step-indicator">
            <span className="step-pill-done">
              <CheckCircle2 size={13} color="#10B981" /> <strong>Step 1</strong> Details
            </span>
            <span className="step-arrow">→</span>
            <span className="step-pill-active">
              <strong>Step 2</strong> Secure Payment
            </span>
            <span className="checkout-security-pill">
              <Lock size={12} color="#10B981" /> 256-Bit SSL
            </span>
          </div>
        </div>

        <div className="checkout-header-content">
          <h1 className="checkout-header-title">Secure Checkout & Confirmation</h1>
          <p className="checkout-header-desc">
            Finalize your priority consultation slot with <strong style={{ color: '#00A6A6' }}>{doctor.name}</strong>.
          </p>
        </div>
      </motion.div>

      {/* SLOT CONFLICT BANNER */}
      {slotConflictError && (
        <div className="slot-conflict-banner" style={{ margin: '0 0 24px 0', borderLeft: '4px solid #DC2626' }}>
          <AlertCircle size={22} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>Appointment Slot Conflict</strong>
            <span>{slotConflictError}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/patient/consultations/request/${doctor.id || doctor._id}`)}
            className="btn btn-outline"
            style={{ background: '#FFFFFF', borderColor: '#DC2626', color: '#DC2626', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            Choose Another Slot
          </button>
        </div>
      )}

      {/* 2-COLUMN MAIN CHECKOUT GRID */}
      <div className="checkout-main-grid">

        {/* LEFT COLUMN: PAYMENT METHOD & GATEWAY */}
        <div className="checkout-left-col">
          <motion.div variants={item} className="checkout-form-card">
            
            <div className="checkout-section-header">
              <div className="checkout-section-icon-box">
                <CreditCard size={20} color="#00A6A6" />
              </div>
              <div>
                <h2 className="checkout-section-title">Payment Method</h2>
                <span className="checkout-section-subtitle">Select your preferred transaction mode</span>
              </div>
            </div>

            {/* 3 PAYMENT METHODS TABS */}
            <div className="checkout-methods-grid">
              
              {/* UPI */}
              <div
                className={`checkout-method-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
                role="button"
                tabIndex={0}
              >
                <div className="method-header-row">
                  <div className="method-icon-box upi-box">
                    <Smartphone size={22} color="#00A6A6" />
                  </div>
                  <span className="method-badge instant">Instant</span>
                </div>
                <h4 className="method-card-title">UPI / QR Code</h4>
                <p className="method-card-desc">GPay, PhonePe, Paytm, BHIM</p>
                <div className="method-radio">
                  <span className="method-radio-dot"></span>
                  <span className="method-radio-text">{paymentMethod === 'upi' ? 'Selected' : 'Select'}</span>
                </div>
              </div>

              {/* CARD */}
              <div
                className={`checkout-method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
                role="button"
                tabIndex={0}
              >
                <div className="method-header-row">
                  <div className="method-icon-box card-box">
                    <CreditCard size={22} color="#1677FF" />
                  </div>
                  <span className="method-badge cards">Credit / Debit</span>
                </div>
                <h4 className="method-card-title">Cards</h4>
                <p className="method-card-desc">Visa, Mastercard, RuPay</p>
                <div className="method-radio">
                  <span className="method-radio-dot"></span>
                  <span className="method-radio-text">{paymentMethod === 'card' ? 'Selected' : 'Select'}</span>
                </div>
              </div>

              {/* NET BANKING */}
              <div
                className={`checkout-method-card ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
                role="button"
                tabIndex={0}
              >
                <div className="method-header-row">
                  <div className="method-icon-box bank-box">
                    <Landmark size={22} color="#6366F1" />
                  </div>
                  <span className="method-badge banks">50+ Banks</span>
                </div>
                <h4 className="method-card-title">Net Banking</h4>
                <p className="method-card-desc">SBI, HDFC, ICICI & more</p>
                <div className="method-radio">
                  <span className="method-radio-dot"></span>
                  <span className="method-radio-text">{paymentMethod === 'netbanking' ? 'Selected' : 'Select'}</span>
                </div>
              </div>

            </div>

            {/* DYNAMIC METHOD FORM */}
            <form onSubmit={handlePayment} className="checkout-interactive-form">
              
              {/* UPI MODE */}
              {paymentMethod === 'upi' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="method-tab-panel">
                  <label className="checkout-field-label">Virtual Payment Address (VPA) / UPI ID</label>
                  
                  <div className="checkout-upi-app-strip">
                    <span className="upi-supported-pill">Google Pay</span>
                    <span className="upi-supported-pill">PhonePe</span>
                    <span className="upi-supported-pill">Paytm</span>
                    <span className="upi-supported-pill">BHIM</span>
                    <span className="upi-supported-pill">Cred UPI</span>
                  </div>

                  <div className="checkout-input-with-icon">
                    <Smartphone size={18} color="#00A6A6" className="input-inner-icon" />
                    <input
                      type="text"
                      className="checkout-text-input"
                      placeholder="e.g. mobile@okaxis or username@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <p className="checkout-helper-text">
                    💡 You can enter your UPI ID above or scan the instant QR code directly in the Razorpay payment window on the next screen.
                  </p>
                </motion.div>
              )}

              {/* CARD MODE */}
              {paymentMethod === 'card' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="method-tab-panel">
                  
                  <div className="checkout-field-group">
                    <label className="checkout-field-label">Cardholder Name</label>
                    <input
                      type="text"
                      className="checkout-text-input"
                      placeholder="Name as printed on card"
                    />
                  </div>

                  <div className="checkout-field-group">
                    <label className="checkout-field-label">Card Number</label>
                    <div className="checkout-input-with-icon">
                      <CreditCard size={18} color="#00A6A6" className="input-inner-icon" />
                      <input
                        type="text"
                        className="checkout-text-input"
                        placeholder="•••• •••• •••• ••••"
                        maxLength="19"
                      />
                      <Lock size={16} color="#10B981" className="input-end-icon" />
                    </div>
                  </div>

                  <div className="checkout-card-subgrid">
                    <div>
                      <label className="checkout-field-label">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="checkout-text-input"
                        placeholder="MM / YY"
                        maxLength="5"
                      />
                    </div>
                    <div>
                      <label className="checkout-field-label">CVV / CVC</label>
                      <input
                        type="password"
                        className="checkout-text-input"
                        placeholder="•••"
                        maxLength="4"
                      />
                    </div>
                  </div>

                </motion.div>
              )}

              {/* NET BANKING MODE */}
              {paymentMethod === 'netbanking' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="method-tab-panel">
                  <label className="checkout-field-label">Select Popular Bank</label>
                  
                  <div className="checkout-banks-strip">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'].map((b, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`bank-quick-pill ${selectedBank === b ? 'active' : ''}`}
                        onClick={() => setSelectedBank(b)}
                      >
                        <Landmark size={14} /> {b}
                      </button>
                    ))}
                  </div>

                  <div className="checkout-field-group" style={{ marginTop: '14px' }}>
                    <label className="checkout-field-label">Or Select Any Indian Bank</label>
                    <select
                      className="checkout-select-input"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra">Kotak Mahindra Bank</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Canara Bank">Canara Bank</option>
                      <option value="Union Bank of India">Union Bank of India</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* PAY BUTTON */}
              <button
                type="submit"
                className="checkout-pay-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Pay Securely ₹{totalAmount}</span>
                  </>
                )}
              </button>

            </form>

            {/* TRUST SEALS */}
            <div className="checkout-trust-seals-strip">
              <div className="trust-seal-item">
                <ShieldCheck size={16} color="#10B981" />
                <span>256-Bit Bank-Grade SSL</span>
              </div>
              <div className="trust-seal-item">
                <Sparkles size={16} color="#00A6A6" />
                <span>Instant Confirmation</span>
              </div>
              <div className="trust-seal-item">
                <CheckCircle2 size={16} color="#1677FF" />
                <span>100% Refund Guarantee</span>
              </div>
            </div>

          </motion.div>
        </div>

        {/* RIGHT COLUMN: CONSULTATION & ORDER SUMMARY */}
        <div className="checkout-right-col">
          
          {/* APPOINTMENT & SPECIALIST SUMMARY */}
          <motion.div variants={item} className="checkout-summary-card">
            
            <h3 className="summary-card-header">Consultation Summary</h3>

            {/* SPECIALIST CARD */}
            <div className="checkout-specialist-snippet">
              <div className="checkout-specialist-avatar">
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={doctor.name} className="specialist-avatar-img" />
                ) : (
                  <span className="specialist-avatar-initials">{initials}</span>
                )}
                <div className="specialist-badge-check">
                  <BadgeCheck size={15} color="#FFFFFF" fill="#00A6A6" />
                </div>
              </div>

              <div className="checkout-specialist-meta">
                <div className="specialist-name-row">
                  <h4>{doctor.name}</h4>
                  <span className="specialist-tag">BDS, MDS</span>
                </div>
                <p className="specialist-spec-text">{doctor.specialization || 'Dental Specialist'}</p>
                <p className="specialist-clinic-text">
                  <Building2 size={13} color="#00A6A6" /> {doctor.clinic || 'DentaAI Partner Dental Studio'}
                </p>
              </div>
            </div>

            {/* APPOINTMENT TIMING PILLS */}
            <div className="checkout-appointment-details">
              <div className="checkout-detail-row">
                <div className="detail-icon-wrap">
                  {isChat ? (
                    <MessageSquare size={16} color="#1677FF" />
                  ) : (
                    <Building2 size={16} color="#00A6A6" />
                  )}
                </div>
                <div>
                  <span className="detail-label">Mode of Session</span>
                  <strong className="detail-value">
                    {isChat ? 'Online Chat Appointment' : 'In-Person Clinic Appointment'}
                  </strong>
                  {!isChat && (
                    <div style={{ fontSize: '0.74rem', color: '#00A6A6', fontWeight: 600, marginTop: '2px' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: '2px' }} />
                      {doctor.clinic || 'Clinic Studio'} • Physical Visit Required
                    </div>
                  )}
                </div>
              </div>

              <div className="checkout-detail-row">
                <div className="detail-icon-wrap">
                  <Calendar size={16} color="#00A6A6" />
                </div>
                <div>
                  <span className="detail-label">Scheduled Date &amp; Time</span>
                  <strong className="detail-value">{date || 'Confirmed Today'} at {time || '10:00 AM'}</strong>
                </div>
              </div>
            </div>

            {/* ATTACHED SCAN SNAPSHOT (IF AVAILABLE) */}
            {activeScan && (
              <div className="checkout-scan-snapshot-box">
                <div className="scan-snapshot-header">
                  <BrainCircuit size={16} color="#00A6A6" />
                  <strong>Attached AI Scan Ready</strong>
                </div>
                <div className="scan-snapshot-body">
                  <div className="snapshot-condition-tag">
                    {activeScan.condition?.replace(/_/g, ' ') || activeScan.prediction || 'Gingivitis'}
                  </div>
                  <span className="snapshot-confidence-pill">
                    {String(activeScan.confidence).includes('%') ? activeScan.confidence : `${activeScan.confidence || 93.9}%`} AI Score
                  </span>
                </div>
                <p className="scan-snapshot-note">
                  Original radiograph pixels & condition metrics are linked to this consultation.
                </p>
              </div>
            )}

            {/* INVOICE / PRICE BREAKDOWN */}
            <div className="checkout-invoice-box">
              <div className="invoice-row">
                <span className="invoice-label">
                  Specialist Consultation Fee ({isChat ? 'Online Chat Appointment' : 'In-Person Clinic Appointment'})
                </span>
                <span className="invoice-val">₹{docFee}</span>
              </div>

              <div className="invoice-row">
                <span className="invoice-label">DentaAI Diagnostic Platform & Verification</span>
                <span className="invoice-val">₹{platformFee}</span>
              </div>

              <div className="invoice-divider"></div>

              <div className="invoice-total-row">
                <div>
                  <span className="invoice-total-label">Total Payable</span>
                  <span className="invoice-total-sub">Includes all taxes & prescription</span>
                </div>
                <div className="invoice-total-price">
                  <span className="total-curr">₹</span>
                  <span className="total-num">{totalAmount}</span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* RAZORPAY SECURITY CALLOUT */}
          <motion.div variants={item} className="checkout-security-card">
            <div className="security-icon-box">
              <ShieldCheck size={24} color="#10B981" />
            </div>
            <div>
              <h4 className="security-title">Razorpay Secured Checkout</h4>
              <p className="security-desc">
                Your payment is securely processed via 256-bit encrypted banking infrastructure. Sensitive card or UPI details are never stored on our servers.
              </p>
            </div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
};

export default PatientPaymentCheckout;
