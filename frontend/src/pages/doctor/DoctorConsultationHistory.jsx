import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, History, Eye, UserCircle, Search, Filter, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConsultationStatusMeta } from '../../utils/consultationStatus';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const DoctorConsultationHistory = () => {
  const [historyCases, setHistoryCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        let DOCTOR_ID = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          DOCTOR_ID = user._id || user.id;
        }
        
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/consultations?doctorId=${DOCTOR_ID}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch from backend');
        const stored = await res.json();
        
        const myHistory = stored.filter(c => (
          c.status === "Completed" || 
          c.status === "Verified" || 
          c.status === "Rejected" ||
          c.status === "Cancelled"
        ));
        
        myHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setHistoryCases(myHistory);
      } catch (e) {
        console.error("Error loading history:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredCases = historyCases.filter(req => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      (req.patientName && req.patientName.toLowerCase().includes(term)) ||
      (req.finalDiagnosis && req.finalDiagnosis.toLowerCase().includes(term)) ||
      (req.condition && req.condition.toLowerCase().includes(term)) ||
      (req.rejectionReason && req.rejectionReason.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Completed' && (req.status === 'Completed' || req.status === 'Verified')) ||
      (statusFilter === req.status);

    return matchesSearch && matchesStatus;
  });

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Consultation History</h2>
        <p>A complete log of your past and finalized consultations.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6 flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <h3 className="flex-align-center gap-2 text-primary" style={{ margin: 0 }}>
            <History size={24} className="text-secondary" /> Past Consultations
          </h3>

          {/* Search and Filters Toolbar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search patient, diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '0.9rem', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} className="text-muted" />
              <select 
                className="form-input" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.9rem', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Diagnosis / Note</th>
                <th>Date</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length > 0 ? (
                filteredCases.map(req => {
                  const statusMeta = getConsultationStatusMeta(req.status);
                  return (
                    <motion.tr key={req.id} whileHover={{ backgroundColor: 'rgba(0, 166, 166, 0.05)' }}>
                      <td>
                        <div className="flex-align-center gap-3">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <UserCircle size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-primary">{req.patientName}</div>
                            <div className="text-sm text-muted">ID: P-{req.id ? req.id.substring(0, 5) : '00000'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-main">
                        {req.status === 'Rejected' || req.status === 'Cancelled' ? (
                          <div>
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>Declined</span>
                            {req.rejectionReason && (
                              <div className="text-xs text-muted" style={{ fontStyle: 'italic', marginTop: '2px' }}>
                                Reason: "{req.rejectionReason}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600 }}>{req.finalDiagnosis || req.condition}</div>
                            {req.followUpDate && (
                              <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                                Follow-up: {req.followUpDate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex-align-center gap-1 text-muted">
                          <Calendar size={14} /> {req.date}
                        </div>
                      </td>
                      <td className="font-bold">₹{req.fee || req.totalAmount || 0}</td>
                      <td>
                        <span className="badge" style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}`, padding: '4px 10px', borderRadius: '999px', fontWeight: 700 }}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link to={`/dashboard/doctor/consultation/${req.id}`} className="btn btn-outline btn-sm flex-align-center gap-1" title="View Workspace">
                            <Eye size={14} /> View
                          </Link>
                          <Link to={`/dashboard/doctor/consultation/${req.id}/messages`} state={{ consultationId: req.id }} className="btn btn-outline btn-sm flex-align-center gap-1" title="View Consultation Messages">
                            <MessageSquare size={14} /> Messages
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>
                    {historyCases.length === 0 
                      ? 'No consultation history available.' 
                      : 'No consultations match your search or filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorConsultationHistory;
