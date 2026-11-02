import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Save, MapPin, Building, GraduationCap, Languages, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/auth/profile`, { headers });
        if (res.ok) {
          const user = await res.json();
          const cleanName = user.name || '';
          setProfile(prev => ({
            ...prev,
            name: cleanName,
            specialization: user.specialization || 'General Dentist',
            clinic: user.clinic || 'Premium Dental Care',
            location: user.location || 'Mumbai, Maharashtra',
            fee: user.fee !== undefined ? String(user.fee) : '500',
            phone: user.phone || ''
          }));
        } else {
          // Fallback to localStorage if server returns non-ok
          const userStr = localStorage.getItem('dentaai_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setProfile(prev => ({
              ...prev,
              name: user.name || '',
              specialization: user.specialization || prev.specialization,
              clinic: user.clinic || prev.clinic,
              location: user.location || prev.location,
              fee: user.fee !== undefined ? String(user.fee) : prev.fee
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
    setErrorMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setIsSaved(false);

    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          specialization: profile.specialization.trim(),
          clinic: profile.clinic.trim(),
          location: profile.location.trim(),
          fee: Number(profile.fee)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();

      // Update localStorage so topbar and other components immediately reflect changes
      const userStr = localStorage.getItem('dentaai_user');
      if (userStr) {
        const current = JSON.parse(userStr);
        localStorage.setItem('dentaai_user', JSON.stringify({
          ...current,
          name: updatedUser.name,
          specialization: updatedUser.specialization,
          clinic: updatedUser.clinic,
          location: updatedUser.location,
          fee: updatedUser.fee
        }));
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Error saving profile.');
    } finally {
      setIsSaving(false);
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
            <h3 className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>{profile.name || 'Dr. Doctor'}</h3>
            <p className="text-secondary font-bold">{profile.specialization}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg flex-align-center gap-2" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><UserCircle size={16} /> Full Name</label>
            <input type="text" className="form-input" name="name" value={profile.name} onChange={handleChange} placeholder="Dr. Full Name" />
          </div>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><GraduationCap size={16} /> Specialization</label>
            <input type="text" className="form-input" name="specialization" value={profile.specialization} onChange={handleChange} placeholder="e.g. Periodontist & Implantologist" />
          </div>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><Building size={16} /> Clinic Name</label>
            <input type="text" className="form-input" name="clinic" value={profile.clinic} onChange={handleChange} placeholder="e.g. SmileCraft Dental Clinic" />
          </div>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><MapPin size={16} /> Location</label>
            <input type="text" className="form-input" name="location" value={profile.location} onChange={handleChange} placeholder="e.g. Mumbai, Maharashtra" />
          </div>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><GraduationCap size={16} /> Experience</label>
            <input type="text" className="form-input" name="experience" value={profile.experience} onChange={handleChange} placeholder="e.g. 10 Years" />
          </div>
          <div className="form-group">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><DollarSign size={16} /> Consultation Fee (₹)</label>
            <input type="number" min="0" step="50" className="form-input" name="fee" value={profile.fee} onChange={handleChange} placeholder="500" />
          </div>
          <div className="form-group col-span-full">
            <label className="form-label flex-align-center gap-2 font-bold text-primary"><Languages size={16} /> Languages Spoken</label>
            <input type="text" className="form-input" name="languages" value={profile.languages} onChange={handleChange} placeholder="English, Hindi" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex-between">
          {isSaved ? (
            <span className="text-success font-bold flex-align-center gap-2 bg-success-light px-4 py-2 rounded-lg">
              <CheckCircle2 size={18} /> Profile Saved to Database!
            </span>
          ) : (
            <span></span>
          )}
          <button 
            onClick={handleSave} 
            className="btn btn-primary flex-align-center gap-2 pulse-glow px-8"
            disabled={isSaving}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorProfileView;
