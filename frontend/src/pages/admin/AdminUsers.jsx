import { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;

      const res = await fetch(`http://localhost:5000/api/admin/users?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAccountStatusUpdate = async (targetUserId, newStatus) => {
    if (newStatus === 'Blocked') {
      if (!window.confirm("Are you sure you want to block this user? They will not be able to log in.")) return;
    }
    
    try {
      const userStr = localStorage.getItem('dentaai_user');
      const user = JSON.parse(userStr);
      const adminId = user._id || user.id;

      const res = await fetch(`http://localhost:5000/api/admin/users/${targetUserId}/account-status?userId=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed to update status: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error updating account status:", err);
      alert("Error updating account status.");
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>User Management</h2>
          <p>View and manage all registered users in the system.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="flex-between mb-6">
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
            <Search size={18} className="text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Users...</div>
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
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary">{u.name}</td>
                    <td className="text-muted text-sm">{u.email}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.role === 'doctor' ? 'var(--primary)' : u.role === 'admin' ? '#ef4444' : 'rgba(0, 210, 255, 0.1)', 
                        color: u.role === 'doctor' || u.role === 'admin' ? 'white' : 'var(--secondary)' 
                      }}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge" style={{ background: u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: u.accountStatus === 'Blocked' ? '#ef4444' : '#059669', border: `1px solid ${u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>{u.accountStatus || 'Active'}</span></td>
                    <td>
                      {(() => {
                        const currentUser = JSON.parse(localStorage.getItem('dentaai_user') || '{}');
                        const isSelf = (currentUser._id || currentUser.id) === u._id;

                        if (isSelf) {
                          return <span className="text-muted text-xs">Current User</span>;
                        }

                        if (u.accountStatus === 'Blocked') {
                          return <button onClick={() => handleAccountStatusUpdate(u._id, 'Active')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Unblock</button>;
                        }

                        return <button onClick={() => handleAccountStatusUpdate(u._id, 'Blocked')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Block</button>;
                      })()}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-muted">No users found.</td>
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

export default AdminUsers;
