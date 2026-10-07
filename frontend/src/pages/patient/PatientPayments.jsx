import { useState, useEffect } from 'react';
import { CreditCard, FileText, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/consultations');
        if (!res.ok) throw new Error('Failed to fetch payments');
        const myPayments = await res.json();

        myPayments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setPayments(myPayments);

        const outstanding = myPayments.reduce((acc, curr) => {
          if (curr.paymentStatus === 'Pending') {
            return acc + (Number(curr.fee) || Number(curr.totalAmount) || 0);
          }
          return acc;
        }, 0);

        setOutstandingBalance(outstanding);
      } catch (err) {
        console.error("Error loading payment history:", err);
      }
    };
    fetchPayments();
  }, []);

  const handleDownloadReceipt = (payment) => {
    alert(`Downloading receipt for Transaction ID: ${payment.transactionId || payment.id}\nAmount: ₹${payment.totalAmount || payment.fee}\nDoctor: ${payment.doctorName}`);
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      
      {/* HEADER */}
      <motion.div variants={item} className="mb-8" style={{ background: 'var(--bg-secondary)', padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-2" style={{ color: 'var(--primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>My Payments</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>View your consultation payment history and transactions.</p>
        </div>
      </motion.div>

      {/* OUTSTANDING BALANCE BANNER */}
      {outstandingBalance > 0 && (
        <motion.div variants={item} className="card mb-6" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--warning)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '16px', borderRadius: '50%' }}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 style={{ color: 'var(--primary)', margin: '0 0 4px 0', fontWeight: 800 }}>Outstanding Balance</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500 }}>You have pending payments that require attention.</p>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
            ₹{outstandingBalance}
          </div>
        </motion.div>
      )}

      {/* TRANSACTIONS LIST */}
      <motion.div variants={item} className="card" style={{ padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="font-bold text-primary m-0">Transaction History</h3>
          <div className="flex-align-center gap-2 text-success text-sm font-semibold bg-success-light px-3 py-1 rounded-full">
            <ShieldCheck size={16} /> Secure
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="modern-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Doctor / Service</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Amount</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((payment, idx) => (
                  <tr key={payment.id || `payment-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '20px 16px' }}>
                      <div className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>{payment.doctorName || payment.doctor}</div>
                      <div className="text-muted font-medium text-sm mt-1">{payment.consultationType || "Consultation"}</div>
                    </td>
                    <td style={{ padding: '20px 16px', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ₹{payment.totalAmount || payment.fee}
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <div className="font-medium text-primary">{payment.date}</div>
                      <div className="text-muted text-sm">{payment.time}</div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      {(() => {
                        let displayStatus = payment.paymentStatus || 'Paid';
                        if (displayStatus === 'Verified' || displayStatus === 'Completed') displayStatus = 'Paid';
                        
                        let badgeColor = 'success';
                        if (displayStatus === 'Pending') badgeColor = 'warning';
                        if (displayStatus === 'Failed') badgeColor = 'danger';

                        return (
                          <span className={`badge bg-${badgeColor}-light text-${badgeColor}`} style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800 }}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      {payment.paymentStatus === 'Pending' ? (
                        <button className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '999px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCard size={16} /> Pay Now
                        </button>
                      ) : (
                        <button onClick={() => handleDownloadReceipt(payment)} className="btn btn-outline" style={{ padding: '8px 20px', borderRadius: '999px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Download size={16} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: '60px 20px' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'inline-flex', marginBottom: '20px' }}>
                      <FileText size={48} opacity={0.5} />
                    </div>
                    <h4 className="font-bold text-primary mb-2">No payment history yet.</h4>
                    <p className="font-medium">Complete a consultation to see your transaction records here.</p>
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

export default PatientPayments;
