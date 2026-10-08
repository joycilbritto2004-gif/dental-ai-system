import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Star, ChevronRight, BriefcaseMedical } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const RecommendedDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All Specializations');
  const [feeFilter, setFeeFilter] = useState('Any Fee');
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const location = useLocation();
  const predictionResult = location.state?.predictionResult;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/doctors');
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
      <div className="dashboard-header mb-6">
        <h2 style={{ color: '#172033', fontWeight: '800' }}>Recommended Dentists</h2>
        <p style={{ color: '#64748B', fontWeight: '500' }}>Based on your dental analysis, connect with a qualified dental professional for further consultation.</p>
      </div>

      <div className="card mb-6" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="filters-row">
          <div className="search-input-wrapper" style={{ position: 'relative', flex: '2 1 300px' }}>
            <Search size={20} style={{ color: '#64748b', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, specialty, or location..." 
              style={{ paddingLeft: '2.8rem', width: '100%', height: '48px', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-input" 
            style={{ height: '48px', flex: '1 1 200px', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}
            value={specializationFilter} 
            onChange={(e) => setSpecializationFilter(e.target.value)}
          >
            <option value="All Specializations">All Specializations</option>
            <option value="General Dentist">General Dentist</option>
            <option value="Endodontist">Endodontist</option>
            <option value="Orthodontist">Orthodontist</option>
            <option value="Oral Surgeon">Oral Surgeon</option>
          </select>
          <select 
            className="form-input"
            style={{ height: '48px', flex: '1 1 150px', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }}
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
          >
            <option value="Any Fee">Any Fee</option>
            <option value="Under ₹500">Under ₹500</option>
            <option value="₹500 - ₹1000">₹500 - ₹1000</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading doctors...</div>
      ) : filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map(doc => (
            <motion.div key={doc._id} className="card doctor-card" whileHover={{ y: -5 }}>
              <div className="doctor-card-header">
                <div className="doctor-avatar">
                  {doc.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="doctor-info-basic">
                  <h3 style={{ color: '#0f172a', fontWeight: '800' }}>{doc.name}</h3>
                  <div className="flex-align-center gap-1" style={{ color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>
                    {doc.specialization}
                  </div>
                </div>
              </div>

              <div className="doctor-card-body">
                <div className="detail-row" style={{ color: '#1e3a8a', fontWeight: '600' }}>
                  <Star size={18} fill="currentColor" /> {4.8} (124 reviews)
                </div>

                <div className="detail-row" style={{ color: '#475569', fontWeight: '500' }}>
                  <BriefcaseMedical size={16} /> {doc.qualifications || 'BDS, MDS'} &bull; {doc.experience || '10+ Years Exp.'}
                </div>

                <div className="fee-row detail-row">
                  <div>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Clinic</p>
                    <p style={{ color: '#334155', fontWeight: '600', fontSize: '0.875rem' }}>{doc.clinic || 'DentaAI Partner Clinic'}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Consultation Fee</p>
                    <p style={{ color: '#0f172a', fontWeight: '700' }}>₹{doc.fee || 500}</p>
                  </div>
                </div>
              </div>
              
              <div className="doctor-card-footer mt-auto">
                <Link to={`/dashboard/patient/doctor/${doc._id}`} state={{ predictionResult }} className="btn btn-primary w-full flex-align-center justify-center gap-2">
                  View Profile <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card glass-card text-center" style={{ padding: '3rem 2rem', background: 'rgba(255, 255, 255, 0.95)' }}>
          <div style={{ color: '#64748b', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Search size={48} opacity={0.5} />
          </div>
          <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>No Doctors Found</h3>
          <p style={{ color: '#475569', marginBottom: '1rem' }}>We couldn't find any doctors matching your current filters.</p>
          <button 
            className="btn btn-outline"
            style={{ color: '#1e3a8a', borderColor: '#1e3a8a' }}
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


