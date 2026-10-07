import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, ChevronLeft, Video, MessageSquare, ShieldCheck, Info } from 'lucide-react';
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

  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/doctors/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Normalize doc.id to the MongoDB _id string for consistency in the frontend
          if (data._id) data.id = data._id; 
          
          // Ensure fee is numeric to prevent NaN
          data.fee = Number(data.fee) || 500;
          setDoc(data);
        }
      } catch (err) {
        console.error("Failed to fetch doctor:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

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

  if (isLoading) return <div className="dashboard-view text-center pt-20">Loading...</div>;
  if (!doc) return <div className="dashboard-view text-center pt-20">Doctor Not Found</div>;

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
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
          <div className="flex-align-center gap-2 mb-6">
            <Link to={`/dashboard/patient/doctor/${doc.id}`} state={{ predictionResult }} className="text-muted hover:text-primary transition-colors" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 16px', borderRadius: '999px', border: '1px solid var(--border-color)', fontWeight: '600', fontSize: '0.9rem' }}>
              <ChevronLeft size={16} className="mr-1" /> Back to Doctor Profile
            </Link>
          </div>
          <h2 className="font-extrabold mb-3" style={{ color: 'var(--primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2' }}>Request Consultation</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Secure your appointment and get expert advice from <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>{doc.name}</span>.
          </p>
        </div>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: Request Form */}
        <div className="dashboard-left-col">
          <motion.form variants={item} className="card" onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', borderRadius: '24px', padding: '2.5rem' }}>
            <div className="card-header mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-xl">Consultation Details</h3>
            </div>
            
            <div className="form-group mb-8">
              <label className="form-label text-sm font-semibold text-muted uppercase tracking-wider mb-3 block">Selected Specialist</label>
              <div className="p-5 rounded-2xl flex items-center justify-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <h4 className="font-bold text-primary text-xl mb-1">{doc.name}</h4>
                  <p className="text-sm text-muted font-medium mb-0">{doc.specialization} &bull; {doc.clinic || 'DentaAI Partner Clinic'}</p>
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--secondary)' }}>
                  {doc.location || 'Online / Regional'}
                </span>
              </div>
            </div>

            <div className="form-group mb-8">
              <label className="form-label text-sm font-semibold text-muted uppercase tracking-wider mb-3 block">Consultation Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConsultationType('Video Consultation')}
                  style={{ 
                    padding: '20px', 
                    border: `2px solid ${consultationType === 'Video Consultation' ? 'var(--secondary)' : 'transparent'}`,
                    borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                    background: consultationType === 'Video Consultation' ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-secondary)',
                    boxShadow: consultationType === 'Video Consultation' ? '0 8px 24px rgba(0, 210, 255, 0.1)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ padding: '12px', borderRadius: '50%', background: consultationType === 'Video Consultation' ? 'var(--secondary)' : 'rgba(128, 128, 128, 0.1)' }}>
                    <Video size={24} color={consultationType === 'Video Consultation' ? '#fff' : 'var(--text-muted)'} />
                  </div>
                  <span className={consultationType === 'Video Consultation' ? 'font-bold text-primary' : 'font-semibold text-muted'}>Video Call</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConsultationType('Chat Consultation')}
                  style={{ 
                    padding: '20px', 
                    border: `2px solid ${consultationType === 'Chat Consultation' ? 'var(--secondary)' : 'transparent'}`,
                    borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                    background: consultationType === 'Chat Consultation' ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-secondary)',
                    boxShadow: consultationType === 'Chat Consultation' ? '0 8px 24px rgba(0, 210, 255, 0.1)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ padding: '12px', borderRadius: '50%', background: consultationType === 'Chat Consultation' ? 'var(--secondary)' : 'rgba(128, 128, 128, 0.1)' }}>
                    <MessageSquare size={24} color={consultationType === 'Chat Consultation' ? '#fff' : 'var(--text-muted)'} />
                  </div>
                  <span className={consultationType === 'Chat Consultation' ? 'font-bold text-primary' : 'font-semibold text-muted'}>Text / Chat</span>
                </motion.div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="form-group">
                <label className="form-label text-sm font-semibold text-muted uppercase tracking-wider mb-2 block">Preferred Date</label>
                <input type="date" className="form-input" style={{ height: '52px', borderRadius: '12px', padding: '0 16px' }} value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label text-sm font-semibold text-muted uppercase tracking-wider mb-2 block">Preferred Time</label>
                <input type="time" className="form-input" style={{ height: '52px', borderRadius: '12px', padding: '0 16px' }} value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group mb-8">
              <label className="form-label text-sm font-semibold text-muted uppercase tracking-wider mb-2 block">Describe your concern (Optional)</label>
              <textarea className="form-input" style={{ borderRadius: '12px', padding: '16px', resize: 'vertical', minHeight: '120px' }} placeholder="Briefly describe your symptoms, pain levels, or specific reasons for this consultation..." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
            </div>
            
            {/* BOOKING SUMMARY */}
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
              <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>Booking Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="text-muted font-medium text-lg">Doctor Fee</span>
                <span className="font-bold text-primary text-lg">₹{doc.fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span className="text-muted font-medium text-lg">Platform Fee</span>
                <span className="font-bold text-primary text-lg">₹49</span>
              </div>
              <hr style={{ borderTop: '2px dashed var(--border-color)', margin: '0 0 20px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-extrabold text-primary text-xl">Total Amount</span>
                <span className="font-black text-secondary" style={{ fontSize: '2rem' }}>₹{doc.fee + 49}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{ height: '60px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>
               Proceed to Secure Payment
            </button>
          </motion.form>
        </div>

        {/* RIGHT COLUMN: AI Report Attachment */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', borderRadius: '24px', padding: '2.5rem' }}>
            <div className="card-header pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-xl">Attached AI Report</h3>
            </div>
            
            {predictionResult ? (
              <div className="prediction-result mt-6" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                
                <h4 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem' }}>
                  <ShieldCheck size={26} /> AI Analysis Snapshot
                </h4>
                
                <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700 }}>Detected Anomaly</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginTop: '6px', textTransform: 'capitalize' }}>
                    {predictionResult.condition?.replace('_', ' ')}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700 }}>Confidence Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--secondary)' }}>{predictionResult.confidence}%</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${predictionResult.confidence}%` }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ height: '100%', background: 'var(--secondary)', borderRadius: '4px' }}></motion.div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                    <Info size={16} /> AI Recommendation
                  </span>
                  <p style={{ margin: '10px 0 0 0', fontSize: '15px', color: 'var(--text)', lineHeight: '1.7', fontWeight: 500 }}>
                    {predictionResult.recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '2px dashed var(--border-color)', marginTop: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border-color)' }}>
                  <BrainCircuit size={32} className="text-muted" />
                </div>
                <h4 className="text-primary font-extrabold text-lg mb-2">No AI Analysis Attached</h4>
                <p className="text-muted" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>You are proceeding with a standard consultation without a preliminary AI scan.</p>
              </div>
            )}

            <p className="text-muted mt-8 text-center font-medium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <ShieldCheck size={18} className="text-success" /> This health data is securely encrypted.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConsultationRequest;
