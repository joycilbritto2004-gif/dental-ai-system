import { Link, useLocation } from 'react-router-dom';
import { BriefcaseMedical, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dentaai-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Add scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNavClick = (e, targetId) => {
    if (location.pathname !== '/') return;
    
    e.preventDefault();
    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dentaai-theme', newTheme);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <BriefcaseMedical className="logo-icon" size={28} />
          <span className="logo-text">DentaAI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-only">
          <Link to="/#home" onClick={(e) => handleNavClick(e, 'home')} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/#about" onClick={(e) => handleNavClick(e, 'about')} className="nav-link">About</Link>
          <Link to="/#features-section" onClick={(e) => handleNavClick(e, 'features-section')} className="nav-link">Features</Link>
          <Link to="/#diseases" onClick={(e) => handleNavClick(e, 'diseases')} className="nav-link">Diseases</Link>
          <Link to="/#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="nav-link">How It Works</Link>
          <Link to="/#contact-section" onClick={(e) => handleNavClick(e, 'contact-section')} className="nav-link">Contact</Link>
        </div>

        <div className="navbar-actions desktop-only">
          <motion.button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>

        {/* Mobile menu toggle & Theme toggle */}
        <div className="mobile-only">
          <motion.button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          <button className="mobile-menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/#home" className="mobile-link" onClick={(e) => handleNavClick(e, 'home')}>Home</Link>
          <Link to="/#about" className="mobile-link" onClick={(e) => handleNavClick(e, 'about')}>About</Link>
          <Link to="/#features-section" className="mobile-link" onClick={(e) => handleNavClick(e, 'features-section')}>Features</Link>
          <Link to="/#diseases" className="mobile-link" onClick={(e) => handleNavClick(e, 'diseases')}>Diseases</Link>
          <Link to="/#how-it-works" className="mobile-link" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</Link>
          <Link to="/#contact-section" className="mobile-link" onClick={(e) => handleNavClick(e, 'contact-section')}>Contact</Link>
          <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link to="/register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
