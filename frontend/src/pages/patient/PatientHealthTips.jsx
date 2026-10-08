import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Info, ShieldCheck, Activity, Coffee, Smile, AlertTriangle, CheckCircle2 } from 'lucide-react';
import '../Dashboard.css';

const PatientHealthTips = () => {
  const [latestScan, setLatestScan] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchLatestScan();
  }, []);

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
        icon: <AlertTriangle size={32} className="text-warning" />,
        accentClass: 'warning'
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
        icon: <Activity size={32} className="text-danger" />,
        accentClass: 'danger'
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
        icon: <Info size={32} className="text-primary" />,
        accentClass: 'primary'
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
      icon: <ShieldCheck size={32} className="text-success" />,
      accentClass: 'success'
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
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* HEADER */}
      <motion.div variants={item} className="mb-8 page-header-card" style={{ padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>Health Tips</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Personalized dental care recommendations based on your AI scans.</p>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary)" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* CONDITION SPECIFIC SECTION (IF APPLICABLE) */}
          {latestScan ? (
            <motion.div variants={item} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: `rgba(var(--${specificTips.accentClass}-rgb, 0, 210, 255), 0.1)`, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {specificTips.icon}
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 800 }}>{specificTips.title}</h3>
                  <p className="text-muted text-sm font-medium m-0">
                    Targeted care plan based on your latest scan: <strong style={{ color: 'var(--text-primary)' }}>{latestScan.condition.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {specificTips.tips.map((tip, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={20} className={`text-${specificTips.accentClass}`} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span className="text-muted font-medium" style={{ lineHeight: '1.5' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div variants={item} className="card text-center mb-6" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-muted)' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
                  <HeartPulse size={48} className="text-secondary" />
                </div>
              </div>
              <h3 className="mb-3 font-extrabold" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>No Recent AI Predictions</h3>
              <p className="text-muted mb-8 font-medium" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                Upload an image for a scan to receive personalized condition-specific tips.
              </p>
            </motion.div>
          )}

          {/* GENERAL TIPS SECTION */}
          <div style={{ marginTop: '16px' }}>
            <h3 className="mb-6 font-extrabold flex-align-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>
              <ShieldCheck size={24} className="text-secondary" /> General Dental Health Guidelines
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <motion.div variants={item} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smile className="text-primary" size={28} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>Brushing & Flossing</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Brush for at least 2 minutes, twice a day.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Use a soft-bristled toothbrush to protect your gums.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Floss at least once daily to remove hidden plaque.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Don't brush too hard; gentle circular motions are best.</span></div>
                </div>
              </motion.div>

              <motion.div variants={item} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coffee className="text-warning" size={28} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>Diet & Nutrition</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Limit sugary and acidic foods and drinks.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Drink plenty of water, especially after meals.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Eat crunchy fruits and vegetables to stimulate saliva.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Avoid snacking constantly to give your teeth a break.</span></div>
                </div>
              </motion.div>
              
              <motion.div variants={item} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Info className="text-danger" size={28} />
                  </div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>When to Visit a Dentist</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Schedule regular check-ups every 6 months.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Visit immediately if you experience persistent tooth pain.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">See a professional if your gums bleed frequently or are swollen.</span></div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', marginTop: '8px', flexShrink: 0 }}></div><span className="text-muted font-medium">Consult a dentist for any sudden sensitivity to hot or cold.</span></div>
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PatientHealthTips;


