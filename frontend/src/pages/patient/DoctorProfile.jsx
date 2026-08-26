import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, BriefcaseMedical, Clock, Award, Languages, Phone, Mail, Calendar, MessageSquare, ChevronLeft } from 'lucide-react';
import '../Dashboard.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const predictionResult = location.state?.predictionResult;
  
  const doctorsData = [
    {
      id: "1",
      name: "Dr. Ananya Sharma",
      qualifications: "BDS, MDS",
      specialization: "General & Cosmetic Dentist",
      experience: "12 years",
      registration: "DCI Reg No: 84729",
      languages: "English, Hindi, Kannada",
      fee: 500,
      rating: 4.8,
      reviews: 124,
      clinic: "SmileCare Dental Clinic",
      loc: "Bengaluru, Karnataka",
      address: "101, Health Avenue, Bengaluru, KA",
      phone: "+91 98765 43210",
      email: "dr.ananya@smilecare.in",
      timings: "Mon - Sat: 10:00 AM - 08:00 PM",
      services: ["Teeth Whitening", "Cosmetic Fillings", "Routine Checkup", "Dental Crowns"]
    },
    {
      id: "2",
      name: "Dr. Rahul Nair",
      qualifications: "BDS, MDS",
      specialization: "Endodontist",
      experience: "10 years",
      registration: "DCI Reg No: 84730",
      languages: "English, Malayalam",
      fee: 700,
      rating: 4.9,
      reviews: 89,
      clinic: "DentalCare Advanced Clinic",
      loc: "Kochi, Kerala",
      address: "45 Downtown St, Kochi, KL",
      phone: "+91 98765 43211",
      email: "dr.rahul@dentalcare.in",
      timings: "Mon - Fri: 09:00 AM - 06:00 PM",
      services: ["Root Canal Treatment", "Endodontic Retreatment", "Apicoectomy", "Trauma Management"]
    },
    {
      id: "3",
      name: "Dr. Priya Menon",
      qualifications: "BDS, MS Orthodontics",
      specialization: "Orthodontist",
      experience: "9 years",
      registration: "DCI Reg No: 84731",
      languages: "English, Malayalam, Tulu",
      fee: 600,
      rating: 4.7,
      reviews: 215,
      clinic: "Perfect Smile Dental Centre",
      loc: "Mangaluru, Karnataka",
      address: "128 MG Road, Mangaluru, KA",
      phone: "+91 98765 43212",
      email: "dr.priya@perfectsmile.in",
      timings: "Mon - Sat: 08:00 AM - 05:00 PM",
      services: ["Braces", "Invisalign", "Retainers", "Jaw Alignment"]
    },
    {
      id: "4",
      name: "Dr. Arjun Patel",
      qualifications: "MDS - Oral Surgery",
      specialization: "Oral & Maxillofacial Surgeon",
      experience: "14 years",
      registration: "DCI Reg No: 84732",
      languages: "English, Hindi, Gujarati, Marathi",
      fee: 900,
      rating: 4.9,
      reviews: 156,
      clinic: "City Dental Hospital",
      loc: "Mumbai, Maharashtra",
      address: "56 SV Road, Mumbai, MH",
      phone: "+91 98765 43213",
      email: "dr.arjun@citydental.in",
      timings: "Tue - Sun: 10:00 AM - 07:00 PM",
      services: ["Tooth Extraction", "Dental Implants", "Jaw Surgery", "Cyst Removal"]
    }
  ];

  const doc = doctorsData.find(d => d.id === id) || doctorsData[0];

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

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
              <div className="model-detail-row" style={{ border: 'none', padding: '0.5rem' }}>
                <span className="text-muted flex-align-center gap-2"><Languages size={18} className="text-secondary"/> Languages</span>
                <span className="font-semibold text-primary">{doc.languages}</span>
              </div>
              <div className="model-detail-row" style={{ border: 'none', padding: '0.5rem' }}>
                <span className="text-muted flex-align-center gap-2"><Star size={18} className="text-warning"/> Rating</span>
                <span className="font-semibold text-primary">{doc.rating} ({doc.reviews})</span>
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
