import { useState, useEffect } from 'react';
import { ChevronRight, Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
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
          setPatients(data.filter(u => u.role === 'patient'));
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const filteredPatients = patients.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>Patient Management</h2>
          <p>Monitor patient accounts and system activity.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="flex-between mb-6">
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(191, 212, 229, 0.70)', width: '300px' }}>
            <Search size={18} className="mr-2" style={{ color: '#536579' }} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#17324D', outline: 'none', width: '100%', fontWeight: 500 }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center" style={{ color: '#536579' }}><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Patients...</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? filteredPatients.map(u => (
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(22, 119, 255, 0.05)' }}>
                    <td className="font-bold flex-align-center gap-2">
                      <div className="avatar-circle" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', background: '#008DFF', color: '#FFFFFF' }}>
                        {u.name.charAt(0)}
                      </div>
                      <span style={{ color: '#17324D', fontWeight: 700 }}>{u.name}</span>
                    </td>
                    <td className="text-sm" style={{ color: '#536579' }}>{u.email}</td>
                    <td><span className="badge" style={{ background: 'rgba(22, 119, 255, 0.10)', color: '#1677FF', border: '1px solid rgba(22, 119, 255, 0.25)', fontWeight: 600 }}>Patient</span></td>
                    <td className="text-sm" style={{ color: '#536579' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700 }}>Active</span></td>
                    <td><button className="icon-btn hover:text-secondary" style={{ color: '#536579' }}><ChevronRight size={18} /></button></td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4" style={{ color: '#536579' }}>No patients found.</td>
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

export default AdminPatients;
