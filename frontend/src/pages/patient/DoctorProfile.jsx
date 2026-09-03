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
      <motion.div variants={item} className="dashboard-header mb-6">
        <div className="flex-align-center gap-2 mb-2">
          <Link to="/dashboard/patient" className="text-muted hover:text-primary flex-align-center gap-1" style={{ transition: 'color 0.3s' }}>
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
        </div>
        <h2>Specialist Profile</h2>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-left-col">
          <motion.div variants={item} className="card profile-main-card glass-card" style={{ padding: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="profile-header flex-align-center" style={{ gap: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '800', color: 'white', boxShadow: '0 10px 25px rgba(0, 210, 255, 0.4)' }}>
                {doc.name.split(' ').map(n => n[0]).join('').replace('.', '').substring(0, 2)}
              </div>
              <div className="profile-title-info">
                <h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: 800 }}>{doc.name}</h2>
                <p className="text-muted mb-3" style={{ fontSize: '1.1rem' }}>{doc.qualifications}</p>
                <span style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {doc.specialization}
                </span>
              </div>
            </div>

            <div className="model-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.4)', padding: '1.5rem', borderRadius: '16px' }}>
              <div className="model-detail-row" style={{ border: 'none', padding: '0.5rem' }}>
                <span className="text-muted flex-align-center gap-2"><BriefcaseMedical size={18} className="text-secondary"/> Experience</span>
                <span className="font-semibold text-primary">{doc.experience}</span>
              </div>
              <div className="model-detail-row" style={{ border: 'none', padding: '0.5rem' }}>
                <span className="text-muted flex-align-center gap-2"><Award size={18} className="text-secondary"/> Registration</span>
                <span className="font-semibold text-primary">{doc.registration}</span>
              </div>
              <div>
                <p className="text-xs text-muted mb-1 flex-align-center gap-1"><Languages size={14}/> Languages</p>
                <p className="font-semibold">{doc.languages || 'English, Local'}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1 flex-align-center gap-1"><Star size={14} className="text-warning fill-warning"/> Rating</p>
                <p className="font-semibold">{doc.rating} ({doc.reviews} Reviews)</p>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.05), transparent)', border: '1px solid rgba(0, 210, 255, 0.2)', padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-primary font-bold" style={{ fontSize: '1.1rem' }}>Consultation Fee</span>
              <span className="text-secondary font-bold" style={{ fontSize: '1.75rem' }}>${doc.fee}</span>
            </div>

            <div className="verification-actions mt-8" style={{ display: 'flex', gap: '1rem' }}>
              <Link to={`/dashboard/patient/consult-request/${doc.id}`} state={{ predictionResult }} className="btn btn-primary flex-1 btn-lg text-center pulse-glow" style={{ display: 'flex', justifyContent: 'center' }}>
                <Calendar size={20} className="mr-2" /> Book Consultation
              </Link>
              <button className="btn btn-outline flex-1 btn-lg text-center" style={{ display: 'flex', justifyContent: 'center' }}>
                <MessageSquare size={20} className="mr-2" /> Send Message
              </button>
            </div>
          </motion.div>

          {/* ABOUT DOCTOR */}
          <motion.div variants={item} className="card mt-6 glass-card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.25rem' }}>About {doc.name}</h3>
            </div>
            <p className="text-muted" style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
              {doc.name} is a highly skilled {doc.specialization} with over {doc.experience} in providing comprehensive dental care. Specializing in advanced restorative procedures, they are committed to delivering pain-free, state-of-the-art treatments utilizing the latest AI and imaging technologies.
            </p>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card glass-card">
            <div className="card-header">
              <h3 style={{ fontSize: '1.25rem' }}>Clinic & Contact</h3>
            </div>
            
            <h4 className="font-bold text-primary mb-4" style={{ fontSize: '1.25rem' }}>{doc.clinic}</h4>
            
            <div className="detail-row mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
              <MapPin size={22} className="text-secondary" style={{ marginTop: '2px' }} />
              <p className="text-primary font-semibold" style={{ lineHeight: '1.5' }}>{doc.address}</p>
            </div>
            
            <div className="detail-row mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
              <Clock size={22} className="text-secondary" />
              <p className="font-semibold text-primary">{doc.timings}</p>
            </div>

            <div className="detail-row mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
              <Phone size={22} className="text-secondary" />
              <p className="font-semibold text-primary">{doc.phone}</p>
            </div>

            <div className="detail-row mb-8" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px' }}>
              <Mail size={22} className="text-secondary" />
              <p className="font-semibold text-primary">{doc.email}</p>
            </div>

            <h4 className="font-bold text-primary mb-4" style={{ fontSize: '1.1rem' }}>Services Offered</h4>
            <div className="condition-badges">
              {doc.services.map((service, index) => (
                <span key={index} className="condition-badge" style={{ background: 'white', borderColor: 'rgba(0, 210, 255, 0.2)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>{service}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorProfile;
