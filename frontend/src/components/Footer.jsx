import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>DentalAI</h3>
            <p>AI-Based Dental Disease Detection and Health Management System</p>
          </div>
          <div className="footer-links">
            <p>&copy; {new Date().getFullYear()} DentalAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
