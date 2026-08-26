import { Link, useLocation } from 'react-router-dom';
import { BriefcaseMedical, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <BriefcaseMedical className="logo-icon" size={28} />
          <span className="logo-text">DentaAI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-only">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="#" className="nav-link">About</Link>
          <Link to="#" className="nav-link">Features</Link>
          <Link to="#" className="nav-link">Diseases</Link>
          <Link to="#" className="nav-link">How It Works</Link>
          <Link to="#" className="nav-link">Contact</Link>
        </div>

        <div className="navbar-actions desktop-only">
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>

        {/* Mobile menu toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={toggleMenu}>Home</Link>
          <Link to="/login" className="mobile-link" onClick={toggleMenu}>Login</Link>
          <Link to="/register" className="mobile-link" onClick={toggleMenu}>Get Started</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
