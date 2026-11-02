import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  FileStack, 
  Activity, 
  Sparkles, 
  Stethoscope
} from 'lucide-react';
import '../Dashboard.css';

/**
 * PatientScreeningHistory
 * Dedicated page for authenticated patients to view their complete AI dental screening history.
 * Displays actual saved records from the database with clean cards, status dots, confidence pills,
 * and direct links to view the full report with precautions.
 */
const PatientScreeningHistory = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchScreeningHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) {
        throw new Error('User authentication session not found. Please log in again.');
      }
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('dentaai_token');

      const response = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch screening records.`);
      }

      const data = await response.json();
      // Ensure sorted newest first
      const sorted = Array.isArray(data) 
        ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setScans(sorted);
    } catch (err) {
      console.error('Error fetching screening history:', err);
      setError(err.message || 'An error occurred while loading your screening history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreeningHistory();
  }, []);

  const getStatusDotColor = (confidence) => {
    if (confidence === null || confidence === undefined || isNaN(Number(confidence))) {
      return '#00A6A6'; // Default teal if no confidence score
    }
    const score = Number(confidence);
    if (score > 90) return '#16A34A'; // Green
    if (score > 70) return '#F59E0B'; // Amber
    return '#DC2626'; // Red
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  const filteredScans = scans.filter((scan) => {
    const term = searchTerm.toLowerCase();
    const condition = (scan.condition || '').toLowerCase().replace(/_/g, ' ');
    const id = (scan.scanId || scan._id || '').toLowerCase();
    return condition.includes(term) || id.includes(term);
  });

  const totalScans = scans.length;
  const highConfidenceCount = scans.filter(s => s.confidence && Number(s.confidence) > 90).length;

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '40px' }}
    >
      {/* PAGE HEADER */}
      <motion.div 
        variants={item} 
        className="mb-6 page-header-card" 
        style={{ 
          padding: '32px 36px', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color, #BFD4E5)', 
          background: 'var(--card-bg, #FFFFFF)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', 
          position: 'relative', 
          overflow: 'hidden' 
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary, #00A6A6)' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--secondary, #00A6A6)' }}>
                Patient Medical Records
              </span>
            </div>
            <h2 style={{ color: 'var(--text-primary, #17324D)', letterSpacing: '-0.5px', fontSize: '2.2rem', lineHeight: '1.2', margin: '0 0 6px 0', fontWeight: 800 }}>
              Screening History
            </h2>
            <p style={{ color: 'var(--text-secondary, #52677A)', fontSize: '1.05rem', margin: 0, fontWeight: 500 }}>
              Review your past dental AI scans, confidence evaluations, and verified care reports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/dashboard/patient" 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                background: 'var(--primary, #1677FF)',
                color: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(22, 119, 255, 0.25)'
              }}
            >
              <Sparkles size={16} /> Start New AI Scan
            </Link>
          </div>
        </div>
      </motion.div>

      {/* STATS OVERVIEW BAR */}
      <motion.div 
        variants={item}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div className="card" style={{ background: 'var(--card-bg, rgba(255, 255, 255, 0.72))', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.65))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#E0EEFF', color: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <History size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#17324D', lineHeight: 1.2 }}>{totalScans}</div>
            <div style={{ fontSize: '0.8rem', color: '#52677A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Screenings</div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--card-bg, rgba(255, 255, 255, 0.72))', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.65))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#17324D', lineHeight: 1.2 }}>{highConfidenceCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#52677A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>High Confidence Scans</div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--card-bg, rgba(255, 255, 255, 0.72))', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.65))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#DDF7F3', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#17324D', lineHeight: 1.2 }}>Dentist Verification</div>
            <Link to="/dashboard/patient/recommended-doctors" style={{ fontSize: '0.8rem', color: '#00A6A6', fontWeight: 700, textDecoration: 'none' }}>
              Find a Specialist &rarr;
            </Link>
          </div>
        </div>
      </motion.div>

      {/* SEARCH AND FILTER BAR */}
      <motion.div variants={item} style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
          <Search size={18} color="#718496" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search screening by condition or scan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px ' + '44px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.65))',
              background: 'var(--card-bg, rgba(255, 255, 255, 0.75))',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#17324D',
              fontSize: '0.92rem',
              fontWeight: 500,
              outline: 'none',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
            }}
          />
        </div>
      </motion.div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary, #00A6A6)" />
          <p style={{ marginTop: '16px', color: '#52677A', fontWeight: 600, fontSize: '0.95rem' }}>Loading your screening history...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <motion.div variants={item} className="card" style={{ padding: '36px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '16px' }}>
          <AlertTriangle size={42} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 8px 0' }}>Could Not Load Screening History</h3>
          <p style={{ color: '#B91C1C', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.92rem' }}>{error}</p>
          <button 
            onClick={fetchScreeningHistory} 
            className="btn btn-outline" 
            style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 700, borderColor: '#1677FF', color: '#1677FF' }}
          >
            Retry Connection
          </button>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && scans.length === 0 && (
        <motion.div 
          variants={item} 
          className="card text-center" 
          style={{ 
            padding: '70px 20px', 
            background: '#FFFFFF', 
            border: '1px dashed #BFD4E5', 
            borderRadius: '20px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' 
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#1677FF' }}>
            <FileStack size={32} />
          </div>
          <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 8px 0' }}>No Screening History Yet</h3>
          <p style={{ color: '#52677A', fontSize: '1rem', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Upload an intraoral dental photo on your dashboard to perform an AI scan. Your results and reports will automatically appear here.
          </p>
          <Link 
            to="/dashboard/patient" 
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              background: '#1677FF',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.25)'
            }}
          >
            Start Your First Scan
          </Link>
        </motion.div>
      )}

      {/* NO SEARCH RESULTS */}
      {!loading && !error && scans.length > 0 && filteredScans.length === 0 && (
        <motion.div variants={item} className="card text-center" style={{ padding: '40px 20px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '16px' }}>
          <p style={{ color: '#52677A', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
            No screening records found matching "{searchTerm}".
          </p>
        </motion.div>
      )}

      {/* SCREENING RECORDS LIST (Clean white cards, light-blue borders, navy text, teal accents) */}
      {!loading && !error && filteredScans.length > 0 && (
        <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredScans.map((scan) => {
            const dateObj = new Date(scan.createdAt);
            const dotColor = getStatusDotColor(scan.confidence);
            const hasConfidence = scan.confidence !== null && scan.confidence !== undefined && !isNaN(Number(scan.confidence));
            const reportId = scan._id || scan.scanId;

            return (
              <motion.div
                key={reportId}
                variants={item}
                className="card screening-history-item"
                style={{
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.72))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.65))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Left side: Status dot, Condition name, Date, Scan ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 320px' }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: dotColor,
                      flexShrink: 0,
                      boxShadow: `0 0 0 3px ${dotColor}25`
                    }} 
                  />
                  <div>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.15rem', 
                      fontWeight: 800, 
                      color: '#17324D', 
                      textTransform: 'capitalize',
                      letterSpacing: '-0.2px'
                    }}>
                      {scan.condition ? scan.condition.replace(/_/g, ' ') : 'Unrecognized Condition'}
                    </h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: '#52677A', fontSize: '0.85rem', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#718496" />
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {scan.scanId && (
                        <span>
                          Scan ID: <strong style={{ color: '#17324D' }}>{scan.scanId}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Right side: Confidence Badge & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {hasConfidence && (
                    <div 
                      style={{ 
                        background: '#F8FAFC', 
                        padding: '6px 14px', 
                        borderRadius: '999px', 
                        fontSize: '0.85rem', 
                        fontWeight: 800, 
                        color: '#17324D', 
                        border: '1px solid #BFD4E5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor }}></span>
                      <span>{Number(scan.confidence).toFixed(1)}% Confidence</span>
                    </div>
                  )}

                  {/* Open Record / View Report and Precautions */}
                  <button
                    onClick={() => navigate(`/dashboard/patient/reports/${reportId}`)}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      background: '#1677FF',
                      color: '#FFFFFF',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(22, 119, 255, 0.2)'
                    }}
                  >
                    <span>View Report</span>
                    <ArrowRight size={15} />
                  </button>

                  {/* Optional Consult Doctor link */}
                  <Link
                    to={`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(scan.condition || '')}`}
                    state={{ predictionResult: scan }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      background: '#FFFFFF',
                      color: '#00A6A6',
                      border: '1px solid #BFD4E5'
                    }}
                  >
                    <Stethoscope size={15} />
                    <span>Consult Dentist</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PatientScreeningHistory;
