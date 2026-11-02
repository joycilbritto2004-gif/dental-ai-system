import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Star, ChevronRight, BriefcaseMedical } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

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
          setDoctors(data);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesSpec = true;
    if (specializationFilter !== 'All Specializations') {
      if (specializationFilter === 'Oral Surgeon') {
        matchesSpec = doc.specialization.toLowerCase().includes('oral');
      } else {
        matchesSpec = doc.specialization.toLowerCase().includes(specializationFilter.toLowerCase());
      }
    }

    let matchesFee = true;
    if (feeFilter === 'Under ₹500') matchesFee = doc.fee < 500;
    else if (feeFilter === '₹500 - ₹1000') matchesFee = doc.fee >= 500 && doc.fee <= 1000;

    return matchesSearch && matchesSpec && matchesFee;
  });

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="mb-6 page-header-card" style={{ padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-2" style={{ color: 'var(--text-primary, #17324D)', letterSpacing: '-0.5px', fontSize: '2.2rem', lineHeight: '1.2', margin: 0 }}>Find a Dentist</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-secondary, #475569)', fontSize: '1.05rem' }}>Based on your dental analysis, connect with a qualified dental professional for further consultation.</p>
        </div>
      </div>

      <div className="card filters-card mb-6" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.75)', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 10, 25, 0.06)' }}>
        <div className="filters-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ position: 'relative', flex: '2 1 300px' }}>
            <Search size={20} style={{ color: '#00A6A6', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              className="form-input search-input" 
              placeholder="Search by name, specialty, or location..." 
              style={{ 
                paddingLeft: '2.8rem', 
                width: '100%', 
                height: '48px', 
                color: '#17324D', 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #BFD4E5',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <select 
              className="form-input filter-select" 
              style={{ 
                width: '100%',
                height: '48px', 
                color: '#17324D', 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #BFD4E5',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                paddingLeft: '16px',
                paddingRight: '40px'
              }}
              value={specializationFilter} 
              onChange={(e) => setSpecializationFilter(e.target.value)}
            >
              <option value="All Specializations">All Specializations</option>
              <option value="General Dentist">General Dentist</option>
              <option value="Endodontist">Endodontist</option>
              <option value="Orthodontist">Orthodontist</option>
              <option value="Oral Surgeon">Oral Surgeon</option>
            </select>
          </div>
          <div style={{ position: 'relative', flex: '1 1 150px' }}>
            <select 
              className="form-input filter-select"
              style={{ 
                width: '100%',
                height: '48px', 
                color: '#17324D', 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #BFD4E5',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                paddingLeft: '16px',
                paddingRight: '40px'
              }}
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
            >
              <option value="Any Fee">Any Fee</option>
              <option value="Under ₹500">Under ₹500</option>
              <option value="₹500 - ₹1000">₹500 - ₹1000</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10" style={{ color: '#FFFFFF', fontWeight: 600 }}>Loading doctors...</div>
      ) : filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map(doc => (
            <motion.div key={doc._id} className="card doctor-card" whileHover={{ y: -5 }}>
              <div className="doctor-card-header">
                <div className="doctor-avatar">
                  {doc.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="doctor-info-basic">
                  <h3 style={{ color: '#17324D', fontWeight: '800', fontSize: '1.25rem', margin: '0 0 4px 0' }}>{doc.name}</h3>
                  <div className="flex-align-center gap-1" style={{ color: '#00A6A6', fontSize: '0.9rem', fontWeight: '700' }}>
                    {doc.specialization}
                  </div>
                </div>
              </div>

              <div className="doctor-card-body">
                <div className="detail-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" /> 
                  <span style={{ color: '#17324D', fontWeight: '800', fontSize: '0.95rem' }}>4.8</span> 
                  <span style={{ color: '#52677A', fontWeight: '500', fontSize: '0.9rem' }}>(124 reviews)</span>
                </div>

                <div className="detail-row" style={{ color: '#52677A', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BriefcaseMedical size={17} color="#1677FF" style={{ flexShrink: 0 }} /> 
                  <span>{doc.qualifications || 'BDS, MDS'} &bull; {doc.experience || '10+ Years Exp.'}</span>
                </div>

                <div className="fee-row detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px dashed #BFD4E5' }}>
                  <div>
                    <p style={{ color: '#52677A', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Clinic</p>
                    <p style={{ color: '#17324D', fontWeight: '700', fontSize: '0.92rem', margin: 0 }}>{doc.clinic || 'DentaAI Partner Clinic'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#52677A', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Consultation Fee</p>
                    <p style={{ color: '#1677FF', fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>₹{doc.fee || 500}</p>
                  </div>
                </div>
              </div>
              
              <div className="doctor-card-footer mt-auto">
                <Link to={`/dashboard/patient/doctor/${doc._id}`} state={{ predictionResult: activeScan }} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', background: 'linear-gradient(135deg, #1677FF 0%, #00D2FF 100%)', color: '#FFFFFF', border: 'none', boxShadow: '0 4px 14px rgba(22, 119, 255, 0.25)', textDecoration: 'none' }}>
                  View Profile <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card glass-card text-center" style={{ padding: '3rem 2rem', background: 'rgba(255, 255, 255, 0.90)', border: '1px solid rgba(255, 255, 255, 0.75)', borderRadius: '24px' }}>
          <div style={{ color: '#00A6A6', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Search size={48} opacity={0.7} />
          </div>
          <h3 style={{ color: '#17324D', fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.4rem' }}>No Doctors Found</h3>
          <p style={{ color: '#52677A', fontWeight: '500', marginBottom: '1.5rem', fontSize: '1rem' }}>We couldn't find any doctors matching your current filters.</p>
          <button 
            className="btn btn-outline"
            style={{ color: '#17324D', borderColor: '#1677FF', fontWeight: '700', padding: '10px 24px', borderRadius: '12px' }}
            onClick={() => {
              setSearchTerm('');
              setSpecializationFilter('All Specializations');
              setFeeFilter('Any Fee');
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendedDoctors;


