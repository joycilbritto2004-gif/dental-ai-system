import { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDoctors = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;

      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/admin/users?userId=${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.filter(u => u.role === 'doctor'));
      }
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleStatusUpdate = async (doctorId, newStatus) => {
    if (newStatus === 'Rejected') {
      if (!window.confirm("Are you sure you want to reject this doctor's application?")) return;
    }
    
    try {
      const userStr = localStorage.getItem('dentaai_user');
      const user = JSON.parse(userStr);
      const adminId = user._id || user.id;

      const token = localStorage.getItem('dentaai_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/admin/users/${doctorId}/doctor-status?userId=${adminId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchDoctors();
      } else {
        const data = await res.json();
        alert(`Failed to update status: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error updating doctor status:", err);
      alert("Error updating doctor status.");
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const filteredDoctors = doctors.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>Doctor Verification Management</h2>
          <p>Review and verify doctors applying to join the DentaAI platform.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="flex-between mb-6">
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(191, 212, 229, 0.70)', width: '300px' }}>
            <Search size={18} className="mr-2" style={{ color: '#536579' }} />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#17324D', outline: 'none', width: '100%', fontWeight: 500 }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center" style={{ color: '#536579' }}><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Doctors...</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>License Number</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.length > 0 ? filteredDoctors.map(u => (
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(22, 119, 255, 0.05)' }}>
                    <td className="font-bold flex-align-center gap-2">
                      <div className="avatar-circle" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', background: '#1677FF', color: '#FFFFFF' }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: '#17324D', fontWeight: 700 }}>{u.name}</div>
                        <span className="text-muted text-xs" style={{ color: '#536579' }}>{u.email}</span>
                      </div>
                    </td>
                    <td className="text-sm font-semibold" style={{ color: '#102A43' }}>{u.licenseNumber || 'PENDING-LIC'}</td>
                    <td className="text-sm" style={{ color: '#536579' }}>{u.specialization || 'General Dentistry'}</td>
                    <td className="text-sm" style={{ color: '#536579' }}>{u.experience ? `${u.experience} yrs` : 'N/A'}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.verificationStatus === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : u.verificationStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                        color: u.verificationStatus === 'Approved' ? '#059669' : u.verificationStatus === 'Rejected' ? '#ef4444' : '#d97706',
                        border: `1px solid ${u.verificationStatus === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : u.verificationStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {u.verificationStatus || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="flex-align-center gap-2">
                        {u.verificationStatus !== 'Approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(u._id, 'Approved')} 
                            className="btn btn-sm" 
                            style={{ padding: '0.25rem 0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                        )}
                        {u.verificationStatus !== 'Rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(u._id, 'Rejected')} 
                            className="btn btn-sm" 
                            style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        )}
                        {u.verificationStatus === 'Approved' && (
                          <span className="text-muted text-xs">Verified</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-muted">No doctors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminDoctors;
