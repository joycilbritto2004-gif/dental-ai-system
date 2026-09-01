import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, UserCircle, ChevronRight, Activity, BrainCircuit, Scan, Eye, Save, LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import './Dashboard.css';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    avgConfidence: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [rawConsultations, setRawConsultations] = useState([]);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const DOCTOR_ID = "3";
        const res = await fetch(`http://localhost:5000/api/consultations?doctorId=${DOCTOR_ID}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const myConsultations = await res.json();
        
        setRawConsultations(myConsultations);

        let pending = 0;
        let active = 0;
        let completed = 0;
        let confidenceSum = 0;
        let confidenceCount = 0;

        myConsultations.forEach(c => {
          if (c.status === "Pending") pending++;
          else if (c.status === "Accepted" || c.status === "In Consultation") active++;
          else if (c.status === "Completed") completed++;
          
          // Parse confidence
          const confStr = c.scanId?.confidence || c.confidence;
          if (confStr && confStr !== 'N/A') {
            const val = parseFloat(String(confStr).replace('%', ''));
            if (!isNaN(val)) {
              confidenceSum += val;
              confidenceCount++;
            }
          }
        });

        setStats({
          total: myConsultations.length,
          pending,
          active,
          completed,
          avgConfidence: confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 0
        });

        const sorted = [...myConsultations].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecentActivity(sorted.slice(0, 6));

      } catch (e) {
        console.error("Failed to parse consultations", e);
      }
    };
    
    fetchConsultations();
  }, []);

  // Compute Chart Data
  const statusData = useMemo(() => {
    return [
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'Active', value: stats.active, color: '#3b82f6' },
      { name: 'Completed', value: stats.completed, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [stats]);

  const conditionData = useMemo(() => {
    const counts = {};
    rawConsultations.forEach(c => {
      const cond = c.scanId?.condition?.replace('_', ' ') || c.condition;
      if (cond && cond !== 'N/A') {
        const name = cond.charAt(0).toUpperCase() + cond.slice(1);
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [rawConsultations]);

  const timelineData = useMemo(() => {
    const dates = {};
    rawConsultations.forEach(c => {
      const date = c.createdAt ? c.createdAt.split('T')[0] : c.date;
      if (date) {
        dates[date] = (dates[date] || 0) + 1;
      }
    });
    
    // Sort chronologically and take last 7 active days
    return Object.entries(dates)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7)
      .map(([date, count]) => {
        // Format date to DD MMM
        const d = new Date(date);
        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date;
        return { date: dateStr, Consultations: count };
      });
  }, [rawConsultations]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view animate-fade-in" initial="hidden" animate="show" variants={stagger}>
      {/* 1. Header */}
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Doctor Analytics</h2>
        <p>Welcome back, Dr. Priya Menon. Here is an overview of your clinical activity.</p>
      </motion.div>

      {/* 2. Statistics Cards */}
      <motion.div variants={item} className="kpi-grid mb-6">
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="kpi-icon text-white" style={{ borderRadius: '12px', background: 'var(--primary)' }}><Activity size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.total}</span>
            <span className="kpi-label">Total Cases</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-icon bg-warning-light text-warning" style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)' }}><Clock size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.pending}</span>
            <span className="kpi-label">Pending Review</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-icon bg-success-light text-success" style={{ borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle2 size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.completed}</span>
            <span className="kpi-label">Completed</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="kpi-icon text-white" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }}><BrainCircuit size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.avgConfidence}%</span>
            <span className="kpi-label">Avg AI Confidence</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Analytics Charts Grid */}
      <motion.div variants={item} className="dashboard-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Status Distribution */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <PieChartIcon size={20} className="text-secondary" /> Status Distribution
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Top Conditions */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <BarChartIcon size={20} className="text-secondary" /> Common Conditions
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {conditionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0, 210, 255, 0.05)' }} />
                  <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <LineChartIcon size={20} className="text-secondary" /> Case Volume
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Consultations" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Recent Activity */}
      <motion.div variants={item}>
        <div className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header mb-6 flex-between">
            <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Recent Patient Activity</h3>
            <Link to="/dashboard/doctor/consultations" className="btn btn-outline btn-sm">View All</Link>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>AI Prediction</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length > 0 ? recentActivity.map(req => (
                  <motion.tr key={req.id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td>
                      <div className="flex-align-center gap-3">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <UserCircle size={20} />
                        </div>
                        <span className="font-bold text-primary">{req.patientName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-main font-bold">{req.scanId?.condition?.replace('_', ' ') || req.condition || 'N/A'}</span>
                      <div className="text-xs text-muted">{req.scanId?.confidence || req.confidence || '0'}% conf.</div>
                    </td>
                    <td className="text-muted">{req.createdAt ? req.createdAt.split('T')[0] : req.date}</td>
                    <td>
                      <span className={`badge badge-${req.status === 'Completed' ? 'success' : req.status === 'Pending' ? 'warning' : 'primary'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      <Link to={req.status === 'Completed' ? `/dashboard/doctor/consultations` : `/dashboard/doctor/consultation/${req.id}`} className="btn btn-primary btn-sm flex-align-center gap-1">
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No recent activity.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorDashboard;
