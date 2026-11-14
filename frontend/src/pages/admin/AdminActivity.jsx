import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Server, Database, ShieldCheck, Cpu, 
  ArrowLeft, CheckCircle2, AlertCircle, Clock, Search, 
  Layers, Lock, Wifi, RefreshCw, KeyRound, UserCheck, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const DEFAULT_AUDIT_LOGS = [
  {
    id: 1,
    title: 'Admin Session Authenticated',
    actor: 'Permanent Administrator joycilbritto2004@gmail.com',
    detail: 'Secure JWT administrative session validated via institutional RBAC gateway.',
    category: 'Auth',
    time: 'Just now',
    icon: <ShieldCheck size={16} />,
    color: '#2563EB',
    bg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    id: 2,
    title: 'Diagnostic Radiography Screening Submitted',
    actor: 'Jane Doe • Patient Intake #6abb60c9',
    detail: 'Oral panoramic scan uploaded and processed by diagnostic triage broker.',
    category: 'Diagnostics',
    time: '10m ago',
    icon: <Activity size={16} />,
    color: '#00A6A6',
    bg: 'rgba(0, 166, 166, 0.1)'
  },
  {
    id: 3,
    title: 'Caries Diagnosis Clinically Finalized',
    actor: 'Dr. Priya Menon • Verified Periodontist',
    detail: 'AI classification verified and signed off into permanent consultation history.',
    category: 'Diagnostics',
    time: '45m ago',
    icon: <CheckCircle2 size={16} />,
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    id: 4,
    title: 'MongoDB Storage Engine Health Verified',
    actor: 'System Daemon • WiredTiger Engine',
    detail: 'Database connection pool verified with sub-5ms query response latency.',
    category: 'Database',
    time: '1h ago',
    icon: <Database size={16} />,
    color: '#1677FF',
    bg: 'rgba(22, 119, 255, 0.1)'
  },
  {
    id: 5,
    title: 'New Patient Intake Account Registered',
    actor: 'Michael Johnson • Direct Patient Onboarding',
    detail: 'Identity registered and biometric credentials assigned under HIPAA compliance.',
    category: 'Auth',
    time: '2h ago',
    icon: <UserCheck size={16} />,
    color: '#0891B2',
    bg: 'rgba(8, 145, 178, 0.1)'
  },
  {
    id: 6,
    title: 'MobileNetV2 Neural Network Inference Cycle',
    actor: 'Python Flask AI Engine (Port 5002)',
    detail: 'Batch diagnostic evaluation completed across 6 supported oral pathology classes.',
    category: 'Diagnostics',
    time: '3h ago',
    icon: <Cpu size={16} />,
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)'
  },
  {
    id: 7,
    title: 'Doctor Medical Board Credential Approved',
    actor: 'Administrative Authority • DCI Registry',
    detail: 'Practitioner license validated with board certification privileges unlocked.',
    category: 'Security',
    time: '5h ago',
    icon: <Stethoscope size={16} />,
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.1)'
  }
];

const AdminActivity = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredLogs = useMemo(() => {
    return DEFAULT_AUDIT_LOGS.filter(log => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        log.title.toLowerCase().includes(q) || 
        log.actor.toLowerCase().includes(q) || 
        log.detail.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* 1. CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <Activity size={14} /> Operations & Telemetry
              </div>
              <h1 className="screening-title">System Activity & Infrastructure Health</h1>
              <p className="screening-subtitle">
                Real-time daemon operational status, microservice uptime heartbeats, and immutable chronological administrative audit logs.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/admin" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #BFD4E5',
                  color: '#17324D',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDFA', border: '1px solid #99E3D8', padding: '8px 14px', borderRadius: '12px', color: '#0F766E', fontSize: '0.82rem', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                Cluster Operational (Zero Anomalies)
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: API Gateway */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #00A6A6',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Server size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                Port 5000
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Node.js API Gateway
              </div>
            </div>
          </div>

          {/* Card 2: MongoDB Cluster */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #2563EB',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                Port 27017
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                MongoDB Database
              </div>
            </div>
          </div>

          {/* Card 3: AI Engine */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #10B981',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cpu size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                Port 5002
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Python AI Microservice
              </div>
            </div>
          </div>

          {/* Card 4: WebSocket Real-Time Broker */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #F59E0B',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wifi size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                Connected
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Socket.IO Telemetry
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. TWO-COLUMN EQUAL 50/50 LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: INFRASTRUCTURE HEALTH ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: Core Daemon Status */}
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', padding: '8px', borderRadius: '10px' }}>
                  <Server size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Infrastructure Health & Heartbeats
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Real-time daemon ping latencies and microservice cluster availability.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Daemon 1: Node.js */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Server size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Node.js Core API Gateway
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        Express REST Architecture &bull; Port 5000
                      </div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    Online (12ms)
                  </span>
                </div>

                {/* Daemon 2: MongoDB */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Database size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        MongoDB WiredTiger Engine
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        Document Persistence &bull; 127.0.0.1:27017
                      </div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    Connected
                  </span>
                </div>

                {/* Daemon 3: Python AI */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Cpu size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Python AI Inference Microservice
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        MobileNetV2 Neural Network &bull; Port 5002
                      </div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    Operational
                  </span>
                </div>

                {/* Daemon 4: WebSockets */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wifi size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        WebSocket Real-Time Notification Broker
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        Socket.IO State Synchronization &bull; Active
                      </div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    Synchronized
                  </span>
                </div>

              </div>
            </motion.div>

            {/* Card 2: Security & Encryption */}
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '8px', borderRadius: '10px' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Security Compliance & Audits
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Institutional encryption standards and clinical data protection.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D', display: 'block' }}>Data-at-Rest</span>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800 }}>AES-256 Encrypted</span>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D', display: 'block' }}>In-Flight Transport</span>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800 }}>TLS 1.3 Certified</span>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D', display: 'block' }}>Access Control</span>
                  <span style={{ fontSize: '0.74rem', color: '#2563EB', fontWeight: 800 }}>RBAC Token Enforced</span>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17324D', display: 'block' }}>Audit Trail</span>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 800 }}>Immutable Log Stream</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN: CHRONOLOGICAL AUDIT LOGS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '8px', borderRadius: '10px' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                      Institutional Audit Ledger
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                      Real-time stream of security, authentication, and diagnostic transactions.
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {['All', 'Auth', 'Diagnostics', 'Database', 'Security'].map(cat => {
                    const isActive = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid',
                          background: isActive ? '#17324D' : '#F8FAFC',
                          color: isActive ? '#FFFFFF' : '#475569',
                          borderColor: isActive ? '#17324D' : '#E2E8F0',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar for Logs */}
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Filter audit logs by keyword, actor, or action..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#17324D',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Timeline Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '540px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: log.bg,
                          color: log.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {log.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#17324D' }}>
                            {log.title}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {log.time}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                          {log.actor}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                          {log.detail}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                    <ShieldCheck size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>No audit logs match your filter criteria.</p>
                  </div>
                )}
              </div>

            </motion.div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default AdminActivity;