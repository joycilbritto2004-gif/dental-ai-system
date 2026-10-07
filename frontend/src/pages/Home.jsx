import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Activity, Upload, ScanLine, 
  AlertCircle, AlertTriangle, BrainCircuit, UserCheck, 
  Sparkles, Stethoscope, ChevronRight, CheckCircle2,
  FileHeart, ArrowRight
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
    // Basic normalized coords for parallax
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
    const y = (clientY / innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const bgParallaxX = useTransform(mouseX, [-1, 1], [15, -15]);
  const bgParallaxY = useTransform(mouseY, [-1, 1], [15, -15]);
  const imgParallaxX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const imgParallaxY = useTransform(mouseY, [-1, 1], [-20, 20]);
  const card1ParallaxX = useTransform(mouseX, [-1, 1], [-30, 30]);
  const card1ParallaxY = useTransform(mouseY, [-1, 1], [-30, 30]);
  const card2ParallaxX = useTransform(mouseX, [-1, 1], [-10, 10]);
  const card2ParallaxY = useTransform(mouseY, [-1, 1], [-10, 10]);
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="home-page">
      {/* --------------------------------------------------------------------------
          Premium Clinical Hero Section
          -------------------------------------------------------------------------- */}
      <section id="home" className="hero-section" onMouseMove={handleHeroMouseMove}>
        <motion.div className="bg-pattern-network" style={{ x: bgParallaxX, y: bgParallaxY }}></motion.div>
        <motion.div className="animated-blob blob-1" style={{ x: bgParallaxX, y: bgParallaxY }}></motion.div>
        <motion.div className="animated-blob blob-2" style={{ x: bgParallaxX, y: bgParallaxY }}></motion.div>
        <div className="container hero-container">
          {/* Left Column: Content */}
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="hero-badge">
              <Sparkles size={16} /> <span>AI-Powered Dental Disease Detection</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="hero-title">
              Smarter Dental Care,<br />
              <span className="text-primary-gradient">Powered by AI</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="hero-subtitle">
              DentaAI helps you perform preliminary screenings of visible dental conditions using advanced artificial intelligence, connecting you seamlessly with certified dental professionals for expert guidance.
            </motion.p>
            
            <motion.div variants={fadeUp} className="hero-actions">
              <MagneticButton>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start AI Screening <ChevronRight size={20} className="ml-2" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Consult a Doctor
                </Link>
              </MagneticButton>
            </motion.div>
            
            <motion.div variants={fadeUp} className="hero-trust">
              <div className="trust-item"><CheckCircle2 size={16} className="text-teal" /> Secure Screening</div>
              <div className="trust-item"><CheckCircle2 size={16} className="text-teal" /> 6 Conditions Detected</div>
              <div className="trust-item"><CheckCircle2 size={16} className="text-teal" /> Professional Review</div>
            </motion.div>
          </motion.div>
          
          {/* Right Column: High Quality Dental Image */}
          <motion.div 
            className="hero-visual-wrapper"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            style={{ x: imgParallaxX, y: imgParallaxY }}
          >
            <Tilt3D maxRotation={3}>
              <div className="hero-image-container">
                <motion.img 
                  src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1400&auto=format&fit=crop" 
                  alt="Modern Dental Clinic" 
                  className="hero-image"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="hero-image-overlay"></div>
                
                {/* Floating Information Cards */}
                <motion.div 
                  className="floating-card card-ai"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ top: '15%', left: '0', x: card1ParallaxX, y: card1ParallaxY }}
                >
                  <div className="icon-box bg-blue-light"><BrainCircuit size={20} className="text-primary" /></div>
                  <div className="card-text">
                    <span className="card-title">AI Analysis</span>
                    <span className="card-desc">Active</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="floating-card card-doctor"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  style={{ bottom: '15%', right: '0', x: card2ParallaxX, y: card2ParallaxY }}
                >
                  <div className="icon-box bg-teal-light"><Stethoscope size={20} className="text-teal" /></div>
                  <div className="card-text">
                    <span className="card-title">Consultation</span>
                    <span className="card-desc">Available</span>
                  </div>
                </motion.div>
              </div>
            </Tilt3D>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          About / AI Section
          -------------------------------------------------------------------------- */}
      <section id="about" className="about-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <motion.div 
            className="about-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="about-visual">
              <div className="image-stack">
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1400&auto=format&fit=crop" 
                  alt="Dental Technology" 
                  className="about-image-main rounded-2xl shadow-lg"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
                {/* Stats Overlay */}
                <div className="stat-card glass-panel-light">
                  <div className="stat-number text-primary">
                    <BrainCircuit size={36} className="mx-auto text-primary" />
                  </div>
                  <div className="stat-label mt-2">Deep Learning Model</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeUp} className="about-content">
              <h2 className="section-title text-dark">Empowering Dentistry with Artificial Intelligence</h2>
              <p className="section-subtitle text-gray">
                DentaAI bridges the gap between technology and human expertise. Our advanced MobileNetV2 architecture scans intraoral images to detect early signs of dental diseases, providing a reliable preliminary screening tool.
              </p>
              
              <div className="about-grid">
                <div className="about-item">
                  <div className="about-icon"><ScanLine size={24} className="text-primary"/></div>
                  <h4 className="about-item-title">Image Analysis</h4>
                  <p className="about-item-desc">Instant processing of clinical scans using deep learning.</p>
                </div>
                <div className="about-item">
                  <div className="about-icon"><Activity size={24} className="text-teal"/></div>
                  <h4 className="about-item-title">6 Conditions Detected</h4>
                  <p className="about-item-desc">Comprehensive early screening for common dental issues.</p>
                </div>
                <div className="about-item">
                  <div className="about-icon"><BrainCircuit size={24} className="text-primary"/></div>
                  <h4 className="about-item-title">Deep Learning Model</h4>
                  <p className="about-item-desc">Advanced MobileNetV2 architecture for high precision.</p>
                </div>
                <div className="about-item">
                  <div className="about-icon"><UserCheck size={24} className="text-teal"/></div>
                  <h4 className="about-item-title">Doctor Consultation</h4>
                  <p className="about-item-desc">Seamlessly share results with professional dentists.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Features Section
          -------------------------------------------------------------------------- */}
      <section id="features-section" className="about-section bg-light-blue" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title text-dark">Main Features</h2>
            <p className="section-subtitle text-gray">Discover what makes DentaAI the leading choice for AI-assisted dental care.</p>
          </div>
          <div className="about-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
            <div className="about-item">
              <div className="about-icon"><ScanLine size={28} className="text-primary"/></div>
              <h4 className="about-item-title">AI Dental Disease Detection</h4>
              <p className="about-item-desc">Analyze uploaded dental images using the trained deep learning model.</p>
            </div>
            <div className="about-item">
              <div className="about-icon"><Activity size={28} className="text-teal"/></div>
              <h4 className="about-item-title">AI Prediction & Confidence</h4>
              <p className="about-item-desc">Display the predicted dental condition and confidence score.</p>
            </div>
            <div className="about-item">
              <div className="about-icon"><FileHeart size={28} className="text-primary"/></div>
              <h4 className="about-item-title">Dental Reports</h4>
              <p className="about-item-desc">Generate and view dental analysis reports.</p>
            </div>
            <div className="about-item">
              <div className="about-icon"><UserCheck size={28} className="text-teal"/></div>
              <h4 className="about-item-title">Doctor Consultation</h4>
              <p className="about-item-desc">Connect patients with verified dental professionals.</p>
            </div>
            <div className="about-item">
              <div className="about-icon"><ShieldCheck size={28} className="text-primary"/></div>
              <h4 className="about-item-title">Secure Online Payment</h4>
              <p className="about-item-desc">Support consultation payments through Razorpay.</p>
            </div>
            <div className="about-item">
              <div className="about-icon"><Stethoscope size={28} className="text-teal"/></div>
              <h4 className="about-item-title">Doctor Verification</h4>
              <p className="about-item-desc">Doctors can review AI results and provide professional diagnosis and treatment recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          How It Works (Visual Workflow)
          -------------------------------------------------------------------------- */}
      <section id="how-it-works" className="workflow-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title text-dark">How DentaAI Works</h2>
            <p className="section-subtitle text-gray">A seamless, professional journey from image upload to clinical guidance.</p>
          </div>
          
          <motion.div 
            className="workflow-timeline"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div 
              className="timeline-line"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            ></motion.div>

            <WorkflowStep 
              step="01" 
              icon={<Upload size={28} />} 
              title="Upload Image" 
              desc="Upload your intraoral images securely to our platform." 
            />
            <WorkflowStep 
              step="02" 
              icon={<BrainCircuit size={32} />} 
              title="AI Analysis" 
              desc="Our neural network processes the image in seconds." 
              isActive={true}
            />
            <WorkflowStep 
              step="03" 
              icon={<ScanLine size={28} />} 
              title="Preliminary Result" 
              desc="Receive an instant AI prediction and confidence score." 
            />
            <WorkflowStep 
              step="04" 
              icon={<UserCheck size={28} />} 
              title="Doctor Consultation" 
              desc="Share results with a professional for expert review." 
            />
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Detection Capabilities
          -------------------------------------------------------------------------- */}
      <section id="diseases" className="diseases-section bg-deep-navy" style={{ scrollMarginTop: '80px' }}>
        <div className="bg-pattern-dots"></div>
        <div className="container relative z-10">
          <div className="section-header text-center">
            <h2 className="section-title text-white">Detection Capabilities</h2>
            <p className="section-subtitle text-light">Our AI model is explicitly trained to identify these critical conditions with high precision.</p>
          </div>
          
          <motion.div 
            className="diseases-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <DiseaseCard icon={<ShieldCheck size={28} />} title="Calculus" desc="Hardened dental plaque requiring professional removal to prevent gum disease." />
            <DiseaseCard icon={<ScanLine size={28} />} title="Caries" desc="Tooth decay or cavities caused by bacterial breakdown of tooth enamel." />
            <DiseaseCard icon={<Activity size={28} />} title="Gingivitis" desc="Early stage gum disease causing inflammation, redness, and bleeding." />
            <DiseaseCard icon={<AlertTriangle size={28} />} title="Hypodontia" desc="Developmental condition characterized by the absence of one or more teeth." />
            <DiseaseCard icon={<AlertCircle size={28} />} title="Mouth Ulcer" desc="Painful lesions or sores that appear in the soft tissue lining of the mouth." />
            <DiseaseCard icon={<Sparkles size={28} />} title="Tooth Discoloration" desc="Staining or changes in the color of the teeth due to various internal or external factors." />
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Doctor and Patient Consultation Section
          -------------------------------------------------------------------------- */}
      <section className="doctor-section">
        <div className="container">
          <motion.div 
            className="doctor-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="doctor-content">
              <h2 className="section-title text-dark">Connecting Patients with Professionals</h2>
              <p className="section-subtitle text-gray mb-6">
                DentaAI doesn't replace your dentist—it empowers you both. Share your AI screening results directly with our network of certified dental professionals to get a comprehensive second opinion.
              </p>
              
              <ul className="benefits-list">
                <li><CheckCircle2 size={20} className="text-teal" /> Share clinical reports instantly</li>
                <li><CheckCircle2 size={20} className="text-teal" /> Secure and private communication</li>
                <li><CheckCircle2 size={20} className="text-teal" /> Verified network of dental experts</li>
              </ul>

              <MagneticButton>
                <Link to="/login" className="btn btn-primary btn-lg mt-6">
                  Connect with a Dentist <ArrowRight size={20} className="ml-2" />
                </Link>
              </MagneticButton>
            </motion.div>
            
            <motion.div variants={fadeUp} className="doctor-visual">
              <Tilt3D maxRotation={3}>
                <div className="hero-image-container">
                <motion.img 
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1400&auto=format&fit=crop" 
                  alt="Dentist consulting patient" 
                  className="doctor-image rounded-3xl shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="hero-image-overlay"></div>
                
                <motion.div 
                  className="floating-card card-ai-results"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ top: '15%', left: '0' }}
                >
                  <div className="icon-box bg-blue-light"><FileHeart size={20} className="text-primary" /></div>
                  <div className="card-text">
                    <span className="card-title">Screening Results</span>
                    <span className="card-desc">Ready to Share</span>
                  </div>
                </motion.div>
              </div>
              </Tilt3D>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Contact Section
          -------------------------------------------------------------------------- */}
      <section id="contact-section" className="about-section bg-light-blue" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title text-dark">Contact Us</h2>
            <p className="section-subtitle text-gray">Get in touch with the DentaAI team.</p>
          </div>
          <div className="text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 className="text-primary mb-6" style={{ fontSize: '1.75rem', fontWeight: '800' }}>DentaAI</h3>
            <p className="text-gray mb-6" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              We are dedicated to improving early awareness and access to dental consultation through the effective use of modern web and AI technologies.
            </p>
            <div style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <p className="text-dark" style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                Please contact us securely through the DentaAI platform for any inquiries or support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------------
          Final CTA Section
          -------------------------------------------------------------------------- */}
      <section className="cta-section">
        <div className="bg-pattern-medical"></div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="cta-title">Take the First Step Toward Better Dental Health</motion.h2>
            <motion.p variants={fadeUp} className="cta-subtitle">Take the first step toward understanding visible dental conditions with AI-assisted preliminary screening.</motion.p>
            <motion.div variants={fadeUp} className="cta-actions">
              <MagneticButton>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start AI Screening
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/login" className="btn btn-outline-white btn-lg">
                  Consult a Doctor
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

const DiseaseCard = ({ icon, title, desc }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    <Tilt3D maxRotation={4} className="h-full">
      <div className="medical-disease-card h-full">
        <div className="medical-icon-wrapper">{icon}</div>
        <h4 className="medical-title">{title}</h4>
        <p className="medical-desc">{desc}</p>
        <div className="hover-glow-effect"></div>
      </div>
    </Tilt3D>
  </motion.div>
);

const WorkflowStep = ({ step, icon, title, desc, isActive }) => (
  <motion.div 
    className={`timeline-step ${isActive ? 'active' : ''}`}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    <div className="timeline-icon-box">
      {icon}
      <span className="timeline-number">{step}</span>
    </div>
    <h3 className="timeline-title">{title}</h3>
    <p className="timeline-desc">{desc}</p>
  </motion.div>
);

export default Home;
