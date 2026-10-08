import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, BriefcaseMedical, Clock, Award, Languages, Phone, Mail, Calendar, MessageSquare, ChevronLeft, UserCircle, Stethoscope, Activity, ShieldCheck } from 'lucide-react';
import '../Dashboard.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const predictionResult = location.state?.predictionResult;
  
  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/doctors/${id}`);
        if (res.ok) {
          const data = await res.json();
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

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="dashboard-view text-center pt-20">Loading profile...</div>
    );
  }

  if (!doc) {
    return (
      <div className="dashboard-view text-center pt-20">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Doctor Not Found</h2>
        <Link to="/dashboard/patient/recommended-doctors" className="btn btn-outline">Back to Recommendations</Link>
      </div>
    );
  }

  const handleConsultationRequest = () => {
    navigate(`/dashboard/patient/consult-request/${doc._id || doc.id}`, { state: { predictionResult } });
  };
  
  const handleMessageDoctor = () => {
    navigate('/dashboard/patient/messages', { state: { doctorId: doc._id || doc.id } });
  };

  return (
    <div className="dashboard-view" style={{ minHeight: '100vh', width: '100%' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* TOP NAVBAR / BREADCRUMB */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600 }}>
            <ChevronLeft size={16} /> Back
          </button>
        </motion.div>

        {/* MAIN PROFILE CARD */}
        <motion.div variants={item} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '32px' }}>
          
          {/* HEADER BANNER */}
          <div style={{ height: '140px', background: 'var(--gradient-soft)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.9)', padding: '6px 16px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <ShieldCheck size={16} /> Verified Specialist
              </div>
            </div>
          </div>

          <div style={{ padding: '0 40px 40px', display: 'flex', flexDirection: 'column', marginTop: '-60px' }}>
            
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--bg-main)', border: '4px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', zIndex: 10 }}>
                <UserCircle size={80} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1, paddingBottom: '8px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{doc.name}</h1>
                <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {doc.specialization || 'Dental Specialist'}
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-color)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>{doc.experience || '10+'} Years Experience</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              {/* LEFT COL */}
              <div style={{ flex: '2 1 400px' }}>
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Stethoscope size={20} style={{ color: 'var(--primary)' }} /> About Specialist
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', fontWeight: 500 }}>
                    {doc.about || `${doc.name} is a highly qualified ${doc.specialization || 'dental specialist'} dedicated to providing exceptional patient care using advanced AI-assisted diagnostic tools and evidence-based treatments.`}
                  </p>
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} style={{ color: 'var(--primary)' }} /> Expertise
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['Digital Dentistry', 'AI Diagnostics', 'Preventive Care', 'Restorative Procedures'].map((skill, i) => (
                      <span key={i} style={{ background: 'var(--bg-main)', border: `1px solid var(--border-color)`, color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COL */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Clinical Contact</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '10px', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                        <Mail size={16} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Email</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>{doc.email}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '10px', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                        <Phone size={16} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Phone</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>{doc.phone || '+1 (555) 000-0000'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '10px', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '2px' }}>Timings</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>{doc.timings || '9:00 AM - 5:00 PM'}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Consultation</h4>
                    <span style={{ color: '#00A6A6', fontSize: '1.25rem', fontWeight: 800 }}>₹{doc.fee || '500'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button onClick={handleConsultationRequest} style={{ background: 'var(--gradient-primary)', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 166, 166, 0.2)' }}>
                      <Calendar size={18} /> Book Consultation
                    </button>
                    <button onClick={handleMessageDoctor} style={{ background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', cursor: 'pointer' }}>
                      <MessageSquare size={18} /> Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DoctorProfile;


