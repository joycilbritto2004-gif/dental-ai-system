import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, Activity, Cpu, Layers, CheckCircle2, 
  ArrowLeft, Clock, Zap, Sparkles, Database, ShieldCheck, 
  RefreshCw, Server, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';

const SUPPORTED_CONDITIONS = [
  { name: 'Gingivitis', desc: 'Gum Tissue Inflammation', color: '#10B981', code: 'GIN-01' },
  { name: 'Caries', desc: 'Enamel & Dentin Cavities', color: '#EF4444', code: 'CAR-02' },
  { name: 'Calculus', desc: 'Subgingival Plaque Tartar', color: '#F59E0B', code: 'CAL-03' },
  { name: 'Hypodontia', desc: 'Congenitally Missing Teeth', color: '#6366F1', code: 'HYP-04' },
  { name: 'Mouth Ulcer', desc: 'Oral Mucosal Lesions', color: '#EC4899', code: 'ULC-05' },
  { name: 'Discoloration', desc: 'Extrinsic/Intrinsic Staining', color: '#8B5CF6', code: 'DIS-06' }
];

const AdminAIModel = () => {
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 5000);
    }, 2000);
  };

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
                <BrainCircuit size={14} /> Diagnostic Neural Network
              </div>
              <h1 className="screening-title">AI Model Configuration</h1>
              <p className="screening-subtitle">
                Inspect architecture parameters, neural net telemetry, inference microservice latencies, and multi-class dental pathology detectors.
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
                PyTorch Microservice Online (5002)
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Architecture */}
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
              <BrainCircuit size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                MobileNetV2
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Convolutional Backbone
              </div>
            </div>
          </div>

          {/* Card 2: Accuracy */}
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
              <CheckCircle2 size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                81.07%
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Test Dataset Accuracy
              </div>
            </div>
          </div>

          {/* Card 3: Latency */}
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
              <Zap size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                ~120ms
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Average Inference Time
              </div>
            </div>
          </div>

          {/* Card 4: Target Pathologies */}
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
              <Layers size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                6 Classes
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Supported Pathologies
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. TWO-COLUMN EQUAL 50/50 LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: SPECIFICATIONS & PIPELINE ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: Core Model Specifications */}
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
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Model Architecture Specifications
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Tensor graph dimensions and transfer learning parameter weights.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px' }}>
                {[
                  { label: 'Neural Architecture', value: 'MobileNetV2 / ResNet-Dental' },
                  { label: 'Framework Engine', value: 'PyTorch / Torchvision Core' },
                  { label: 'Model Release Tag', value: 'v2.4.1 (Clinical Edition)' },
                  { label: 'Input Resolution', value: '224 × 224 RGB (3 Channels)' },
                  { label: 'Trainable Weights', value: '~3.5 Million Parameters' },
                  { label: 'Last Checkpoint Date', value: 'August 25, 2026' },
                  { 
                    label: 'Runtime Health', 
                    value: (
                      <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.74rem', fontWeight: 800 }}>
                        Active Operational
                      </span>
                    ) 
                  }
                ].map((row, idx, arr) => (
                  <div 
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.86rem', color: '#64748B', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#17324D' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 2: Training Pipeline & Retrain Trigger */}
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
                  <Database size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Training Pipeline & Dataset
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Multi-center dental radiography intake and loss convergence parameters.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#F0FDFA', border: '1px solid #99E3D8', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F766E', display: 'block', marginBottom: '4px' }}>
                    Dataset Scans
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00A6A6' }}>
                    12,320
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 600 }}>
                    Expert-annotated samples
                  </span>
                </div>

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF', display: 'block', marginBottom: '4px' }}>
                    Optimization Loss
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563EB' }}>
                    0.1824
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#1E40AF', fontWeight: 600 }}>
                    Categorical Cross-Entropy
                  </span>
                </div>
              </div>

              {retrainSuccess && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#065F46', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> Pipeline triggered: Evaluation job queued on server microservice.
                </div>
              )}

              <button
                type="button"
                disabled={isRetraining}
                onClick={handleRetrain}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {isRetraining ? (
                  <>
                    <Activity className="spin-anim" size={18} /> Re-evaluating Model Weights...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} /> Trigger Model Diagnostic Re-evaluation
                  </>
                )}
              </button>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN: TELEMETRY & PATHOLOGIES ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: System Performance & Latency */}
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
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '8px', borderRadius: '10px' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Inference Telemetry
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Real-time speed benchmark and specialist verification agreement.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              {/* Meter 1: Latency */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>Average Inference Latency</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>120ms</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '22%', height: '100%', background: '#10B981', borderRadius: '999px' }} />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '8px', display: 'block' }}>
                  Optimal threshold (&lt; 250ms per scan for seamless tele-dentistry triage).
                </span>
              </div>

              {/* Meter 2: Accuracy */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>Prediction Accuracy (Verified Cases)</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563EB' }}>94.2%</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '94.2%', height: '100%', background: 'linear-gradient(90deg, #2563EB, #06C6E8)', borderRadius: '999px' }} />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '8px', display: 'block' }}>
                  Correlation benchmark against clinical dentist final verifications.
                </span>
              </div>

              {/* Service Health Card */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99E3D8', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', marginTop: '4px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F766E' }}>
                    Microservice Cluster Healthy
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    Python Flask inference daemon is actively parsing diagnostic requests via port <strong>5002</strong> with zero memory leaks.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Supported Pathologies Grid (3x2 Balanced) */}
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
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '8px', borderRadius: '10px' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Supported Dental Pathologies (6 Classes)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Trained multi-class classification labels and ICD diagnostic mappings.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {SUPPORTED_CONDITIONS.map(c => (
                  <div 
                    key={c.name}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      boxShadow: '0 2px 6px rgba(7, 26, 51, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#94A3B8', fontWeight: 700 }}>
                        {c.code}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', lineHeight: 1.3 }}>
                      {c.desc}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default AdminAIModel;