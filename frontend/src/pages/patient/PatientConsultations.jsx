import { Link } from 'react-router-dom';
import { Video, Calendar, Clock, CreditCard, MessageSquare, Eye } from 'lucide-react';
import '../Dashboard.css';

const consultations = [
  {
    id: 1,
    doctor: "Dr. Ananya Sharma",
    clinic: "SmileCare Dental Clinic",
    condition: "Caries",
    date: "Oct 25, 2023",
    fee: 500,
    paymentStatus: "Pending",
    status: "Payment Requested",
    statusType: "warning"
  },
  {
    id: 2,
    doctor: "Dr. Rahul Nair",
    clinic: "Dental Care Clinic",
    condition: "Calculus",
    date: "Oct 20, 2023",
    fee: 600,
    paymentStatus: "Paid",
    status: "Completed",
    statusType: "success"
  },
  {
    id: 3,
    doctor: "Dr. Priya Menon",
    clinic: "Healthy Smile Clinic",
    condition: "Gingivitis",
    date: "Oct 26, 2023",
    fee: 400,
    paymentStatus: "Paid",
    status: "Accepted",
    statusType: "primary"
  }
];

const PatientConsultations = () => {
  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header mb-6">
        <h2>My Consultations</h2>
        <p>Track your consultation requests, upcoming appointments, and past history.</p>
      </div>

      <div className="card">
        <div className="card-header mb-4 flex-between">
          <h3>Consultation History</h3>
          <Link to="/dashboard/patient/doctors" className="btn btn-outline btn-sm">Find New Doctor</Link>
        </div>

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
              {consultations.map(cons => (
                <tr key={cons.id}>
                  <td>
                    <div className="font-semibold text-primary">{cons.doctor}</div>
                    <div className="text-sm text-muted">{cons.clinic}</div>
                  </td>
                  <td><span className="badge bg-blue-light text-blue">{cons.condition}</span></td>
                  <td>
                    <div className="flex-align-center gap-1 text-muted text-sm">
                      <Calendar size={14} /> {cons.date}
                    </div>
                  </td>
                  <td className="font-semibold">₹{cons.fee}</td>
                  <td>
                    <span className={`badge badge-${cons.statusType}`}>{cons.status}</span>
                  </td>
                  <td>
                    <div className="flex-align-center gap-2">
                      {cons.status === 'Payment Requested' && (
                        <Link to="/dashboard/patient/payments" className="btn btn-primary btn-sm flex-align-center gap-1">
                          <CreditCard size={14} /> Pay Now
                        </Link>
                      )}
                      {cons.status === 'Accepted' && (
                        <Link to="/dashboard/patient/messages" className="btn btn-success btn-sm flex-align-center gap-1">
                          <MessageSquare size={14} /> Chat
                        </Link>
                      )}
                      <button className="icon-btn"><Eye size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientConsultations;
