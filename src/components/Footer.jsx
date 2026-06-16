import { useNavigate } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const navigate = useNavigate();

  const handleAboutUsClick = () => {
    navigate('/about-us');
  };

  const handleServiceClick = (servicePath) => {
    navigate(servicePath);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo Section */}
          <div className="footer-section">
            <div className="footer-logo">
              <span className="paw-icon">🐾</span>
              <h3>Pawfect Care</h3>
            </div>
            <p className="footer-tagline">
              Your trusted partner in pet care and wellness
            </p>
          </div>

          {/* Contact Us Section */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <div className="footer-contact">
              <p>
                <strong>Phone:</strong>{' '}
                <a href="tel:9632038402">9632038402</a>
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:carepawfect5@gmail.com">
                  carepawfect5@gmail.com
                </a>
              </p>
              <p>
                <strong>Address:</strong>
                <br />
                Pawfect Care, Katapady, Udupi-576101
              </p>
            </div>
          </div>

          {/* Services Section */}
          <div className="footer-section">
            <h4>Our Services</h4>
            <ul className="footer-services">
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/grooming')}
                >
                  Pet Grooming
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/training')}
                >
                  Pet Training
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/walking')}
                >
                  Pet Walking
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/boarding')}
                >
                  Pet Boarding
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/consult-doctor')}
                >
                  Consult Doctor
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => handleServiceClick('/services/medical-shop')}
                >
                  Medical Shop
                </button>
              </li>
            </ul>
          </div>

          {/* About Us Section */}
          <div className="footer-section">
            <h4>About Us</h4>
            <p className="footer-about">
              We are dedicated to providing the best care for your beloved pets.
            </p>
            <button className="footer-about-btn" onClick={handleAboutUsClick}>
              Learn More
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Pawfect Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

