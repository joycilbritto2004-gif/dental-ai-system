import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, BriefcaseMedical, Clock, Award, Languages, Phone, Mail, Calendar, MessageSquare, ChevronLeft } from 'lucide-react';
import '../Dashboard.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const location = useLocation();
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
        <h2 className="text-xl font-bold text-primary mb-4">Doctor Not Found</h2>
        <Link to="/dashboard/patient/recommended-doctors" className="btn btn-outline">Back to Recommendations</Link>
      </div>
    );
  }

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
            <Link to="/dashboard/patient" className="text-muted hover:text-primary transition-colors" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-primary)', padding: '8px 16px', borderRadius: '999px', border: '1px solid var(--border-color)', fontWeight: '600', fontSize: '0.9rem' }}>
              <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
            </Link>
          </div>
          <h2 className="font-extrabold mb-0" style={{ color: 'var(--primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2' }}>Specialist Profile</h2>
        </div>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-left-col">
          <motion.div variants={item} className="card profile-main-card" style={{ padding: '2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', borderRadius: '24px' }}>
            <div className="profile-header flex-align-center" style={{ gap: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '800', color: 'white', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', flexShrink: 0 }}>
                {doc.name.split(' ').map(n => n[0]).join('').replace('.', '').substring(0, 2)}
              </div>
              <div className="profile-title-info">
                <h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 800 }}>{doc.name}</h2>
                <p className="text-muted mb-3 font-medium" style={{ fontSize: '1.1rem' }}>{doc.qualifications || 'DentaAI Specialist'}</p>
                <span style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-block' }}>
                  {doc.specialization}
                </span>
              </div>
            </div>

            <div className="model-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '0.5rem' }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex-align-center gap-2"><BriefcaseMedical size={16} className="text-secondary"/> Experience</p>
                <p className="font-extrabold text-primary" style={{ fontSize: '1.1rem' }}>{doc.experience || <span className="text-muted font-normal text-sm">Not provided</span>}</p>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex-align-center gap-2"><Award size={16} className="text-secondary"/> Registration</p>
                <p className="font-extrabold text-primary" style={{ fontSize: '1.1rem' }}>{doc.registration || <span className="text-muted font-normal text-sm">Not provided</span>}</p>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex-align-center gap-2"><Languages size={16} className="text-secondary"/> Languages</p>
                <p className="font-extrabold text-primary" style={{ fontSize: '1.1rem' }}>{doc.languages || <span className="text-muted font-normal text-sm">Not provided</span>}</p>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1 flex-align-center gap-2"><Star size={16} className="text-secondary"/> Rating</p>
                <p className="font-extrabold text-primary" style={{ fontSize: '1.1rem' }}>{doc.rating || 'New'} <span className="text-muted font-medium text-sm">({doc.reviews || 0} Reviews)</span></p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '1.5rem 2rem', borderRadius: '16px', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted font-bold text-lg uppercase tracking-wider">Consultation Fee</span>
              <span className="text-secondary font-black" style={{ fontSize: '2rem' }}>₹{doc.fee || 500}</span>
            </div>

            <div className="verification-actions mt-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Link to={`/dashboard/patient/consult-request/${doc._id || doc.id}`} state={{ predictionResult }} className="btn btn-primary btn-lg pulse-glow" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '56px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>
                <Calendar size={20} className="mr-2" /> Book Consultation
              </Link>
              <button className="btn btn-outline btn-lg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '56px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px' }}>
                <MessageSquare size={20} className="mr-2" /> Send Message
              </button>
            </div>
          </motion.div>

          {/* ABOUT DOCTOR */}
          <motion.div variants={item} className="card mt-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', borderRadius: '24px', padding: '2.5rem' }}>
            <div className="card-header border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
              <h3 className="font-bold text-xl">About Dr. {doc.name.split(' ').pop()}</h3>
            </div>
            <p className="text-muted font-medium" style={{ lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              {doc.name} is a highly skilled {doc.specialization} {doc.experience ? `with ${doc.experience}` : ''} in providing comprehensive dental care. Specializing in advanced restorative procedures, they are committed to delivering pain-free, state-of-the-art treatments utilizing the latest AI and imaging technologies.
            </p>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', borderRadius: '24px', padding: '2.5rem' }}>
            <div className="card-header border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <h3 className="font-bold text-xl">Clinic & Contact</h3>
            </div>
            
            {doc.clinic ? (
              <h4 className="font-extrabold text-primary mb-6" style={{ fontSize: '1.25rem' }}>{doc.clinic}</h4>
            ) : null}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <MapPin size={22} className="text-secondary flex-shrink-0" style={{ marginTop: '2px' }} />
                <p className="text-primary font-bold m-0" style={{ lineHeight: '1.5', fontSize: '0.95rem' }}>{doc.address || <span className="text-muted font-medium">Not provided</span>}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <Clock size={22} className="text-secondary flex-shrink-0" />
                <p className="font-bold text-primary m-0" style={{ fontSize: '0.95rem' }}>{doc.timings || <span className="text-muted font-medium">Not provided</span>}</p>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <Phone size={22} className="text-secondary flex-shrink-0" />
                <p className="font-bold text-primary m-0" style={{ fontSize: '0.95rem' }}>{doc.phone || <span className="text-muted font-medium">Not provided</span>}</p>
              </div>

              {doc.email && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <Mail size={22} className="text-secondary flex-shrink-0" />
                  <p className="font-bold text-primary m-0" style={{ fontSize: '0.95rem' }}>{doc.email}</p>
                </div>
              )}
            </div>

            {(doc.services && doc.services.length > 0) ? (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-muted uppercase tracking-wider mb-4" style={{ fontSize: '0.85rem' }}>Services Offered</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {doc.services.map((service, index) => (
                    <span key={index} style={{ background: 'var(--bg-primary)', color: 'var(--primary)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' }}>{service}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorProfile;
