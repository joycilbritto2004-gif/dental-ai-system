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

      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`http://localhost:5000/api/admin/users?userId=${userId}`, { headers });
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

      const token = localStorage.getItem('dentaai_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`http://localhost:5000/api/admin/users/${targetUserId}/account-status?userId=${adminId}`, {
        method: 'PUT',
        headers,
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
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
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
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(191, 212, 229, 0.70)', width: '300px' }}>
            <Search size={18} className="mr-2" style={{ color: '#536579' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#17324D', outline: 'none', width: '100%', fontWeight: 500 }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center" style={{ color: '#536579' }}><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Users...</div>
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
                  <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(22, 119, 255, 0.05)' }}>
                    <td className="font-bold" style={{ color: '#17324D' }}>{u.name}</td>
                    <td className="text-sm" style={{ color: '#536579' }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.role === 'doctor' ? 'rgba(22, 119, 255, 0.12)' : u.role === 'admin' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(0, 141, 255, 0.10)', 
                        color: u.role === 'doctor' ? '#1677FF' : u.role === 'admin' ? '#DC2626' : '#008DFF',
                        border: `1px solid ${u.role === 'doctor' ? 'rgba(22, 119, 255, 0.35)' : u.role === 'admin' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(0, 141, 255, 0.25)'}`,
                        fontWeight: 600
                      }}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm" style={{ color: '#536579' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                        color: u.accountStatus === 'Blocked' ? '#DC2626' : '#059669', 
                        border: `1px solid ${u.accountStatus === 'Blocked' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                        fontWeight: 700 
                      }}>
                        {u.accountStatus || 'Active'}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const currentUser = JSON.parse(localStorage.getItem('dentaai_user') || '{}');
                        const isSelf = (currentUser._id || currentUser.id) === u._id;

                        if (isSelf) {
                          return <span className="text-xs" style={{ color: '#536579', fontWeight: 600 }}>Current User</span>;
                        }

                        if (u.accountStatus === 'Blocked') {
                          return <button onClick={() => handleAccountStatusUpdate(u._id, 'Active')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.08)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.50)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Unblock</button>;
                        }

                        return <button onClick={() => handleAccountStatusUpdate(u._id, 'Blocked')} className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.50)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Block</button>;
                      })()}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4" style={{ color: '#536579' }}>No users found.</td>
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
