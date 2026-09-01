import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Star, Award, ChevronRight, BriefcaseMedical } from 'lucide-react';
import '../Dashboard.css';

const sampleDoctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    qualifications: "BDS, MDS",
    specialization: "General & Cosmetic Dentist",
    experience: "12 Years Experience",
    clinic: "SmileCare Dental Clinic",
    location: "Bengaluru, KA",
    fee: 500,
    rating: 4.8,
    reviews: 124,
    status: "Available Today"
  },
  {
    id: 2,
    name: "Dr. Rahul Nair",
    qualifications: "BDS, MDS",
    specialization: "Endodontist",
    experience: "10 Years Experience",
    clinic: "DentalCare Advanced Clinic",
    location: "Kochi, KL",
    fee: 700,
    rating: 4.9,
    reviews: 89,
    status: "Available Tomorrow"
  },
  {
    id: 3,
    name: "Dr. Priya Menon",
    qualifications: "BDS",
    specialization: "Orthodontist",
    experience: "9 Years Experience",
    clinic: "Perfect Smile Dental Centre",
    location: "Mangaluru, KA",
    fee: 600,
    rating: 4.7,
    reviews: 210,
    status: "Available Today"
  },
  {
    id: 4,
    name: "Dr. Arjun Patel",
    qualifications: "MDS - Oral Surgery",
    specialization: "Oral & Maxillofacial Surgeon",
    experience: "14 Years Experience",
    clinic: "City Dental Hospital",
    location: "Mumbai, MH",
    fee: 900,
    rating: 4.9,
    reviews: 312,
    status: "Available Next Week"
  }
];

const RecommendedDoctors = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCondition = searchParams.get('condition') || '';
  const predictionResult = location.state?.predictionResult;

  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('All Specializations');
  const [feeFilter, setFeeFilter] = useState('Any Fee');

  useEffect(() => {
    if (initialCondition) {
      const normalized = initialCondition.toLowerCase();
      if (normalized.includes('hypodontia')) setSpecializationFilter('Orthodontist');
      else if (normalized.includes('gingivitis')) setSpecializationFilter('General Dentist');
      else if (normalized.includes('caries')) setSpecializationFilter('Endodontist');
      else if (normalized.includes('calculus')) setSpecializationFilter('General Dentist');
      else if (normalized.includes('ulcer')) setSpecializationFilter('Oral Surgeon');
      else if (normalized.includes('discoloration')) setSpecializationFilter('General Dentist');
    }
  }, [initialCondition]);

  const filteredDoctors = sampleDoctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesSpec = true;
    if (specializationFilter !== 'All Specializations') {
      // 'Oral Surgeon' should match 'Oral & Maxillofacial Surgeon'
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
      {/* Header */}
      <div className="dashboard-header mb-6">
        <h2>Recommended Dentists</h2>
        <p>Based on your dental analysis, connect with a qualified dental professional for further consultation.</p>
      </div>

      {/* Filters/Search */}
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

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="doctors-grid">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="card doctor-card">
              <div className="doctor-card-header">
                <div className="doctor-avatar bg-blue-light text-primary">
                  {doc.name.split(' ').map(n => n[0]).join('').replace('.', '').substring(0, 2)}
                </div>
                <div className="doctor-info-basic">
                  <h3 className="doctor-name">{doc.name}</h3>
                  <span className="text-sm text-muted">{doc.qualifications}</span>
                  <span className="badge bg-blue-light text-blue mt-1 inline-block">{doc.specialization}</span>
                </div>
              </div>

              <div className="doctor-card-body">
                <div className="detail-row">
                  <BriefcaseMedical size={16} className="text-muted" />
                  <span>{doc.experience} &bull; {doc.clinic}</span>
                </div>
                <div className="detail-row">
                  <MapPin size={16} className="text-muted" />
                  <span>{doc.location}</span>
                </div>
                <div className="detail-row">
                  <Star size={16} className="text-warning fill-warning" />
                  <span>{doc.rating} ({doc.reviews} Reviews)</span>
                </div>
                <div className="detail-row fee-row">
                  <span className="text-muted">Consultation Fee</span>
                  <span className="font-semibold text-primary">₹{doc.fee}</span>
                </div>
              </div>

              <div className="doctor-card-footer">
                <span className="status-indicator">
                  <div className={`status-dot ${doc.status.includes('Today') ? 'bg-success' : 'bg-warning'}`}></div>
                  <span className="text-sm">{doc.status}</span>
                </span>
                <div className="action-buttons">
                  <Link to={`/dashboard/patient/doctor/${doc.id}`} className="btn btn-outline btn-sm">
                    View Profile
                  </Link>
                  <Link to={`/dashboard/patient/consult-request/${doc.id}`} state={{ predictionResult }} className="btn btn-primary btn-sm">
                    Consult
                  </Link>
                </div>
              </div>
            </div>
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
