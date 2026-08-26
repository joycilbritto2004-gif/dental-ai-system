import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Upload, Users, ScanLine, CheckCircle2, AlertCircle, AlertTriangle, BrainCircuit, UserCheck, BadgeCheck, Sparkles } from 'lucide-react';
import './Home.css';

const Home = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="home-page">
      {/* 3D Holographic Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-bg"></div>
        <div className="container hero-container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="hero-badge">
              <Sparkles size={16} /> <span>Next-Gen Dental AI Platform</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="hero-title">
              Smarter Dental Care<br />
              <span className="text-gradient">Powered by AI</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="hero-subtitle">
              Experience the future of dentistry. DentaAI utilizes advanced deep learning to assist in the early detection of dental diseases with unparalleled accuracy.
            </motion.p>
            <motion.div variants={fadeUp} className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg pulse-glow">
                Start Free Scan
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg glass-btn">
                Doctor Login
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="ai-tooth-hologram">
              <motion.div 
                className="hologram-rings"
                animate={{ rotateX: 360, rotateY: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <div className="tooth-3d-model">
                <ScanLine size={80} className="text-secondary holographic-icon" />
                <motion.div 
                  className="laser-scan-line"
                  animate={{ y: ["-50px", "50px", "-50px"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              {/* Floating Data Nodes */}
              <motion.div 
                className="floating-node node-1 glass-panel"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Activity size={18} className="text-secondary" />
                <div className="node-text">
                  <span className="node-label">Accuracy</span>
                  <span className="node-value">94.2%</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="floating-node node-2 glass-panel"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <BrainCircuit size={18} className="text-accent" />
                <div className="node-text">
                  <span className="node-label">Model</span>
                  <span className="node-value">MobileNetV2</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Glassmorphic Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.div 
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <FeatureCard 
              icon={<ScanLine size={32} />} 
              title="AI-Powered Detection" 
              desc="Deep learning model trained on thousands of clinical dental scans." 
            />
            <FeatureCard 
              icon={<Activity size={32} />} 
              title="High Accuracy" 
              desc="MobileNetV2 provides industry-leading confidence scoring." 
            />
            <FeatureCard 
              icon={<ShieldCheck size={32} />} 
              title="Doctor Verification" 
              desc="Every AI prediction is reviewed by a licensed professional." 
            />
            <FeatureCard 
              icon={<Users size={32} />} 
              title="Health Management" 
              desc="Unified portal for tracking your long-term dental health." 
            />
          </motion.div>
        </div>
      </section>

      {/* Dark Futuristic Diseases Section */}
      <section className="diseases-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Detection Capabilities</h2>
            <p className="section-subtitle">Our neural network is explicitly trained to identify these critical conditions.</p>
          </div>
          <motion.div 
            className="diseases-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <DiseaseCard icon={<ShieldCheck size={28} />} title="Calculus" desc="Hardened dental plaque requiring professional removal." />
            <DiseaseCard icon={<ScanLine size={28} />} title="Caries" desc="Tooth decay or cavities caused by bacterial breakdown." />
            <DiseaseCard icon={<Activity size={28} />} title="Gingivitis" desc="Early stage gum disease causing inflammation and bleeding." />
            <DiseaseCard icon={<AlertTriangle size={28} />} title="Hypodontia" desc="Developmental absence of one or more teeth." />
            <DiseaseCard icon={<AlertCircle size={28} />} title="Mouth Ulcer" desc="Painful sores that appear in the mouth." />
            <DiseaseCard icon={<Sparkles size={28} />} title="Tooth Discoloration" desc="Staining or changes in the color of the teeth." />
          </motion.div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="workflow-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Intelligent Workflow</h2>
          </div>
          
          <div className="workflow-grid">
            <WorkflowCard step="01" icon={<Upload size={32} />} title="Upload Scan" desc="Securely upload your intraoral images to our encrypted cloud." />
            <div className="workflow-connector"></div>
            <WorkflowCard step="02" icon={<BrainCircuit size={32} />} title="AI Analysis" desc="The neural network processes the image in milliseconds." highlight />
            <div className="workflow-connector"></div>
            <WorkflowCard step="03" icon={<UserCheck size={32} />} title="Doctor Review" desc="A certified professional verifies the AI output." />
            <div className="workflow-connector"></div>
            <WorkflowCard step="04" icon={<BadgeCheck size={32} />} title="Final Result" desc="Receive your clinical diagnosis and treatment plan." />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    className="feature-card glass-card"
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -10, scale: 1.02 }}
  >
    <div className="feature-icon-glow">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{desc}</p>
  </motion.div>
);

const DiseaseCard = ({ icon, title, desc }) => (
  <motion.div 
    className="disease-cyber-card"
    variants={{
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 }
    }}
    whileHover={{ scale: 1.05 }}
  >
    <div className="cyber-glow-bg"></div>
    <div className="disease-card-content">
      <div className="disease-icon-wrapper text-secondary">{icon}</div>
      <h4 className="disease-title">{title}</h4>
      <p className="disease-desc">{desc}</p>
    </div>
  </motion.div>
);

const WorkflowCard = ({ step, icon, title, desc, highlight }) => (
  <motion.div 
    className={`workflow-card glass-card ${highlight ? 'highlight-step' : ''}`}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -10 }}
  >
    <div className="step-number">{step}</div>
    <div className={`workflow-icon-wrapper ${highlight ? 'glow-active' : ''}`}>
      {icon}
    </div>
    <h3 className="workflow-title">{title}</h3>
    <p className="workflow-desc">{desc}</p>
  </motion.div>
);

export default Home;
