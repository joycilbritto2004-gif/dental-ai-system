import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Star, 
  ChevronRight, 
  BriefcaseMedical, 
  ShieldCheck, 
  Clock, 
  Video, 
  MapPin, 
  Building2, 
  GraduationCap, 
  Sparkles, 
  X, 
  Stethoscope, 
  Calendar, 
  Eye, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

/**
 * RecommendedDoctors
 * Vetted Dental Specialists Directory & Consultation Marketplace
 * - Constrained, centered container (max-width: 1350px)
 * - Solid high-contrast clinical cards (#FFFFFF)
 * - Dynamic specialty filter chips & fee filters
 * - Direct "Book Consult" & "View Profile" actions
 * - Seamless integration with active pre-screening AI findings
 */
const RecommendedDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All Specializations');
  const [feeFilter, setFeeFilter] = useState('Any Fee');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const location = useLocation();

  // Preserve active scan across page refreshes
  const [activeScan] = useState(() => {
    if (location.state?.predictionResult) {
      sessionStorage.setItem('dentaai_active_scan', JSON.stringify(location.state.predictionResult));
      return location.state.predictionResult;
    }
    const saved = sessionStorage.getItem('dentaai_active_scan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved active scan', e);
      }
    }
    return null;
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Compute unique specializations with counts
  const specializationCounts = useMemo(() => {
    const counts = {};
    doctors.forEach(doc => {
      const spec = doc.specialization?.trim() || 'General Dentistry';
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return counts;
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const term = searchTerm.toLowerCase().trim();
      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      const loc = (doc.location || '').toLowerCase();
      const clinic = (doc.clinic || '').toLowerCase();

      const matchesSearch = !term || name.includes(term) || spec.includes(term) || loc.includes(term) || clinic.includes(term);
      
      let matchesSpec = true;
      if (specializationFilter !== 'All Specializations') {
        matchesSpec = spec.includes(specializationFilter.toLowerCase());
      }

      let matchesFee = true;
      const fee = Number(doc.fee) || 500;
      if (feeFilter === 'Under ₹500') matchesFee = fee < 500;
      else if (feeFilter === '₹500 - ₹1000') matchesFee = fee >= 500 && fee <= 1000;
      else if (feeFilter === 'Above ₹1000') matchesFee = fee > 1000;

      return matchesSearch && matchesSpec && matchesFee;
    });
  }, [doctors, searchTerm, specializationFilter, feeFilter]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '40px' }}
    >
      <div className="screening-history-wrapper">

        {/* 1. HERO CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card">
          <div className="screening-header-stripe"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="screening-badge">
                <Stethoscope size={13} color="#00A6A6" /> Certified Dental Practitioners
              </span>
              <h2 className="screening-title">Find a Dentist</h2>
              <p className="screening-subtitle">
                Connect with vetted dental surgeons, periodontists, and implantologists for clinical evaluations and online consultations.
              </p>
            </div>

            {/* Attached AI scan notification */}
            {activeScan && (
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 18px', 
                  background: '#F0FDFA', 
                  border: '1px solid #99F6E4', 
                  borderRadius: '12px', 
                  fontSize: '0.86rem', 
                  color: '#0F766E',
                  fontWeight: 600
                }}
              >
                <Sparkles size={16} color="#00A6A6" />
                <span>
                  Attached Finding: <strong style={{ color: '#17324D' }}>{activeScan.condition?.replace(/_/g, ' ')}</strong> ({Number(activeScan.confidence || 94).toFixed(1)}% AI Score)
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 2. STATS & TRUST OVERVIEW */}
        <motion.div variants={item} className="screening-stats-grid">
          
          <div className="screening-stat-card" style={{ borderTop: '3px solid #1677FF' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#EBF5FF', color: '#1677FF' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="screening-stat-value">{doctors.length}</div>
                <div className="screening-stat-label">Verified Specialists</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1677FF', background: '#EBF5FF', padding: '3px 9px', borderRadius: '999px' }}>
              Practicing
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #10B981' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#DCFCE7', color: '#10B981' }}>
                <Clock size={24} />
              </div>
              <div>
                <div className="screening-stat-value">&lt; 15 Mins</div>
                <div className="screening-stat-label">Average Response</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '3px 9px', borderRadius: '999px' }}>
              Fast Care
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #00A6A6' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#E6FFFA', color: '#00A6A6' }}>
                <Video size={24} />
              </div>
              <div>
                <div className="screening-stat-value" style={{ fontSize: '1.25rem', marginTop: '2px' }}>Video & Chat</div>
                <div className="screening-stat-label">Virtual Prescriptions</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00A6A6', background: '#E6FFFA', padding: '3px 9px', borderRadius: '999px' }}>
              Telehealth
            </span>
          </div>

        </motion.div>

        {/* 3. INTERACTIVE SEARCH, FILTERS & SPECIALTY CHIPS */}
        <motion.div variants={item} className="screening-controls-card">
          
          <div className="screening-controls-top">
            
            {/* Search Input */}
            <div className="screening-search-box" style={{ flex: '2 1 320px' }}>
              <Search size={18} color="#00A6A6" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="screening-search-input" 
                placeholder="Search doctors by name, specialty, clinic, or location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Specialization Filter Dropdown */}
            <div style={{ flex: '1 1 200px' }}>
              <select 
                className="screening-sort-select"
                style={{ width: '100%', height: '48px', paddingLeft: '14px' }}
                value={specializationFilter} 
                onChange={(e) => setSpecializationFilter(e.target.value)}
              >
                <option value="All Specializations">All Specializations</option>
                <option value="Periodontist">Periodontist & Implantologist</option>
                <option value="Orthodontist">Orthodontist</option>
                <option value="Endodontist">Endodontist</option>
                <option value="Oral Surgeon">Oral Surgeon</option>
                <option value="General Dentist">General Dentist</option>
              </select>
            </div>

            {/* Fee Filter Dropdown */}
            <div style={{ flex: '1 1 160px' }}>
              <select 
                className="screening-sort-select"
                style={{ width: '100%', height: '48px', paddingLeft: '14px' }}
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
              >
                <option value="Any Fee">Any Fee</option>
                <option value="Under ₹500">Under ₹500</option>
                <option value="₹500 - ₹1000">₹500 - ₹1000</option>
                <option value="Above ₹1000">Above ₹1000</option>
              </select>
            </div>

          </div>

          {/* Quick Specialty Chips Bar */}
          <div className="screening-chips-bar">
            <button 
              type="button"
              onClick={() => setSpecializationFilter('All Specializations')}
              className={`screening-chip ${specializationFilter === 'All Specializations' ? 'active' : ''}`}
            >
              All Specialists ({doctors.length})
            </button>

            {Object.entries(specializationCounts).map(([specName, count]) => (
              <button 
                key={specName}
                type="button"
                onClick={() => setSpecializationFilter(specName)}
                className={`screening-chip ${specializationFilter === specName ? 'active' : ''}`}
              >
                {specName} ({count})
              </button>
            ))}
          </div>

          {/* Live Count & Reset Bar */}
          <div className="screening-count-bar">
            <span>
              Showing <strong>{filteredDoctors.length}</strong> of <strong>{doctors.length}</strong> certified dental specialists
            </span>
            {(searchTerm || specializationFilter !== 'All Specializations' || feeFilter !== 'Any Fee') && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchTerm('');
                  setSpecializationFilter('All Specializations');
                  setFeeFilter('Any Fee');
                }}
                style={{ background: 'transparent', border: 'none', color: '#00A6A6', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Reset Filters &times;
              </button>
            )}
          </div>

        </motion.div>

        {/* 4. LOADING STATE */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #BFD4E5' }}>
            <div className="spin-anim" style={{ color: '#00A6A6', marginBottom: '14px' }}>
              <Stethoscope size={42} />
            </div>
            <p style={{ color: '#17324D', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              Connecting to certified dental specialists network...
            </p>
          </div>
        )}

        {/* 5. DOCTORS GRID */}
        {!isLoading && filteredDoctors.length > 0 && (
          <motion.div variants={stagger} className="doctors-grid">
            {filteredDoctors.map((doc) => {
              const docInitials = (doc.name || 'Doctor')
                .replace(/^(Dr\.|Dr)\s*/i, '')
                .trim()
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || 'DR';

              return (
                <motion.div 
                  key={doc._id} 
                  variants={item}
                  className="doctor-card"
                >
                  {/* Doctor Header */}
                  <div className="doctor-card-header">
                    <div className="doctor-avatar">
                      {docInitials}
                      <span className="doctor-avatar-online-dot" title="Available for Virtual Consultation"></span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, color: '#17324D', fontSize: '1.2rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.name}
                        </h3>
                        <CheckCircle2 size={16} color="#00A6A6" style={{ flexShrink: 0 }} />
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F0FDFA', color: '#00A6A6', padding: '3px 9px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #CCFBF1' }}>
                        <BriefcaseMedical size={11} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.specialization || 'General Dentistry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Card Body */}
                  <div className="doctor-card-body">
                    
                    {/* Rating & Reviews */}
                    <div className="detail-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={15} fill="#F59E0B" color="#F59E0B" /> 
                        <strong style={{ color: '#17324D', fontSize: '0.92rem' }}>4.9</strong>
                      </div>
                      <span>•</span>
                      <span style={{ color: '#52677A', fontSize: '0.86rem', fontWeight: 600 }}>124 verified reviews</span>
                    </div>

                    {/* Qualifications & Experience */}
                    <div className="detail-row">
                      <GraduationCap size={15} color="#1677FF" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 600 }}>
                        {doc.qualifications || 'BDS, MDS'} &bull; {doc.experience || '10+ Years Exp.'}
                      </span>
                    </div>

                    {/* Clinic Name */}
                    {doc.clinic && (
                      <div className="detail-row">
                        <Building2 size={15} color="#00A6A6" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 600 }}>
                          {doc.clinic}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {doc.location && (
                      <div className="detail-row">
                        <MapPin size={15} color="#64748B" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.86rem', color: '#64748B' }}>
                          {doc.location}
                        </span>
                      </div>
                    )}

                    {/* Consultation Fee & Time */}
                    <div className="fee-row">
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
                          Consultation Fee
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ color: '#17324D', fontWeight: 800, fontSize: '1.35rem' }}>
                            ₹{doc.fee || 500}
                          </span>
                          <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>/ session</span>
                        </div>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#ECFDF5', color: '#10B981', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                        <Clock size={12} />
                        <span>Available Today</span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="doctor-card-footer">
                    <Link 
                      to={`/dashboard/patient/doctor/${doc._id}`} 
                      state={{ predictionResult: activeScan }} 
                      className="doctor-view-profile-btn"
                    >
                      <Eye size={14} />
                      <span>Profile</span>
                    </Link>

                    <Link 
                      to={`/dashboard/patient/consult-request/${doc._id}`} 
                      state={{ predictionResult: activeScan }} 
                      className="doctor-book-consult-btn"
                    >
                      <Calendar size={14} />
                      <span>Book Consult</span>
                    </Link>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 6. NO DOCTORS MATCH */}
        {!isLoading && filteredDoctors.length === 0 && (
          <motion.div variants={item} className="card text-center" style={{ padding: '60px 20px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#00A6A6', border: '1px solid #99F6E4' }}>
              <Search size={28} />
            </div>
            <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.35rem', margin: '0 0 6px 0' }}>No Specialists Match Your Filters</h3>
            <p style={{ color: '#52677A', fontSize: '0.94rem', maxWidth: '440px', margin: '0 auto 20px' }}>
              We couldn't find any dental specialists matching your search "{searchTerm}" or selected fee range.
            </p>
            <button 
              className="btn btn-outline"
              style={{ color: '#00A6A6', borderColor: '#00A6A6', fontWeight: 800, padding: '10px 24px', borderRadius: '12px' }}
              onClick={() => {
                setSearchTerm('');
                setSpecializationFilter('All Specializations');
                setFeeFilter('Any Fee');
              }}
            >
              Clear All Filters
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default RecommendedDoctors;
