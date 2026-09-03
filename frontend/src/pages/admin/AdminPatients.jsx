import { useState, useEffect } from 'react';
import { UserCircle, ChevronRight, Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

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

        const res = await fetch(`http://localhost:5000/api/admin/users?userId=${userId}`);
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
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
            <Search size={18} className="text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Patients...</div>
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
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary flex-align-center gap-2">
                      <div className="avatar-circle bg-secondary text-white" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="text-muted text-sm">{u.email}</td>
                    <td><span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>Patient</span></td>
                    <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Active</span></td>
                    <td><button className="icon-btn text-muted hover:text-secondary"><ChevronRight size={18} /></button></td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-muted">No patients found.</td>
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
