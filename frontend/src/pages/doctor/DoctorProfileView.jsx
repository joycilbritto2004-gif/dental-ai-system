import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Save, MapPin, Building, GraduationCap, Languages, DollarSign, CheckCircle2 } from 'lucide-react';
import '../Dashboard.css';

const DoctorProfileView = () => {
  const [profile, setProfile] = useState({
    name: "",
    specialization: "General Dentist",
    clinic: "Premium Dental Care",
    experience: "10 Years",
    location: "Mumbai, Maharashtra",
    fee: "500",
    languages: "English, Hindi"
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      let baseProfile = {
        name: "Dr. Doctor",
        specialization: "General Dentist",
        clinic: "Premium Dental Care",
        experience: "10 Years",
        location: "Mumbai, Maharashtra",
        fee: "500",
        languages: "English, Hindi"
      };

      if (userStr) {
        const user = JSON.parse(userStr);
        const userName = user.name || user.firstName || 'Doctor';
        baseProfile.name = userName.includes('Dr.') ? userName : `Dr. ${userName}`;
        if (user.specialization) baseProfile.specialization = user.specialization;
      }

      const savedProfile = localStorage.getItem('doctor_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({ ...parsed, name: baseProfile.name }); // enforce auth name
      } else {
        setProfile(baseProfile);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('doctor_profile', JSON.stringify(profile));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view animate-fade-in" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="mb-4 page-header-card" style={{ padding: '24px 32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 166, 166, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px', fontSize: '2rem', lineHeight: '1.2', margin: 0 }}>My Profile</h2>
          <p className="font-medium" style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your professional details, clinic information, and consultation settings.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '750px' }}>
        <div className="flex-align-center gap-4 mb-6 pb-6 border-b">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 15px rgba(0, 166, 166, 0.3)' }}>
              <UserCircle size={48} />
            </div>
            <div>
              <h3 className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>{profile.name}</h3>
              <p className="text-secondary font-bold">{profile.specialization}</p>
            </div>
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><UserCircle size={16} /> Full Name</label>
              <input type="text" className="form-input" name="name" value={profile.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><GraduationCap size={16} /> Specialization</label>
              <input type="text" className="form-input" name="specialization" value={profile.specialization} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><Building size={16} /> Clinic Name</label>
              <input type="text" className="form-input" name="clinic" value={profile.clinic} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><MapPin size={16} /> Location</label>
              <input type="text" className="form-input" name="location" value={profile.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><GraduationCap size={16} /> Experience</label>
              <input type="text" className="form-input" name="experience" value={profile.experience} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label flex-align-center gap-2"><DollarSign size={16} /> Consultation Fee (₹)</label>
              <input type="number" className="form-input" name="fee" value={profile.fee} onChange={handleChange} />
            </div>
            <div className="form-group col-span-full">
              <label className="form-label flex-align-center gap-2"><Languages size={16} /> Languages Spoken</label>
              <input type="text" className="form-input" name="languages" value={profile.languages} onChange={handleChange} />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex-between">
            {isSaved ? (
              <span className="text-success font-bold flex-align-center gap-2 bg-success-light px-4 py-2 rounded-lg">
                <CheckCircle2 size={18} /> Profile Saved Successfully!
              </span>
            ) : (
              <span></span>
            )}
            <button onClick={handleSave} className="btn btn-primary flex-align-center gap-2 pulse-glow px-8">
              <Save size={18} /> Save Changes
            </button>
          </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorProfileView;
