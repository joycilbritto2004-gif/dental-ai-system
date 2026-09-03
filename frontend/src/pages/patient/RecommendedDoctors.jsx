import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Star, ChevronRight, BriefcaseMedical } from 'lucide-react';
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
        <h2>Recommended Dentists</h2>
        <p>Based on your dental analysis, connect with a qualified dental professional for further consultation.</p>
      </div>

      <div className="card mb-6">
        <div className="flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper flex-1">
            <Search size={20} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, specialty, or location..." 
              style={{ paddingLeft: '2.8rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              className="form-input" 
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
        <div className="text-center py-10">Loading doctors...</div>
      ) : filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map(doc => (
            <motion.div key={doc._id} className="card doctor-card" whileHover={{ y: -5 }}>
              <div className="doctor-card-header mb-4">
                <div className="doctor-avatar bg-blue-light text-primary">
                  {doc.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 className="doctor-name font-bold text-lg">{doc.name}</h3>
                  <div className="flex-align-center gap-1 text-primary text-sm font-medium">
                    {doc.specialization}
                  </div>
                </div>
              </div>

              <div className="flex-align-center gap-1 font-semibold text-secondary mb-3">
                <Star size={18} fill="currentColor" /> {4.8} ({Math.floor(Math.random() * 200) + 50} reviews)
              </div>

              <div className="flex-align-center gap-2 text-muted mb-4 text-sm border-b pb-4">
                <BriefcaseMedical size={16} /> {doc.qualifications || 'BDS, MDS'} &bull; {doc.experience || '10+ Years Exp.'}
              </div>

              <div className="flex-between mb-4">
                <div>
                  <p className="text-xs text-muted mb-1">Clinic</p>
                  <p className="font-semibold text-sm">{doc.clinic || 'DentaAI Partner Clinic'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted mb-1">Consultation Fee</p>
                  <p className="font-bold text-primary">₹{doc.fee || 500}</p>
                </div>
              </div>
              
              <Link to={`/dashboard/patient/doctor/${doc._id}`} state={{ predictionResult }} className="btn btn-primary w-full flex-align-center justify-center gap-2">
                View Profile <ChevronRight size={18} />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card glass-card text-center" style={{ padding: '3rem 2rem' }}>
          <div className="text-muted mb-4" style={{ display: 'flex', justifyContent: 'center' }}>
            <Search size={48} opacity={0.5} />
          </div>
          <h3 className="text-primary mb-2">No Doctors Found</h3>
          <p className="text-muted mb-4">We couldn't find any doctors matching your current filters.</p>
          <button 
            className="btn btn-outline"
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
