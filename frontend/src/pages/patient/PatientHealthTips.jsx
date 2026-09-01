import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Info, ShieldCheck, Activity, Coffee, Smile, AlertTriangle } from 'lucide-react';
import '../Dashboard.css';

const PatientHealthTips = () => {
  const [latestScan, setLatestScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestScan();
  }, []);

  const fetchLatestScan = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return setLoading(false);
      
      const user = JSON.parse(userStr);
      const response = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLatestScan(sorted[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching scan history for tips:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConditionSpecificTips = (condition) => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('gingivitis')) {
      return {
        title: 'Gingivitis Care',
        tips: [
          'Brush twice daily with a soft-bristled brush to gently clean gums.',
          'Floss daily to remove plaque below the gumline.',
          'Use an antibacterial mouthwash to reduce inflammation.',
          'Schedule a professional dental cleaning as soon as possible.'
        ],
        icon: <AlertTriangle size={32} className="text-warning" />
      };
    }
    if (lowerCondition.includes('caries') || lowerCondition.includes('cavities')) {
      return {
        title: 'Cavity Management',
        tips: [
          'Reduce intake of sugary snacks and drinks.',
          'Use a fluoride toothpaste to strengthen tooth enamel.',
          'Rinse your mouth with water after eating acidic foods.',
          'Visit a dentist promptly for a filling to prevent further decay.'
        ],
        icon: <Activity size={32} className="text-danger" />
      };
    }
    if (lowerCondition.includes('hypodontia')) {
      return {
        title: 'Hypodontia Care',
        tips: [
          'Maintain excellent hygiene for existing teeth.',
          'Avoid chewing excessively hard foods in areas with missing teeth.',
          'Consult an orthodontist or prosthodontist about implants or braces.',
          'Schedule regular X-rays to monitor jawbone health.'
        ],
        icon: <Info size={32} className="text-primary" />
      };
    }
    // Default / Healthy
    return {
      title: 'Preventive Care',
      tips: [
        'Keep up the great work! Brush twice and floss daily.',
        'Use fluoride toothpaste and replace your toothbrush every 3-4 months.',
        'Drink plenty of water to wash away food particles.',
        'Continue regular 6-month dental checkups.'
      ],
      icon: <ShieldCheck size={32} className="text-success" />
    };
  };

  const specificTips = latestScan ? getConditionSpecificTips(latestScan.condition) : null;

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-content"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="flex-between mb-6">
        <div>
          <h2>Health Tips</h2>
          <p className="text-muted">Personalized dental care recommendations</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary)" />
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-left-col" style={{ width: '100%' }}>
            
            {/* Condition Specific Section */}
            {latestScan ? (
              <motion.div variants={item} className="card mb-6" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  {specificTips.icon}
                  <div>
                    <h3 style={{ margin: 0 }}>{specificTips.title}</h3>
                    <p className="text-muted text-sm">Based on your latest scan: <strong style={{color: 'var(--primary)'}}>{latestScan.condition.replace('_', ' ')}</strong></p>
                  </div>
                </div>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  {specificTips.tips.map((tip, idx) => (
                    <li key={idx} className="text-muted">{tip}</li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div variants={item} className="card text-center mb-6" style={{ padding: '40px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <HeartPulse size={64} className="text-muted" opacity={0.5} />
                </div>
                <h3 className="mb-2">No Recent AI Predictions</h3>
                <p className="text-muted">Upload an image for a scan to receive personalized condition-specific tips.</p>
              </motion.div>
            )}

            {/* General Tips Section */}
            <h3 className="mb-4 mt-6">General Dental Health Guidelines</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <motion.div variants={item} className="card glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Smile className="text-primary" />
                  <h4 style={{ margin: 0 }}>Brushing & Flossing</h4>
                </div>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>Brush for at least 2 minutes, twice a day.</li>
                  <li>Use a soft-bristled toothbrush to protect your gums.</li>
                  <li>Floss at least once daily to remove hidden plaque.</li>
                  <li>Don't brush too hard; gentle circular motions are best.</li>
                </ul>
              </motion.div>

              <motion.div variants={item} className="card glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Coffee className="text-warning" />
                  <h4 style={{ margin: 0 }}>Diet & Nutrition</h4>
                </div>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>Limit sugary and acidic foods and drinks.</li>
                  <li>Drink plenty of water, especially after meals.</li>
                  <li>Eat crunchy fruits and vegetables to stimulate saliva.</li>
                  <li>Avoid snacking constantly to give your teeth a break.</li>
                </ul>
              </motion.div>
              
              <motion.div variants={item} className="card glass-card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Info className="text-secondary" />
                  <h4 style={{ margin: 0 }}>When to Visit a Dentist</h4>
                </div>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <li>Schedule regular check-ups every 6 months.</li>
                  <li>Visit immediately if you experience persistent tooth pain.</li>
                  <li>See a professional if your gums bleed frequently or are swollen.</li>
                  <li>Consult a dentist for any sudden sensitivity to hot or cold.</li>
                </ul>
              </motion.div>
            </div>
            
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PatientHealthTips;
