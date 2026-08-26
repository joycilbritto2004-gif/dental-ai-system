import { useState } from 'react';
import { CreditCard, CheckCircle2, Clock, FileText } from 'lucide-react';
import '../Dashboard.css';

const paymentsData = [
  {
    id: 1,
    doctor: "Dr. Ananya Sharma",
    service: "Dental Consultation",
    amount: 500,
    date: "-",
    status: "Pending",
    statusClass: "warning"
  },
  {
    id: 2,
    doctor: "Dr. Rahul Kumar",
    service: "Follow-up Consultation",
    amount: 600,
    date: "Oct 20, 2023",
    status: "Paid",
    statusClass: "success"
  },
  {
    id: 3,
    doctor: "Dr. Anjali Menon",
    service: "Initial Consultation",
    amount: 400,
    date: "Sep 15, 2023",
    status: "Paid",
    statusClass: "success"
  }
];

const PatientPayments = () => {
  const [payments, setPayments] = useState(paymentsData);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = (id) => {
    setIsProcessing(true);
    // Simulate payment process
    setTimeout(() => {
      setPayments(payments.map(p => {
        if (p.id === id) {
          return { ...p, status: 'Paid', statusClass: 'success', date: 'Just now' };
        }
        return p;
      }));
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header mb-6">
        <h2>Payment History</h2>
        <p>Manage your consultation fees and track payment records.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-left-col" style={{ flex: 2 }}>
          <div className="card">
            <div className="card-header mb-4">
              <h3>Transactions</h3>
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
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>
                        <div className="font-semibold text-primary">{payment.doctor}</div>
                        <div className="text-sm text-muted">{payment.service}</div>
                      </td>
                      <td className="font-bold">₹{payment.amount}</td>
                      <td className="text-muted text-sm">{payment.date}</td>
                      <td>
                        <span className={`badge badge-${payment.statusClass}`}>{payment.status}</span>
                      </td>
                      <td>
                        {payment.status === 'Pending' ? (
                          <button 
                            className="btn btn-primary btn-sm flex-align-center gap-1"
                            onClick={() => handlePayNow(payment.id)}
                            disabled={isProcessing}
                          >
                            <CreditCard size={14} /> {isProcessing ? 'Processing...' : 'Pay Now'}
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm flex-align-center gap-1 text-muted">
                            <FileText size={14} /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-right-col" style={{ flex: 1 }}>
          <div className="card bg-blue-glow border-none" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', color: 'white' }}>
            <h3 className="mb-4" style={{ color: 'white' }}>Outstanding Balance</h3>
            <div className="font-bold mb-1" style={{ fontSize: '2.5rem' }}>
              ₹{payments.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0)}
            </div>
            <p style={{ opacity: 0.8 }}>Pending payments for 1 consultation</p>
          </div>
          
          <div className="card mt-4">
            <h4 className="font-semibold mb-2">Secure Payments</h4>
            <p className="text-sm text-muted mb-4">
              DentaAI uses encrypted simulated payment gateways to ensure your transactions are safe. Currently running in demo mode.
            </p>
            <div className="flex-align-center gap-2 text-success text-sm font-semibold">
              <CheckCircle2 size={16} /> 100% Safe & Secure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPayments;
