import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Calendar, Clock, CreditCard, MessageSquare, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';

const PatientConsultations = () => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/consultations');
        if (!res.ok) throw new Error('Failed to fetch consultations');
        const data = await res.json();
        setConsultations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultations();
  }, []);

  // Fallback function for status color
  const getStatusType = (status) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return 'success';
      case 'Payment Requested':
      case 'Pending Request':
        return 'warning';
      case 'Accepted':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header mb-6">
        <h2>My Consultations</h2>
        <p>Track your consultation requests, upcoming appointments, and past history.</p>
      </div>

      <div className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6 flex-between">
          <h3 className="text-primary font-bold">Consultation History</h3>
          <Link to="/dashboard/patient/doctors" className="btn btn-outline btn-sm">Find New Doctor</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : consultations.length > 0 ? (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Doctor / Clinic</th>
                  <th>AI Condition</th>
                  <th>Date</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map(cons => {
                  const doctorName = cons?.doctorName || cons?.doctor || 'Unknown Doctor';
                  const clinicName = cons?.doctorSpecialization || cons?.clinic || 'Unknown Clinic';
                  const condition = cons?.condition || 'N/A';
                  const dateStr = cons?.date || 'N/A';
                  const timeStr = cons?.time || '';
                  const fee = cons?.fee || cons?.totalAmount || 0;
                  const status = cons?.status || 'Pending';
                  const statusType = cons?.statusType || getStatusType(status);
                  const isExpanded = expandedRow === cons.id;

                  return (
                    <React.Fragment key={cons?.id || Math.random().toString()}>
                      <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }} style={{ cursor: 'pointer' }} onClick={() => toggleRow(cons.id)}>
                        <td>
                          <div className="font-semibold text-primary">{doctorName}</div>
                          <div className="text-sm text-muted">{clinicName}</div>
                        </td>
                        <td><span className="badge bg-blue-light text-blue">{condition}</span></td>
                        <td>
                          <div className="flex-align-center gap-1 text-muted text-sm">
                            <Calendar size={14} /> {dateStr} {timeStr && `at ${timeStr}`}
                          </div>
                        </td>
                        <td className="font-semibold">₹{fee}</td>
                        <td>
                          <span className={`badge badge-${statusType}`}>{status}</span>
                        </td>
                        <td>
                          <div className="flex-align-center gap-2">
                            {status === 'Payment Requested' && (
                              <Link to="/dashboard/patient/payments" className="btn btn-primary btn-sm flex-align-center gap-1">
                                <CreditCard size={14} /> Pay Now
                              </Link>
                            )}
                            {status === 'Accepted' && (
                              <Link to="/dashboard/patient/messages" state={{ consultationId: cons.id }} className="btn btn-success btn-sm flex-align-center gap-1">
                                <MessageSquare size={14} /> Chat
                              </Link>
                            )}
                            <button className="icon-btn text-primary" onClick={(e) => { e.stopPropagation(); toggleRow(cons.id); }}>
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                            <AnimatePresence>
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
                                  {status === 'Completed' || status === 'Verified' ? (
                                    <div className="card glass-card" style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                                      <h4 className="text-secondary font-bold mb-2 flex-align-center gap-2">
                                        <MessageSquare size={18} /> Physician's Final Diagnosis
                                      </h4>
                                      <p className="text-main mb-4" style={{ lineHeight: 1.6, background: 'rgba(255,255,255,0.6)', padding: '12px', borderRadius: '8px', fontStyle: 'italic' }}>
                                        {cons.finalDiagnosis || 'No specific diagnosis was documented.'}
                                      </p>
                                      
                                      <h4 className="text-secondary font-bold mb-2 flex-align-center gap-2">
                                        <Clock size={18} /> Treatment Plan & Recommendations
                                      </h4>
                                      <p className="text-main" style={{ lineHeight: 1.6, background: 'rgba(255,255,255,0.6)', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-line' }}>
                                        {cons.doctorNotes || 'No additional treatment plan was prescribed.'}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center text-muted" style={{ padding: '1rem' }}>
                                      This consultation is currently marked as <strong>{status}</strong>. Please wait for the doctor to review your case and provide a final diagnosis.
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <h4 className="font-bold text-primary mb-2">No consultations found.</h4>
            <p>Select a doctor and start a new consultation request.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientConsultations;
