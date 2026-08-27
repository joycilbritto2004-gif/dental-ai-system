import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Save, MapPin, Building, GraduationCap, Languages, DollarSign } from 'lucide-react';
import '../Dashboard.css';

const DoctorProfileView = () => {
  const [profile, setProfile] = useState({
    name: "Dr. Smith",
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
      const savedProfile = localStorage.getItem('doctor_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
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
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>My Profile</h2>
        <p>Manage your professional details, clinic information, and consultation settings.</p>
      </motion.div>

      <motion.div variants={item} className="dashboard-grid">
        <div className="card glass-card col-span-full md:col-span-8" style={{ padding: '2rem' }}>
          <div className="flex-align-center gap-4 mb-6 pb-6 border-b">
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)' }}>
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorProfileView;
