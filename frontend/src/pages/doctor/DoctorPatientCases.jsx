import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserCircle, Calendar, Eye, Users, Search, Activity, 
  Sparkles, MessageSquare, LayoutDashboard, Stethoscope, 
  Clock, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const CONDITIONS = ['All', 'Gingivitis', 'Caries', 'Calculus', 'Mouth Ulcer', 'Tooth Discoloration', 'Hypodontia'];

const DoctorPatientCases = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('All');

  useEffect(() => {
    const fetchPatientCases = async () => {
      setLoading(true);
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
        
        // Include active cases (Accepted, In Consultation, Confirmed, In Progress)
        const myConsultations = (Array.isArray(stored) ? stored : []).filter(c => 
          c.status === 'Accepted' || 
          c.status === 'In Consultation' || 
          c.status === 'Confirmed' || 
          c.status === 'In Progress'
        );
        
        // Group by patient name to get unique active patients
        const patientMap = {};
        myConsultations.forEach(c => {
          const pKey = c.patientName || 'Unknown Patient';
          if (!patientMap[pKey]) {
            patientMap[pKey] = {
              name: pKey,
              casesCount: 0,
              latestCase: c,
              allCases: []
            };
          }
          patientMap[pKey].casesCount += 1;
          patientMap[pKey].allCases.push(c);
          
          // Update latest case if this one is newer
          if (new Date(c.createdAt || 0) > new Date(patientMap[pKey].latestCase.createdAt || 0)) {
            patientMap[pKey].latestCase = c;
          }
        });

        const uniquePatients = Object.values(patientMap);
        uniquePatients.sort((a, b) => new Date(b.latestCase.createdAt || 0) - new Date(a.latestCase.createdAt || 0));
        setPatients(uniquePatients);
      } catch (e) {
        console.error("Error loading patient cases:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientCases();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDateTime = (caseObj) => {
    if (caseObj.date) {
      return `${caseObj.date}${caseObj.time ? ` at ${caseObj.time}` : ''}`;
    }
    if (caseObj.createdAt) {
      const d = new Date(caseObj.createdAt);
      return !isNaN(d.getTime()) 
        ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Recent';
    }
    return 'Recent Case';
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    let totalCases = 0;
    let inConsultationCount = 0;

    patients.forEach(p => {
      totalCases += p.casesCount;
      if (p.latestCase?.status === 'In Consultation') {
        inConsultationCount++;
      }
    });

    return { totalPatients, totalCases, inConsultationCount };
  }, [patients]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      const pName = (p.name || '').toLowerCase();
      const latestCond = (p.latestCase?.scanId?.condition || p.latestCase?.condition || '').toLowerCase();
      const caseId = (p.latestCase?._id || p.latestCase?.id || '').toLowerCase();

      const matchesSearch = !query || pName.includes(query) || latestCond.includes(query) || caseId.includes(query);
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'In Consultation' && p.latestCase?.status === 'In Consultation') ||
        (statusFilter === 'Accepted' && p.latestCase?.status === 'Accepted');

      const matchesCondition = conditionFilter === 'All' || latestCond.includes(conditionFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCondition;
    });
  }, [patients, searchTerm, statusFilter, conditionFilter]);

  return (
    <div className="screening-history-wrapper">
      
      {/* 1. CLINICAL HEADER CARD */}
      <div className="screening-header-card">
        <div className="screening-header-stripe"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="screening-badge">
              <Users size={14} /> Active Patient Registry
            </div>
            <h1 className="screening-title">Patient Cases</h1>
            <p className="screening-subtitle">
              Comprehensive clinical overview and longitudinal records for all active patients currently under your care.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link 
              to="/dashboard/doctor" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#17324D',
                border: '1px solid #BFD4E5',
                fontWeight: 700,
                fontSize: '0.86rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutDashboard size={16} color="#00A6A6" /> Doctor Dashboard
            </Link>
            <Link 
              to="/dashboard/doctor/consultations" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '12px',
                background: '#00A6A6',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 166, 166, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <Calendar size={16} /> All Consultations
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW (3 SOLID CARDS) */}
      <div className="screening-stats-grid">
        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="screening-stat-value">{stats.totalPatients}</div>
              <div className="screening-stat-label">Active Patients Under Care</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#F0FDFA', color: '#00A6A6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #99F6E4' }}>
            Direct Roster
          </span>
        </div>

        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF' }}>
              <Activity size={24} />
            </div>
            <div>
              <div className="screening-stat-value">{stats.totalCases}</div>
              <div className="screening-stat-label">Total Cumulative Cases</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            Longitudinal
          </span>
        </div>

        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="screening-stat-value">{stats.inConsultationCount}</div>
              <div className="screening-stat-label">Active Clinical Sessions</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
            In Progress
          </span>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="screening-controls-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Omni Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text"
              placeholder="Search patients by name, diagnosis, or case ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="screening-search-input"
              style={{ width: '100%', paddingLeft: '44px' }}
            />
          </div>

          {/* Status Segmented Toggle */}
          <div className="screening-view-toggle">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`view-toggle-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            >
              All Active ({patients.length})
            </button>
            <button 
              onClick={() => setStatusFilter('In Consultation')}
              className={`view-toggle-btn ${statusFilter === 'In Consultation' ? 'active' : ''}`}
            >
              In Consultation
            </button>
            <button 
              onClick={() => setStatusFilter('Accepted')}
              className={`view-toggle-btn ${statusFilter === 'Accepted' ? 'active' : ''}`}
            >
              Accepted
            </button>
          </div>

        </div>

        {/* Condition Filter Chips */}
        <div className="screening-chips-bar" style={{ marginTop: '4px' }}>
          {CONDITIONS.map(cond => {
            const isSelected = conditionFilter === cond;
            return (
              <button
                key={cond}
                onClick={() => setConditionFilter(cond)}
                className={`screening-chip ${isSelected ? 'active' : ''}`}
                style={{
                  background: isSelected ? '#00A6A6' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  borderColor: isSelected ? '#00A6A6' : '#E2E8F0',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid'
                }}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SOLID PATIENT CASES GRID */}
      {filteredPatients.length > 0 ? (
        <div className="doctor-cases-grid">
          {filteredPatients.map((p, index) => {
            const targetId = p.latestCase?._id || p.latestCase?.id;
            const conditionName = p.latestCase?.scanId?.condition?.replace('_', ' ') || p.latestCase?.condition || 'General Dental';
            const confidence = p.latestCase?.scanId?.confidence || p.latestCase?.confidence;
            const status = p.latestCase?.status || 'Accepted';

            return (
              <div key={index} className="doctor-case-card">
                
                {/* Top Patient Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div 
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '16px', 
                          background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)', 
                          color: '#FFFFFF', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800, 
                          fontSize: '1.05rem',
                          boxShadow: '0 4px 12px rgba(0, 166, 166, 0.2)'
                        }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.2px' }}>
                          {p.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, background: '#F0FDFA', color: '#00A6A6', border: '1px solid #99F6E4', padding: '1px 8px', borderRadius: '6px' }}>
                            {p.casesCount} Total Case{p.casesCount > 1 ? 's' : ''}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748B', fontFamily: 'monospace' }}>
                            P-{targetId ? targetId.toString().substring(0, 6) : '0000'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link 
                      to={`/dashboard/doctor/consultation/${targetId}`}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        border: '1px solid #BFD4E5',
                        color: '#17324D',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(7, 26, 51, 0.04)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Eye size={14} color="#00A6A6" /> Workspace
                    </Link>
                  </div>

                  {/* Latest Diagnosis Summary Box */}
                  <div 
                    style={{ 
                      background: '#F8FAFC', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '16px', 
                      padding: '16px', 
                      marginBottom: '16px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B' }}>
                        Latest Clinical Assessment
                      </span>
                      {confidence && confidence !== 'N/A' && (
                        <span 
                          style={{ 
                            fontSize: '0.74rem', 
                            fontWeight: 800, 
                            background: '#F0FDFA', 
                            color: '#00A6A6', 
                            border: '1px solid #99F6E4', 
                            padding: '2px 8px', 
                            borderRadius: '999px' 
                          }}
                        >
                          ⚡ {confidence}% Certainty
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                        {conditionName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                        <Calendar size={13} color="#00A6A6" /> {formatDateTime(p.latestCase)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status & Workflow Row */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingTop: '14px', 
                    borderTop: '1px solid #F1F5F9',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
                    <span 
                      style={{ 
                        padding: '3px 10px', 
                        borderRadius: '999px', 
                        fontSize: '0.74rem', 
                        fontWeight: 800,
                        background: status === 'In Consultation' ? '#F0FDFA' : '#ECFDF5',
                        color: status === 'In Consultation' ? '#00A6A6' : '#059669',
                        border: `1px solid ${status === 'In Consultation' ? '#99F6E4' : '#A7F3D0'}`
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link 
                      to={`/dashboard/doctor/consultation/${targetId}/messages`}
                      state={{ consultationId: targetId }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: '#00A6A6',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 6px rgba(0, 166, 166, 0.25)'
                      }}
                    >
                      <MessageSquare size={13} /> Chat
                    </Link>

                    <Link 
                      to={`/dashboard/doctor/consultation/${targetId}`}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: '#17324D',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <ArrowRight size={13} /> Open Case
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #BFD4E5', 
            borderRadius: '24px', 
            padding: '50px 24px', 
            textAlign: 'center', 
            boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)' 
          }}
        >
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(0, 166, 166, 0.1)', 
              color: '#00A6A6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px auto' 
            }}
          >
            <Users size={32} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
            {searchTerm || conditionFilter !== 'All' || statusFilter !== 'ALL' 
              ? 'No matching patient records found' 
              : 'No Active Patients Under Care'}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#64748B', maxWidth: '440px', marginInline: 'auto' }}>
            {searchTerm || conditionFilter !== 'All' || statusFilter !== 'ALL'
              ? 'Try modifying your search keywords or clearing active filters to see all patient cases.'
              : 'You do not have any accepted or in-consultation patient cases. Visit your pending reviews queue to accept new consultations.'}
          </p>
          <Link 
            to="/dashboard/doctor/pending"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              background: '#00A6A6',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)'
            }}
          >
            <Clock size={16} /> View Pending Reviews
          </Link>
        </div>
      )}

    </div>
  );
};

export default DoctorPatientCases;
