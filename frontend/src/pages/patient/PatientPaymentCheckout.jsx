import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!doctor) {
    return (
      <div className="dashboard-view" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Invalid Secure Session</h2>
        <p className="text-muted mb-4">You have accessed the secure checkout without an active session token.</p>
        <button onClick={() => navigate(-1)} className="btn btn-outline">Go Back</button>
      </div>
    );
  }

  const docFee = doctor.fee || 500;
  const totalAmount = docFee + (platformFee || 0);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('dentaai_token');
      const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
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
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DentaAI",
        description: `Consultation with ${doctor.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify signature on backend
            const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
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
               
               const newConsultation = {
                 id: Date.now().toString(),
                 transactionId: txnId,
                 patientId: dynamicPatientId,
                 patientName: dynamicPatientName, 
                 doctorId: doctor.id,
                 doctorName: doctor.name,
                 doctorSpecialization: doctor.specialization,
                 scanId: predictionResult ? (predictionResult._id || predictionResult.id) : undefined,
                 condition: predictionResult?.condition?.replace('_', ' ') || "N/A",
                 confidence: predictionResult ? `${predictionResult.confidence}%` : "N/A",
                 recommendation: predictionResult?.recommendation || "",
                 message: message || "",
                 consultationType,
                 date,
                 time,
                 fee: docFee,
                 platformFee,
                 totalAmount,
                 paymentStatus: "Paid",
                 status: "Pending",
                 createdAt: new Date().toISOString()
               };

               const consRes = await fetch('http://localhost:5000/api/consultations', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify(newConsultation),
               });
               
               if (!consRes.ok) {
                 throw new Error('Failed to create consultation record after payment');
               }

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
          color: "#00f0ff"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         setIsProcessing(false);
         alert(response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      setIsProcessing(false);
      alert("Failed to initialize payment gateway. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <motion.div className="dashboard-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card text-center" style={{ maxWidth: '500px', padding: '4rem 2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--success)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)' }}>
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1, rotate: 360 }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-success mx-auto mb-6" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)' }}
          >
            <CheckCircle2 size={40} />
          </motion.div>
          <h2 className="text-primary mb-2" style={{ fontWeight: 800 }}>Payment Successful</h2>
          <p className="text-muted mb-6" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
            Your consultation with <strong>{doctor.name}</strong> is confirmed.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', margin: '0 auto 32px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="text-muted font-medium">Amount Paid</span>
              <span className="font-bold text-primary" style={{ fontSize: '1.2rem' }}>₹{totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted font-medium">Transaction ID</span>
              <span className="font-bold text-secondary">{transactionId}</span>
            </div>
          </div>
          <Link to="/dashboard/patient/consultations" className="btn btn-primary w-full btn-lg" style={{ display: 'flex', justifyContent: 'center', borderRadius: '999px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>
            Go to My Consultations
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="mb-8" style={{ background: 'var(--bg-secondary)', padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline mb-6" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold' }}>
            <ChevronLeft size={16} /> Back
          </button>
          <h2 className="font-extrabold mb-2" style={{ color: 'var(--primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>Secure Checkout</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Complete your payment to confirm the consultation.</p>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* LEFT COLUMN: Payment Methods */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div variants={item} className="card" style={{ padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 className="mb-4 text-primary" style={{ fontWeight: 800 }}>Payment Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setPaymentMethod('upi')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'upi' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'upi' ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-primary)', textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Smartphone size={28} color={paymentMethod === 'upi' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'upi' ? 'font-bold text-primary' : 'font-medium text-muted'}`}>UPI</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setPaymentMethod('card')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'card' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'card' ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-primary)', textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <CreditCard size={28} color={paymentMethod === 'card' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'card' ? 'font-bold text-primary' : 'font-medium text-muted'}`}>Card</span>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                onClick={() => setPaymentMethod('netbanking')}
                style={{ 
                  padding: '20px 10px', border: `2px solid ${paymentMethod === 'netbanking' ? 'var(--secondary)' : 'var(--border-color)'}`,
                  borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  background: paymentMethod === 'netbanking' ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-primary)', textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Landmark size={28} color={paymentMethod === 'netbanking' ? 'var(--secondary)' : 'var(--text-muted)'} />
                <span className={`text-sm ${paymentMethod === 'netbanking' ? 'font-bold text-primary' : 'font-medium text-muted'}`}>Net Banking</span>
              </motion.div>
            </div>

            <form onSubmit={handlePayment}>
              {paymentMethod === 'card' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="form-group mb-4">
                    <label className="form-label font-semibold text-muted">Cardholder Name</label>
                    <input type="text" className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} placeholder="John Doe" required />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label font-semibold text-muted">Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} placeholder="**** **** **** ****" required maxLength="19" />
                      <Lock size={18} className="text-secondary" style={{ position: 'absolute', right: '16px', top: '14px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div className="form-group">
                      <label className="form-label font-semibold text-muted">Expiry (MM/YY)</label>
                      <input type="text" className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} placeholder="MM/YY" required maxLength="5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label font-semibold text-muted">CVV</label>
                      <input type="password" className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} placeholder="***" required maxLength="4" />
                    </div>
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'upi' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <div className="form-group">
                    <label className="form-label font-semibold text-muted">UPI ID</label>
                    <input type="text" className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} placeholder="username@upi" required />
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'netbanking' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <div className="form-group">
                    <label className="form-label font-semibold text-muted">Select Bank</label>
                    <select className="form-input" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} required>
                      <option value="">Choose your bank...</option>
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
                className="btn btn-primary w-full" 
                disabled={isProcessing}
                style={{ 
                  display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', 
                  padding: '16px', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 'bold', 
                  boxShadow: isProcessing ? 'none' : '0 8px 24px rgba(0, 210, 255, 0.25)',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? (
                  <><Loader2 size={20} className="animate-spin" /> Processing...</>
                ) : (
                  <><Lock size={20} /> Pay Securely ₹{totalAmount}</>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div variants={item} className="card" style={{ padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 className="mb-4 text-primary" style={{ fontWeight: 800 }}>Booking Summary</h3>
            
            <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="text-muted font-medium">Doctor Fee</span>
                <span className="font-bold text-primary">₹{doctor.fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted font-medium">Platform Fee</span>
                <span className="font-bold text-primary">₹{platformFee}</span>
              </div>
              <div className="divider" style={{ margin: '20px 0', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-bold text-primary" style={{ fontSize: '1.2rem' }}>Total Amount</span>
                <span className="font-extrabold text-secondary" style={{ fontSize: '1.8rem' }}>₹{totalAmount}</span>
              </div>
            </div>
            
            <h4 className="font-bold mb-3 text-primary flex-align-center gap-2">
              Consultation Details
            </h4>
            <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', marginBottom: '12px' }}>
                <strong className="text-primary" style={{ width: '120px' }}>Doctor:</strong>
                <span className="text-muted font-medium">{doctor.name}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '12px' }}>
                <strong className="text-primary" style={{ width: '120px' }}>Type:</strong>
                <span className="text-muted font-medium" style={{ textTransform: 'capitalize' }}>{consultationType}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <strong className="text-primary" style={{ width: '120px' }}>Schedule:</strong>
                <span className="text-muted font-medium">{date} at {time}</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <ShieldCheck size={28} className="text-success" style={{ flexShrink: 0 }} />
            <div>
              <h4 className="text-success mb-1" style={{ fontWeight: 700 }}>Secure Payment</h4>
              <p className="text-muted m-0" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                Your payment information is securely processed by Razorpay.
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default PatientPaymentCheckout;
