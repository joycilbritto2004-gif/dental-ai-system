import { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

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

      const res = await fetch(`http://localhost:5000/api/admin/users?userId=${userId}`);
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
      const userId = user._id || user.id;

      const res = await fetch(`http://localhost:5000/api/admin/users/${doctorId}/doctor-status?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchDoctors(); // Refresh the list
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status.");
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
          <h2>Doctors Management</h2>
          <p>Manage specialist accounts and verifications.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="flex-between mb-6">
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
            <Search size={18} className="text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Doctors...</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Verification</th>
                  <th>Joined</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.length > 0 ? filteredDoctors.map(u => (
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary flex-align-center gap-2">
                      <div className="avatar-circle bg-primary text-white" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="text-muted text-sm">{u.email}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.verificationStatus === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : u.verificationStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                        color: u.verificationStatus === 'Approved' ? '#10b981' : u.verificationStatus === 'Rejected' ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${u.verificationStatus === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : u.verificationStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {u.verificationStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge" style={{ background: u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: u.accountStatus === 'Blocked' ? '#ef4444' : '#059669', border: `1px solid ${u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>{u.accountStatus || 'Active'}</span></td>
                    <td>
                      {(!u.verificationStatus || u.verificationStatus === 'Pending') ? (
                        <div className="flex-align-center gap-2">
                          <button onClick={() => handleStatusUpdate(u._id, 'Approved')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleStatusUpdate(u._id, 'Rejected')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Reject</button>
                        </div>
                      ) : (
                        <span className="text-muted text-sm">Actioned</span>
                      )}
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
