import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Activity, Upload, ScanLine, 
  AlertCircle, AlertTriangle, BrainCircuit, UserCheck, 
  Sparkles, Stethoscope, ChevronRight, CheckCircle2,
  FileHeart, ArrowRight, Zap, Award, Calendar,
  MessageSquare, Lock, HeartPulse, Microscope,
  Building2, BadgeCheck
} from 'lucide-react';
import Tilt3D from '../components/Tilt3D';
import MagneticButton from '../components/MagneticButton';
import './Home.css';

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [location]);

  // Hero Parallax Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleHeroMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const bgParallaxX = useTransform(mouseX, [-1, 1], [15, -15]);
  const bgParallaxY = useTransform(mouseY, [-1, 1], [15, -15]);
  const imgParallaxX = useTransform(mouseX, [-1, 1], [-18, 18]);
  const imgParallaxY = useTransform(mouseY, [-1, 1], [-18, 18]);
  const card1ParallaxX = useTransform(mouseX, [-1, 1], [-25, 25]);
  const card1ParallaxY = useTransform(mouseY, [-1, 1], [-25, 25]);
  const card2ParallaxX = useTransform(mouseX, [-1, 1], [-12, 12]);
  const card2ParallaxY = useTransform(mouseY, [-1, 1], [-12, 12]);

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  return (
    <div className="home-page">
      {/* --------------------------------------------------------------------------
          1. Modern Clinical Tech Hero Section
          -------------------------------------------------------------------------- */}
      <section id="home" className="hero-section" onMouseMove={handleHeroMouseMove}>
        <motion.div className="hero-ambient-glow glow-top-left" style={{ x: bgParallaxX, y: bgParallaxY }}></motion.div>
        <motion.div className="hero-ambient-glow glow-bottom-right" style={{ x: bgParallaxX, y: bgParallaxY }}></motion.div>
        <div className="hero-grid-mesh"></div>

        <div className="container hero-container">
          {/* Left Column: Hero Copy & Actions */}
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Live Indicator Pill */}
            <motion.div variants={fadeUp} className="hero-badge-modern">
              <span className="badge-pulse-indicator">
                <span className="pulse-ping"></span>
                <span className="pulse-core"></span>
              </span>
              <span className="badge-text">Next-Gen Clinical AI • MobileNetV2 Vision</span>
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 variants={fadeUp} className="hero-title">
              Smarter Dental Care,<br />
              <span className="hero-gradient-text">Powered by Clinical AI.</span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p variants={fadeUp} className="hero-subtitle">
              DentaAI combines state-of-the-art computer vision with certified dental expertise. 
              Screen visible oral conditions in seconds and connect directly with verified specialists 
              for in-person visits and live clinical consultations.
            </motion.p>
            
            {/* Primary Action Buttons */}
            <motion.div variants={fadeUp} className="hero-actions">
              <MagneticButton>
                <Link to="/register" className="btn-modern btn-primary-tech">
                  <span>Start AI Screening</span>
                  <ArrowRight size={18} className="btn-icon-shift" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/login" className="btn-modern btn-outline-tech">
                  <Stethoscope size={18} color="#00A6A6" />
                  <span>Consult a Dentist</span>
                </Link>
              </MagneticButton>
            </motion.div>
            
            {/* Trust Proof Pillars */}
            <motion.div variants={fadeUp} className="hero-trust-bar">
              <div className="trust-pill">
                <ShieldCheck size={16} className="text-teal" />
                <span>HIPAA & DISHA Aligned</span>
              </div>
              <div className="trust-pill">
                <BrainCircuit size={16} className="text-teal" />
                <span>6 Conditions Analyzed</span>
              </div>
              <div className="trust-pill">
                <BadgeCheck size={16} className="text-teal" />
                <span>Licensed Dentists (BDS/MDS)</span>
              </div>
              <div className="trust-pill">
                <Zap size={16} className="text-teal" />
                <span>Instant Screening &lt;3s</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Right Column: Hero Visual Centerpiece */}
          <motion.div 
            className="hero-visual-wrapper"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ x: imgParallaxX, y: imgParallaxY }}
          >
            <Tilt3D maxRotation={4}>
              <div className="hero-card-frame">
                <div className="hero-image-box">
                  <img 
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1400&auto=format&fit=crop" 
                    alt="Dentist evaluating patient radiograph with AI" 
                    className="hero-main-img"
                  />
                  {/* Subtle AI Scanline Beam Effect */}
                  <div className="hero-scan-beam"></div>
                  <div className="hero-img-gradient-scrim"></div>
                </div>

                {/* Floating HUD Card 1: AI Engine Active */}
                <motion.div 
                  className="hero-hud-card hud-top-left"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ x: card1ParallaxX, y: card1ParallaxY }}
                >
                  <div className="hud-icon-box bg-teal-soft">
                    <BrainCircuit size={20} color="#00A6A6" />
                  </div>
                  <div className="hud-meta">
                    <div className="hud-title-row">
                      <span className="hud-title">AI Diagnostics Engine</span>
                      <span className="hud-live-tag">Active</span>
                    </div>
                    <span className="hud-desc">MobileNetV2 • 94.2% Precision</span>
                  </div>
                </motion.div>

                {/* Floating HUD Card 2: Doctor Consultation */}
                <motion.div 
                  className="hero-hud-card hud-bottom-right"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  style={{ x: card2ParallaxX, y: card2ParallaxY }}
                >
                  <div className="hud-icon-box bg-blue-soft">
                    <Stethoscope size={20} color="#0284C7" />
                  </div>
                  <div className="hud-meta">
                    <div className="hud-title-row">
                      <span className="hud-title">Doctor Consultation</span>
                      <span className="hud-avail-tag">Available</span>
                    </div>
                    <span className="hud-desc">In-Person Clinic Visits (₹500)</span>
                  </div>
                </motion.div>

                {/* Floating HUD Card 3: Multi-Class Detection */}
                <motion.div 
                  className="hero-hud-card hud-bottom-left"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                >
                  <div className="hud-icon-box bg-emerald-soft">
                    <Activity size={18} color="#10B981" />
                  </div>
                  <div className="hud-meta">
                    <span className="hud-title">Instant Dental Triage</span>
                    <span className="hud-desc">Multi-Class Probability Distribution</span>
                  </div>
                </motion.div>

              </div>
            </Tilt3D>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          2. Clinical Impact & Performance Metrics Bar
          -------------------------------------------------------------------------- */}
      <section className="metrics-strip-section">
        <div className="container">
          <div className="metrics-strip-grid">
            <div className="metric-box">
              <div className="metric-num-row">
                <span className="metric-number">94.2%</span>
                <span className="metric-accent-pill">High Precision</span>
              </div>
              <p className="metric-label">Neural Classification Accuracy across benchmark dental datasets</p>
            </div>

            <div className="metric-box">
              <div className="metric-num-row">
                <span className="metric-number">6</span>
                <span className="metric-accent-pill">Pathologies</span>
              </div>
              <p className="metric-label">Key dental conditions detected including Caries, Gingivitis & Calculus</p>
            </div>

            <div className="metric-box">
              <div className="metric-num-row">
                <span className="metric-number">&lt; 3s</span>
                <span className="metric-accent-pill">Real-Time</span>
              </div>
              <p className="metric-label">Instant image processing and multi-class probability scoring</p>
            </div>

            <div className="metric-box">
              <div className="metric-num-row">
                <span className="metric-number">100%</span>
                <span className="metric-accent-pill">Confidential</span>
              </div>
              <p className="metric-label">Encrypted medical records with authenticated doctor review trail</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          3. About & AI Technology Section
          -------------------------------------------------------------------------- */}
      <section id="about" className="clinical-about-section">
        <div className="container">
          <motion.div 
            className="about-split-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {/* Visual Column */}
            <motion.div variants={fadeUp} className="about-visual-column">
              <div className="about-image-card">
                <img 
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1400&auto=format&fit=crop" 
                  alt="Dental clinical examination" 
                  className="about-photo"
                />
                <div className="about-overlay-chip">
                  <div className="chip-icon">
                    <Microscope size={24} color="#00A6A6" />
                  </div>
                  <div>
                    <h4 className="chip-title">MobileNetV2 Backbone</h4>
                    <p className="chip-sub">Transfer Learning & Feature Extraction</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Content Column */}
            <motion.div variants={fadeUp} className="about-text-column">
              <div className="section-eyebrow">
                <BrainCircuit size={16} color="#00A6A6" />
                <span>Next-Generation Diagnostics</span>
              </div>
              
              <h2 className="section-heading">
                Bridging Artificial Intelligence with Professional Dental Expertise
              </h2>
              
              <p className="section-description">
                DentaAI was built to solve early detection challenges in oral healthcare. 
                Using optimized deep convolutional neural networks, our system analyzes visible 
                intraoral images to detect dental pathologies before they escalate into painful, costly procedures.
              </p>
              
              <div className="about-feature-grid">
                <div className="feature-mini-card">
                  <div className="feature-mini-icon bg-teal-soft">
                    <ScanLine size={22} color="#00A6A6" />
                  </div>
                  <div>
                    <h4 className="feature-mini-title">Computer Vision</h4>
                    <p className="feature-mini-desc">Automated detection of surface anomalies, cavities, and inflammation.</p>
                  </div>
                </div>

                <div className="feature-mini-card">
                  <div className="feature-mini-icon bg-blue-soft">
                    <Activity size={22} color="#0284C7" />
                  </div>
                  <div>
                    <h4 className="feature-mini-title">Probability Breakdown</h4>
                    <p className="feature-mini-desc">Complete 6-class confidence distributions for full clinical transparency.</p>
                  </div>
                </div>

                <div className="feature-mini-card">
                  <div className="feature-mini-icon bg-emerald-soft">
                    <UserCheck size={22} color="#10B981" />
                  </div>
                  <div>
                    <h4 className="feature-mini-title">Doctor Verification</h4>
                    <p className="feature-mini-desc">Approved dentists confirm or override AI findings with official clinical notes.</p>
                  </div>
                </div>

                <div className="feature-mini-card">
                  <div className="feature-mini-icon bg-indigo-soft">
                    <Calendar size={22} color="#6366F1" />
                  </div>
                  <div>
                    <h4 className="feature-mini-title">Conflict-Free Booking</h4>
                    <p className="feature-mini-desc">Live slot reservation preventing double bookings for in-person and chat care.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          4. Features Section (Bento Grid)
          -------------------------------------------------------------------------- */}
      <section id="features-section" className="features-bento-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-eyebrow">
              <Sparkles size={16} color="#00A6A6" />
              <span>Core Capabilities</span>
            </span>
            <h2 className="section-heading">Everything You Need for Modern Oral Health</h2>
            <p className="section-description centered">
              From instant neural image screening to verified clinical consultations and digital prescriptions.
            </p>
          </div>

          <div className="bento-grid">
            
            {/* Bento Card 1: AI Disease Detection (Large) */}
            <div className="bento-card bento-card-large">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-teal-soft">
                  <BrainCircuit size={26} color="#00A6A6" />
                </div>
                <span className="bento-tag">Deep Learning</span>
              </div>
              <h3 className="bento-title">Automated Dental Disease Screening</h3>
              <p className="bento-desc">
                Upload intraoral radiographs or photographs. The trained MobileNetV2 architecture scans pixels 
                to output preliminary diagnoses with associated confidence metrics in under 3 seconds.
              </p>
              <div className="bento-feature-pills">
                <span className="mini-pill">MobileNetV2</span>
                <span className="mini-pill">Softmax Probabilities</span>
                <span className="mini-pill">Preliminary Disclaimers</span>
              </div>
            </div>

            {/* Bento Card 2: In-Person Clinic Visits (Medium) */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-blue-soft">
                  <Building2 size={26} color="#0284C7" />
                </div>
                <span className="bento-tag price-tag">₹500 Fee</span>
              </div>
              <h3 className="bento-title">In-Person Clinic Appointments</h3>
              <p className="bento-desc">
                Book physical examinations at verified dentist clinics. Guaranteed slot uniqueness prevents overlapping appointments.
              </p>
            </div>

            {/* Bento Card 3: Conflict-Free Slot Booking (Medium) */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-cyan-soft">
                  <Calendar size={26} color="#06B6D4" />
                </div>
                <span className="bento-tag">Guaranteed Slot</span>
              </div>
              <h3 className="bento-title">Conflict-Free Clinic Scheduling</h3>
              <p className="bento-desc">
                Doctor-specific calendar slots with atomic concurrency locks ensure only one patient can reserve each appointment slot.
              </p>
            </div>

            {/* Bento Card 4: Doctor Verification & E-Prescriptions */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-emerald-soft">
                  <BadgeCheck size={26} color="#10B981" />
                </div>
                <span className="bento-tag">Verified Care</span>
              </div>
              <h3 className="bento-title">Doctor Verification Portal</h3>
              <p className="bento-desc">
                Approved dentists review pending cases, verify or override AI predictions, and issue authenticated e-prescriptions.
              </p>
            </div>

            {/* Bento Card 5: Bank-Grade Payments */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-purple-soft">
                  <Lock size={26} color="#8B5CF6" />
                </div>
                <span className="bento-tag">Razorpay</span>
              </div>
              <h3 className="bento-title">Secure Banking Infrastructure</h3>
              <p className="bento-desc">
                256-bit encrypted checkout via Razorpay supporting UPI, Cards, and Net Banking. Fixed ₹49 platform access fee.
              </p>
            </div>

            {/* Bento Card 6: Dual-Section Patient Reports */}
            <div className="bento-card">
              <div className="bento-card-header">
                <div className="bento-icon-box bg-amber-soft">
                  <FileHeart size={26} color="#F59E0B" />
                </div>
                <span className="bento-tag">Transparent</span>
              </div>
              <h3 className="bento-title">Separated Clinical Reports</h3>
              <p className="bento-desc">
                Clear clinical separation between AI preliminary screenings and doctor-confirmed clinical assessments with official doctor signatures.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          5. Detection Capabilities (6 Dental Conditions)
          -------------------------------------------------------------------------- */}
      <section id="diseases" className="diseases-showcase-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-eyebrow">
              <Microscope size={16} color="#00A6A6" />
              <span>Diagnostic Scope</span>
            </span>
            <h2 className="section-heading">Trained on 6 Critical Dental Conditions</h2>
            <p className="section-description centered">
              Our neural network is rigorously trained to detect visible indicators of these common oral pathologies.
            </p>
          </div>
          
          <motion.div 
            className="disease-cards-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerContainer}
          >
            <DiseaseCard 
              icon={<ShieldCheck size={28} color="#00A6A6" />} 
              title="Calculus (Tartar)" 
              category="Preventive Care"
              desc="Hardened dental plaque deposits adhering to tooth enamel and gum margins requiring professional scaling." 
            />
            <DiseaseCard 
              icon={<ScanLine size={28} color="#0284C7" />} 
              title="Caries (Cavities)" 
              category="Enamel Decay"
              desc="Bacterial demineralization of tooth structures leading to structural enamel cavitation and sensitivity." 
            />
            <DiseaseCard 
              icon={<Activity size={28} color="#EF4444" />} 
              title="Gingivitis" 
              category="Periodontal Health"
              desc="Reversible early-stage gum disease marked by inflammation, tenderness, redness, and bleeding during brushing." 
            />
            <DiseaseCard 
              icon={<AlertTriangle size={28} color="#F59E0B" />} 
              title="Hypodontia" 
              category="Developmental"
              desc="Congenital absence of one or more permanent teeth, assessed for orthodontic and prosthetic management." 
            />
            <DiseaseCard 
              icon={<AlertCircle size={28} color="#EC4899" />} 
              title="Mouth Ulcer" 
              category="Mucosal Lesions"
              desc="Painful aphthous ulcerations on oral mucous membranes evaluated for healing timelines and discomfort relief." 
            />
            <DiseaseCard 
              icon={<Sparkles size={28} color="#8B5CF6" />} 
              title="Tooth Discoloration" 
              category="Aesthetic & Structural"
              desc="Extrinsic staining from diet or intrinsic enamel variations requiring professional bleaching or restorative care." 
            />
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          6. How It Works (Clinical Pathway)
          -------------------------------------------------------------------------- */}
      <section id="how-it-works" className="workflow-pathway-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="section-eyebrow">
              <Activity size={16} color="#00A6A6" />
              <span>Step-by-Step Pathway</span>
            </span>
            <h2 className="section-heading">How DentaAI Works</h2>
            <p className="section-description centered">
              A transparent, patient-centric workflow from initial photo capture to certified specialist guidance.
            </p>
          </div>
          
          <div className="pathway-grid">
            <div className="pathway-card">
              <div className="pathway-step-badge">01</div>
              <div className="pathway-icon-box">
                <Upload size={28} color="#00A6A6" />
              </div>
              <h3 className="pathway-title">Upload Dental Scan</h3>
              <p className="pathway-desc">
                Take a clear intraoral photograph or upload dental radiographs securely from your phone or computer.
              </p>
            </div>

            <div className="pathway-card">
              <div className="pathway-step-badge">02</div>
              <div className="pathway-icon-box active">
                <BrainCircuit size={28} color="#0284C7" />
              </div>
              <h3 className="pathway-title">AI Neural Analysis</h3>
              <p className="pathway-desc">
                MobileNetV2 processes the image in seconds, evaluating probability across all six target conditions.
              </p>
            </div>

            <div className="pathway-card">
              <div className="pathway-step-badge">03</div>
              <div className="pathway-icon-box">
                <ScanLine size={28} color="#10B981" />
              </div>
              <h3 className="pathway-title">Preliminary Screening</h3>
              <p className="pathway-desc">
                View your instant preliminary finding, confidence score, and clear clinical safety guidance.
              </p>
            </div>

            <div className="pathway-card">
              <div className="pathway-step-badge">04</div>
              <div className="pathway-icon-box">
                <UserCheck size={28} color="#6366F1" />
              </div>
              <h3 className="pathway-title">Doctor Consultation</h3>
              <p className="pathway-desc">
                Book an in-person clinic visit (₹500 consultation fee + ₹49 platform fee = ₹549 total) for authenticated diagnosis and prescriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          7. Doctor Partnership & Clinical Oversight
          -------------------------------------------------------------------------- */}
      <section className="doctor-partner-section">
        <div className="container">
          <motion.div 
            className="doctor-partner-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="doctor-partner-content">
              <div className="section-eyebrow">
                <Stethoscope size={16} color="#00A6A6" />
                <span>Clinical Oversight</span>
              </div>
              
              <h2 className="section-heading">Connecting Patients with Certified Specialists</h2>
              
              <p className="section-description">
                AI screenings provide preliminary triage, but clinical diagnosis always remains with qualified dentists. 
                DentaAI enables patients to seamlessly share imaging and preliminary findings with verified 
                practitioners for comprehensive evaluation.
              </p>
              
              <div className="doctor-benefits-list">
                <div className="benefit-row">
                  <CheckCircle2 size={20} color="#00A6A6" />
                  <span>Licensed BDS & MDS dental practitioners verified by Admin</span>
                </div>
                <div className="benefit-row">
                  <CheckCircle2 size={20} color="#00A6A6" />
                  <span>Conflict-free calendar booking with guaranteed slot uniqueness</span>
                </div>
                <div className="benefit-row">
                  <CheckCircle2 size={20} color="#00A6A6" />
                  <span>In-Person Dental Clinic Consultations (₹500 fee + ₹49 platform fee = ₹549 total)</span>
                </div>
                <div className="benefit-row">
                  <CheckCircle2 size={20} color="#00A6A6" />
                  <span>Authenticated digital e-prescriptions valid across licensed pharmacies</span>
                </div>
              </div>

              <div className="doctor-cta-row">
                <MagneticButton>
                  <Link to="/register" className="btn-modern btn-primary-tech">
                    <span>Book a Consultation</span>
                    <ArrowRight size={18} />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link to="/login" className="btn-modern btn-outline-tech">
                    <span>Doctor Portal Access</span>
                  </Link>
                </MagneticButton>
              </div>
            </motion.div>
            
            <motion.div variants={fadeUp} className="doctor-partner-visual">
              <Tilt3D maxRotation={3}>
                <div className="doctor-card-frame">
                  <img 
                    src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1400&auto=format&fit=crop" 
                    alt="Dentist discussing clinical dental findings" 
                    className="doctor-partner-img"
                  />
                  <div className="doctor-badge-overlay">
                    <div className="doc-overlay-icon">
                      <BadgeCheck size={26} color="#00A6A6" />
                    </div>
                    <div>
                      <h4 className="doc-overlay-name">Dr. Priya Menon, MDS</h4>
                      <p className="doc-overlay-meta">Senior Periodontist • SmileCraft Clinic</p>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          8. Contact Section
          -------------------------------------------------------------------------- */}
      <section id="contact-section" className="clinical-contact-section">
        <div className="container">
          <div className="contact-box-card">
            <div className="section-eyebrow">
              <Sparkles size={16} color="#00A6A6" />
              <span>Get in Touch</span>
            </div>
            <h2 className="section-heading">Contact the DentaAI Team</h2>
            <p className="section-description centered">
              Have questions regarding AI screening, clinical partnership, or clinic integration? 
              Our clinical and technical teams are here to assist.
            </p>
            <div className="contact-info-strip">
              <div className="contact-info-pill">
                <ShieldCheck size={18} color="#00A6A6" />
                <span>Support: support@dentaai.com</span>
              </div>
              <div className="contact-info-pill">
                <Building2 size={18} color="#00A6A6" />
                <span>Clinical HQ: DentaAI Healthcare Innovation Hub</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          9. Final Call-to-Action Banner
          -------------------------------------------------------------------------- */}
      <section className="clinical-cta-banner">
        <div className="cta-ambient-mesh"></div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="cta-badge">
              <Sparkles size={16} /> <span>Smart Oral Health Starts Here</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="cta-main-title">
              Take the First Step Toward Proactive Dental Health
            </motion.h2>
            <motion.p variants={fadeUp} className="cta-main-subtitle">
              Upload your dental radiograph or photo now for immediate AI screening, 
              or schedule an appointment with top verified dental practitioners.
            </motion.p>
            <motion.div variants={fadeUp} className="cta-btn-group">
              <MagneticButton>
                <Link to="/register" className="btn-modern btn-primary-tech btn-lg-glow">
                  <span>Start Free AI Screening</span>
                  <ArrowRight size={20} />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/login" className="btn-modern btn-outline-white-tech">
                  <span>Sign In to Dashboard</span>
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

/* --------------------------------------------------------------------------
   Sub-Components
   -------------------------------------------------------------------------- */

const DiseaseCard = ({ icon, title, category, desc }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 22 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    <Tilt3D maxRotation={3} className="h-full">
      <div className="clinical-disease-card">
        <div className="disease-card-header">
          <div className="disease-icon-wrap">{icon}</div>
          <span className="disease-category-tag">{category}</span>
        </div>
        <h4 className="disease-card-title">{title}</h4>
        <p className="disease-card-desc">{desc}</p>
        <div className="disease-card-footer">
          <span className="supported-badge">
            <CheckCircle2 size={13} color="#00A6A6" />
            <span>AI Vision Supported</span>
          </span>
        </div>
      </div>
    </Tilt3D>
  </motion.div>
);

export default Home;
