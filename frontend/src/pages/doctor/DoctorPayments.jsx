import { useState, useEffect } from 'react';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const DoctorPayments = () => {
  const [payments, setPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingSettlements, setPendingSettlements] = useState([]);

  useEffect(() => {
    try {
      const DOCTOR_ID = "1";
      const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
      const myConsultations = stored.filter(c => c.doctorId === DOCTOR_ID && c.fee);
      
      let earnings = 0;
      const pending = [];
      const history = [];

      myConsultations.forEach(c => {
        const amount = Number(c.fee) || 0;
        
        if (c.status === "Completed" || c.paymentStatus === "Paid" || c.paymentStatus === "Verified") {
          earnings += amount;
          history.push(c);
        } else if (c.status === "Pending Request" || c.status === "Accepted") {
          // Assuming the payment is locked/pending settlement
          pending.push({ name: c.patientName, amount });
          history.push(c);
        }
      });

      history.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setPayments(history);
      setTotalEarnings(earnings);
      setPendingSettlements(pending);

    } catch (e) {
      console.error("Error loading payments:", e);
    }
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Payments & Earnings</h2>
        <p>Track your consultation earnings and pending payments.</p>
      </motion.div>

      <motion.div variants={item} className="dashboard-grid">
        <div className="dashboard-left-col" style={{ flex: 2 }}>
          <div className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-4 flex-between">
              <h3 className="text-primary font-bold">Recent Transactions</h3>
              <button className="btn btn-outline btn-sm flex-align-center gap-1"><Download size={14}/> Export</button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map(p => (
                      <tr key={p.id}>
                        <td className="font-semibold text-primary">{p.patientName}</td>
                        <td className="text-muted text-sm">{p.consultationType || "Consultation"}</td>
                        <td className="text-muted text-sm">{p.date}</td>
                        <td className="font-bold text-success">+₹{p.fee}</td>
                        <td>
                          <span className={`badge ${p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified' ? 'badge-success' : 'badge-warning'}`}>
                            {p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified' ? 'Received' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>
                        No recent transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-right-col" style={{ flex: 1 }}>
          <div className="card bg-success-light border-success mb-6" style={{ padding: '2rem' }}>
            <div className="flex-align-center gap-2 mb-2 text-success">
              <TrendingUp size={24} />
              <h3 className="text-success font-bold">Total Earnings</h3>
            </div>
            <div className="font-bold text-success" style={{ fontSize: '2.5rem', margin: '1rem 0' }}>
              ₹{totalEarnings}
            </div>
            <p className="text-sm text-success" style={{ opacity: 0.8 }}>Real-time earnings calculated from completed cases.</p>
          </div>

          <div className="card glass-card" style={{ padding: '2rem' }}>
            <h4 className="font-bold text-primary mb-4">Pending Settlements</h4>
            {pendingSettlements.length > 0 ? (
              pendingSettlements.map((p, i) => (
                <div key={i} className="flex-between py-3 border-b border-glass">
                  <span className="text-muted">{p.name}</span>
                  <span className="font-semibold text-warning">₹{p.amount}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted text-center py-2">No pending settlements.</div>
            )}
            
            <button className="btn btn-primary w-full mt-6 pulse-glow" disabled={totalEarnings === 0}>
              Withdraw to Bank
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorPayments;
