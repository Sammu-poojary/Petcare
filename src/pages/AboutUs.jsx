import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './AboutUs.css';

function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="about-us-container">
      {/* Video Background */}
      <div className="video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="background-video"
        >
          <source src="videos/pet-intro.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
      </div>

      <div className="about-us-content-wrapper">
        <div className="about-us-header">
          <button className="back-btn" onClick={() => navigate('/home')}>
            ← Back
          </button>
          <h1>About Pawfect Care</h1>
        </div>

        <div className="about-us-content">
          {/* Hero Section */}
          <section className="about-hero">
            <div className="hero-content">
              <h2>Welcome to Pawfect Care</h2>
              <p className="hero-description">
                Your one-stop destination for comprehensive pet care services.
                We are committed to providing exceptional care, love, and attention
                to your beloved pets, ensuring their health, happiness, and well-being.
              </p>
            </div>
            <div className="hero-image">
              <img src="/images/pet-grooming.png" alt="Pawfect Care" />
            </div>
          </section>

          {/* Mission Section */}
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              At Pawfect Care, our mission is to provide the highest quality pet care
              services that enhance the lives of pets and bring peace of mind to their
              owners. We believe that every pet deserves the best care, attention, and
              love, and we strive to deliver that through our comprehensive range of services.
            </p>
          </section>

          {/* Services Overview */}
          <section className="about-section">
            <h2>Our Services</h2>
            <div className="services-grid">
              <div className="service-card" onClick={() => navigate('/services/grooming')}>
                <div className="service-icon">✂️</div>
                <h3>Pet Grooming</h3>
                <p>Professional grooming services to keep your pet looking and feeling their best.</p>
              </div>
              <div className="service-card" onClick={() => navigate('/services/training')}>
                <div className="service-icon">🎓</div>
                <h3>Pet Training</h3>
                <p>Expert training programs to help your pet learn and grow.</p>
              </div>
              <div className="service-card" onClick={() => navigate('/services/walking')}>
                <div className="service-icon">🚶</div>
                <h3>Pet Walking</h3>
                <p>Regular exercise and outdoor activities for your pet's health.</p>
              </div>
              <div className="service-card" onClick={() => navigate('/services/boarding')}>
                <div className="service-icon">🏠</div>
                <h3>Pet Boarding</h3>
                <p>Safe and comfortable boarding facilities for when you're away.</p>
              </div>
              <div className="service-card" onClick={() => navigate('/services/consult-doctor')}>
                <div className="service-icon">👨‍⚕️</div>
                <h3>Veterinary Consultation</h3>
                <p>Access to experienced veterinarians for your pet's health needs.</p>
              </div>
              <div className="service-card" onClick={() => navigate('/services/medical-shop')}>
                <div className="service-icon">🛒</div>
                <h3>Medical Shop</h3>
                <p>Quality pet care products, medicines, and accessories.</p>
              </div>
            </div>
          </section>

          {/* Video Section */}
          <section className="about-section">
            <h2>See Us In Action</h2>
            <div className="video-container">
              <video
                src="/videos/pet-intro.mp4"
                controls
                className="about-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>

          {/* Image Gallery */}
          <section className="about-section">
            <h2>Our Gallery</h2>
            <div className="image-gallery">
              <div className="gallery-item">
                <img src="/images/pet-grooming.png" alt="Pet Grooming" />
              </div>
              <div className="gallery-item">
                <img src="/images/pet-training.png" alt="Pet Training" />
              </div>
              <div className="gallery-item">
                <img src="/images/pet-walking.png" alt="Pet Walking" />
              </div>
              <div className="gallery-item">
                <img src="/images/pet-boarding.png" alt="Pet Boarding" />
              </div>
              <div className="gallery-item">
                <img src="/images/consult-doctor.png" alt="Consult Doctor" />
              </div>
              <div className="gallery-item">
                <img src="/images/medical-shop.png" alt="Medical Shop" />
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="about-section">
            <h2>Why Choose Pawfect Care?</h2>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <div>
                  <h3>Experienced Professionals</h3>
                  <p>Our team consists of trained and certified pet care experts.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <div>
                  <h3>Comprehensive Services</h3>
                  <p>All your pet care needs under one roof.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <div>
                  <h3>Affordable Pricing</h3>
                  <p>Quality services at competitive prices.</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <div>
                  <h3>24/7 Support</h3>
                  <p>We're here for you and your pet whenever you need us.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="about-section contact-section">
            <h2>Get In Touch</h2>
            <div className="contact-info">
              <p><strong>Phone:</strong> <a href="tel:9632038402">9632038402</a></p>
              <p><strong>Email:</strong> <a href="mailto:carepawfect5@gmail.com">carepawfect5@gmail.com</a></p>
              <p><strong>Address:</strong> Pawfect Care, Katapady, Udupi-576101</p>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default AboutUs;

