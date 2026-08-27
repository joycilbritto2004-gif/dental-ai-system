import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
      
      // In a real app we would filter by logged-in patient ID
      // For this demo, we'll show all payments from localStorage
      // or we can assume all records in local storage belong to the current user
      const myPayments = stored;

      // Sort by newest
      myPayments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setPayments(myPayments);

      const outstanding = myPayments.reduce((acc, curr) => {
        if (curr.paymentStatus === 'Pending') {
          return acc + (Number(curr.fee) || Number(curr.totalAmount) || 0);
        }
        return acc;
      }, 0);

      setOutstandingBalance(outstanding);
    } catch (e) {
      console.error("Error loading payment history:", e);
    }
  }, []);

  const handleDownloadReceipt = (payment) => {
    // Generate a simple alert or mock download for the receipt
    alert(`Downloading receipt for Transaction ID: ${payment.transactionId || payment.id}\nAmount: ₹${payment.totalAmount || payment.fee}\nDoctor: ${payment.doctorName}`);
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Payment History</h2>
        <p>Manage your consultation fees and track payment records.</p>
      </motion.div>

      <motion.div variants={item} className="dashboard-grid">
        <div className="dashboard-left-col" style={{ flex: 2 }}>
          <div className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6 flex-between">
              <h3 className="text-primary font-bold">Transactions</h3>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Doctor / Service</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <motion.tr key={payment.id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                        <td>
                          <div className="font-semibold text-primary">{payment.doctorName || payment.doctor}</div>
                          <div className="text-sm text-muted">{payment.consultationType || "Consultation"}</div>
                        </td>
                        <td className="font-bold">₹{payment.totalAmount || payment.fee}</td>
                        <td>
                          <div className="text-muted text-sm">{payment.date}</div>
                          <div className="text-muted text-sm" style={{ fontSize: '0.75rem' }}>{payment.time}</div>
                        </td>
                        <td>
                          {(() => {
                            let displayStatus = payment.paymentStatus || 'Paid';
                            if (displayStatus === 'Verified' || displayStatus === 'Completed') displayStatus = 'Paid';
                            
                            let badgeClass = 'badge-success';
                            if (displayStatus === 'Pending') badgeClass = 'badge-warning';
                            if (displayStatus === 'Failed') badgeClass = 'badge-danger'; // Requires a .badge-danger CSS class if it exists

                            return (
                              <span className={`badge ${badgeClass}`}>
                                {displayStatus}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {payment.paymentStatus === 'Pending' ? (
                            <button 
                              className="btn btn-primary btn-sm flex-align-center gap-1"
                            >
                              <CreditCard size={14} /> Pay Now
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDownloadReceipt(payment)}
                              className="btn btn-outline btn-sm flex-align-center gap-1 text-primary"
                            >
                              <Download size={14} /> Receipt
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted" style={{ padding: '3rem' }}>
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <h4 className="font-bold text-primary mb-2">No payment history yet.</h4>
                        <p>Complete a consultation to see your transaction records here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-right-col" style={{ flex: 1 }}>
          <div className="card bg-blue-glow border-none mb-6" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', color: 'white', padding: '2rem' }}>
            <h3 className="mb-4" style={{ color: 'white' }}>Outstanding Balance</h3>
            <div className="font-bold mb-1" style={{ fontSize: '2.5rem' }}>
              ₹{outstandingBalance}
            </div>
            <p style={{ opacity: 0.8 }}>
              {outstandingBalance > 0 ? 'Pending payments require your attention.' : 'All payments are up to date.'}
            </p>
          </div>
          
          <div className="card glass-card" style={{ padding: '2rem' }}>
            <h4 className="font-bold text-primary mb-2">Secure Payments</h4>
            <p className="text-sm text-muted mb-4">
              DentaAI uses encrypted simulated payment gateways to ensure your transactions are safe. Currently running in demo mode.
            </p>
            <div className="flex-align-center gap-2 text-success text-sm font-semibold p-3 bg-success-light rounded-lg">
              <CheckCircle2 size={18} /> 100% Safe & Secure
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PatientPayments;
