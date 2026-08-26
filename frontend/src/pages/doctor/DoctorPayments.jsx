import { CreditCard, Download, TrendingUp } from 'lucide-react';
import '../Dashboard.css';

const DoctorPayments = () => {
  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header mb-6">
        <h2>Payments & Earnings</h2>
        <p>Track your consultation earnings and pending payments.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-left-col" style={{ flex: 2 }}>
          <div className="card">
            <div className="card-header mb-4 flex-between">
              <h3>Recent Transactions</h3>
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
                  <tr>
                    <td className="font-semibold text-primary">Jane Doe</td>
                    <td className="text-muted text-sm">Online Consultation</td>
                    <td className="text-muted text-sm">Today, 11:30 AM</td>
                    <td className="font-bold text-success">+₹500</td>
                    <td><span className="badge badge-warning">Pending</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Michael Johnson</td>
                    <td className="text-muted text-sm">Follow-up Review</td>
                    <td className="text-muted text-sm">Oct 23, 2023</td>
                    <td className="font-bold text-success">+₹300</td>
                    <td><span className="badge badge-success">Received</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-primary">Alice Williams</td>
                    <td className="text-muted text-sm">Initial Consultation</td>
                    <td className="text-muted text-sm">Oct 21, 2023</td>
                    <td className="font-bold text-success">+₹500</td>
                    <td><span className="badge badge-success">Received</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-right-col" style={{ flex: 1 }}>
          <div className="card bg-success-light border-success mb-6">
            <div className="flex-align-center gap-2 mb-2 text-success">
              <TrendingUp size={24} />
              <h3 className="text-success">Total Earnings</h3>
            </div>
            <div className="font-bold text-success" style={{ fontSize: '2.5rem', margin: '1rem 0' }}>
              ₹12,450
            </div>
            <p className="text-sm text-success" style={{ opacity: 0.8 }}>+15% from last month</p>
          </div>

          <div className="card">
            <h4 className="font-semibold mb-3">Pending Settlements</h4>
            <div className="flex-between py-2 border-b">
              <span className="text-muted">Jane Doe</span>
              <span className="font-semibold text-warning">₹500</span>
            </div>
            <button className="btn btn-primary w-full mt-4">Withdraw to Bank</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPayments;
