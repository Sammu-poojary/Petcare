import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { getUnreadCount } from '../utils/notifications';
import Footer from '../components/Footer';
import './Home.css';

const formatPetType = (type) => {
  if (type === 'dog') return 'Dog';
  if (type === 'cat') return 'Cat';
  if (!type) return 'Pet';
  return 'Other';
};

function Home({ onLogout, onToggleTheme, isDarkMode }) {
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedOtherPet, setSelectedOtherPet] = useState('');
  const [showOtherPetsDropdown, setShowOtherPetsDropdown] = useState(false);
  const [petProfiles, setPetProfiles] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const welcomeShownRef = useRef(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        let userId = session?.user?.id;

        if (!userId && isAuthenticated) {
          userId = 'guest';
        }

        if (!userId) {
          setPetProfiles([]);
          return;
        }

        const userProfileKey = `pets_${userId}`;
        const storedPets = localStorage.getItem(userProfileKey);

        if (!storedPets) {
          setPetProfiles([]);
          return;
        }

        const parsed = JSON.parse(storedPets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPetProfiles(parsed);
        } else {
          setPetProfiles([]);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setPetProfiles([]);
      }
    };

    loadUserProfile();

    // Load unread notification count
    const updateUnreadCount = () => {
      setUnreadCount(getUnreadCount());
    };
    updateUnreadCount();

    // Update unread count every 5 seconds
    const interval = setInterval(updateUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Show welcome message only once immediately after login
  useEffect(() => {
    const fromLogin = location.state?.fromLogin || sessionStorage.getItem('justLoggedIn') === 'true';
    if (fromLogin && petProfiles.length > 0 && !welcomeShownRef.current) {
      setShowWelcomeMessage(true);
      sessionStorage.removeItem('justLoggedIn');
      welcomeShownRef.current = true;
      const timer = setTimeout(() => setShowWelcomeMessage(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [petProfiles, location.state]);

  const services = [
    {
      id: 'grooming',
      name: 'Pet Grooming',
      icon: '✂️',
      path: '/services/grooming',
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800',
      tagline: 'Professional spa & styling for your furry friends'
    },
    {
      id: 'training',
      name: 'Pet Training',
      icon: '🎓',
      path: '/services/training',
      // Bright Golden Retriever - safe & clear
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
      tagline: 'Obedience, behavior & fun training programs'
    },
    {
      id: 'walking',
      name: 'Pet Walking',
      icon: '🚶',
      path: '/services/walking',
      // Standard dog walking
      image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=800',
      tagline: 'Daily walks and playtime by trusted walkers'
    },
    {
      id: 'boarding',
      name: 'Pet Boarding',
      icon: '🏠',
      path: '/services/boarding',
      image: 'images/pet-boarding.png',
      carouselImage: 'images/pet-boarding.png',
      tagline: 'Safe, homely stays while you are away'
    },
    {
      id: 'consult',
      name: 'Consult Doctor',
      icon: '👨‍⚕️',
      path: '/services/consult-doctor',
      // Vet with dog (User liked)
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
      tagline: 'Instant access to experienced vets online'
    },
    {
      id: 'dogshow',
      name: 'Dog Show',
      icon: '🏆',
      path: '/services/dog-show',
      // Dog show/agility
      image: 'https://images.unsplash.com/photo-1516371535707-512a1e83bb9a?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1516371535707-512a1e83bb9a?auto=format&fit=crop&q=80&w=800',
      tagline: 'Fun events & competitions for your champions'
    },
    {
      id: 'shop',
      name: 'Medical Shop',
      icon: '🛒',
      path: '/services/medical-shop',
      // Clear medical supplies/pills - represents pharmacy
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
      carouselImage: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
      tagline: 'Medicines & essentials delivered for your pet'
    }
  ];

  const petTypes = ['Dog', 'Cat', 'Other Pets'];
  const otherPetOptions = ['Horse', 'Rabbit', 'Birds'];
  const primaryPet = petProfiles[0];

  // Auto-slide carousel items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 7);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load reviews from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('siteFeedbacks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setFeedbacks(parsed);
      } else {
        // default data if empty
        const sample = [
          { name: 'Rahul', rating: 5, text: 'Great service and friendly staff!' },
          { name: 'Sneha', rating: 5, text: 'My dog loved the grooming session.' },
          { name: 'Amit', rating: 4, text: 'Smooth booking process and helpful team.' }
        ];
        setFeedbacks(sample);
        localStorage.setItem('siteFeedbacks', JSON.stringify(sample));
      }
    } catch (e) {
      console.error('Feedback load error', e);
    }
  }, []);

  // Feedback slider
  useEffect(() => {
    if (!feedbacks?.length) return;
    const id = setInterval(() => {
      setCurrentFeedback((p) => (p + 1) % feedbacks.length);
    }, 5000);
    return () => clearInterval(id);
  }, [feedbacks]);

  const submitFeedback = async (e) => {
    e.preventDefault();
    const text = feedbackInput.trim();
    if (!text) return;

    // Get user name for the review
    let owner = 'Guest';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        owner = localStorage.getItem(`ownerName_${userId}`) || localStorage.getItem('ownerName') || 'User';
      } else {
        owner = localStorage.getItem('ownerName') || 'Guest';
      }
    } catch (err) {
      owner = localStorage.getItem('ownerName') || 'Guest';
    }

    const newFb = { name: owner, rating: feedbackRating, text };
    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem('siteFeedbacks', JSON.stringify(updated));
    setFeedbackInput('');
    setFeedbackRating(5);
    setCurrentFeedback(0);
  };

  const prevFeedback = () => setCurrentFeedback((p) => (p - 1 + feedbacks.length) % feedbacks.length);
  const nextFeedback = () => setCurrentFeedback((p) => (p + 1) % feedbacks.length);

  const handleServiceClick = (path) => {
    const petTypeToPass = selectedPet === 'Other Pets' && selectedOtherPet
      ? selectedOtherPet
      : selectedPet || 'Dog';
    navigate(path, { state: { petType: petTypeToPass } });
  };

  const handlePetTypeClick = (pet) => {
    if (pet === 'Other Pets') {
      setShowOtherPetsDropdown(!showOtherPetsDropdown);
      setSelectedPet('Other Pets');
    } else {
      setSelectedPet(pet);
      setSelectedOtherPet('');
      setShowOtherPetsDropdown(false);
    }
  };

  const handleOtherPetSelect = (pet) => {
    setSelectedOtherPet(pet);
    setShowOtherPetsDropdown(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length);
  };

  const handleEditProfile = () => {
    navigate('/pet-profile');
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const handleExitClick = () => {
    onLogout();
    // Try to close the window if allowed, otherwise go to login
    window.close();
    navigate('/login');
  };

  const handleNotificationsClick = () => {
    setShowMenu(false);
    navigate('/notifications');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>🐾 Pawfect Care</h1>

          <nav className="menu" ref={menuRef} style={{ display: 'flex', gap: '15px', alignItems: 'center', position: 'relative' }}>
            <button
              className="notification-btn-header"
              onClick={handleNotificationsClick}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s'
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge" style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ff4757',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {primaryPet && (
              <button
                className="profile-btn-header"
                onClick={handleEditProfile}
                title={`${primaryPet.name || 'Pet'} - Profile`}
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
              >
                {primaryPet.image && (primaryPet.image.startsWith('data:') || primaryPet.image.startsWith('http')) ? (
                  <img
                    src={primaryPet.image}
                    alt={`${primaryPet.name || 'Pet'}'s profile`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                      borderRadius: '50%',
                      color: 'white'
                    }}
                  >
                    {primaryPet.name ? primaryPet.name.charAt(0).toUpperCase() : '🐾'}
                  </span>
                )}
              </button>
            )}

            <button
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
            >
              ☰ Menu
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={onToggleTheme}>
                  {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => navigate('/track-order')}>
                  📦 Track Orders
                </button>
                <button className="menu-item" onClick={() => navigate('/pet-health')}>
                  💊 Pet Health
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => navigate('/lost-and-found')}>
                  🕵️ Lost & Found
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => navigate('/community')}>
                  🐾 Pet Community
                </button>
                <button className="menu-item" onClick={handleLogoutClick}>
                  Logout
                </button>
                <button className="menu-item" onClick={handleExitClick}>
                  Exit App
                </button>
                <div className="menu-divider" />
                <div className="menu-contact">
                  <p>Contact us:</p>
                  <p>Email: support@pawfectcare.com</p>
                  <p>Phone: +91 98765 43210</p>
                </div>
              </div>
            )}
          </nav>
        </div>
      </header >

      <main className="home-main">
        {showWelcomeMessage && primaryPet && (
          <div className="welcome-message">
            <div className="welcome-content">
              <span className="welcome-icon">👋</span>
              <div className="welcome-text">
                <h3>Welcome back!</h3>
                <p>Hello {primaryPet.name}! 🐾 We're so happy to see you again!</p>
              </div>
              <button
                className="welcome-close-btn"
                onClick={() => setShowWelcomeMessage(false)}
                aria-label="Close welcome message"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <section className="pet-selection">
          <h2>Select Your Pet</h2>
          <div className="pet-types">
            {petTypes.map((pet) => (
              <div key={pet} className="pet-type-wrapper">
                <button
                  className={`pet-type-btn ${selectedPet === pet ? 'active' : ''} ${pet === 'Other Pets' && selectedOtherPet ? 'has-selection' : ''}`}
                  onClick={() => handlePetTypeClick(pet)}
                >
                  {pet === 'Dog' && '🐕'}
                  {pet === 'Cat' && '🐈'}
                  {pet === 'Other Pets' && '🐾'}
                  <span>{pet}</span>
                  {pet === 'Other Pets' && selectedOtherPet && (
                    <span className="selected-other-pet">({selectedOtherPet})</span>
                  )}
                </button>
                {pet === 'Other Pets' && showOtherPetsDropdown && (
                  <div className="other-pets-dropdown">
                    {otherPetOptions.map((option) => (
                      <button
                        key={option}
                        className={`other-pet-option ${selectedOtherPet === option ? 'active' : ''}`}
                        onClick={() => handleOtherPetSelect(option)}
                      >
                        {option === 'Horse' && '🐴'}
                        {option === 'Rabbit' && '🐰'}
                        {option === 'Birds' && '🐦'}
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="services-section">
          <div className="services-header">
            <h2>Our Services</h2>
          </div>

          {/* Service Carousel */}
          <div className="services-carousel-container">
            <div className="carousel-wrapper">
              <button className="carousel-btn carousel-btn-prev" onClick={prevSlide}>
                ‹
              </button>
              <div className="carousel-slide-container">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => handleServiceClick(service.path)}
                  >
                    <img
                      src={service.carouselImage || service.image}
                      alt={service.name}
                      className="carousel-image-element"
                    />
                    <div className="carousel-slide-overlay">
                      <div className="carousel-slide-content">
                        <div className="carousel-service-icon">{service.icon}</div>
                        <h3>{service.name}</h3>
                        {service.tagline && <p className="carousel-tagline">{service.tagline}</p>}
                        <p className="carousel-cta">Tap to explore this service</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="carousel-btn carousel-btn-next" onClick={nextSlide}>
                ›
              </button>
            </div>
            <div className="carousel-indicators">
              {services.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>

          <div className="services-media">
            <div className="services-media-card">
              <h3>See How We Care</h3>
              <p>Watch a quick overview of our pet care services.</p>
              <div className="responsive-video">
                <video
                  src="videos/pet-intro.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
              </div>
            </div>
            <div className="services-media-card">
              <h3>Our Pet Friends</h3>
              <p>Meet some of our adorable rabbit companions.</p>
              <div className="responsive-video">
                <video
                  src="videos/rabbitvdo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
              </div>
            </div>
          </div>
          <h2 className="services-grid-title">Services</h2>
          <div className="home-services-grid">
            {services.map((service) => (
              <div
                key={service.id}
                className="service-card"
                onClick={() => handleServiceClick(service.path)}
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="service-card-bg"
                />
                <div className="service-content">
                  <div className="service-icon-badge">{service.icon}</div>
                  <h3>{service.name}</h3>
                  {service.tagline && (
                    <p className="service-tagline">
                      {service.tagline}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Feedback Section */}
        <section className="feedback-section">
          <div className="feedback-header">
            <h2>What people say</h2>
            <p className="feedback-sub">Real feedback from our pet parents</p>
          </div>

          <div className="feedback-carousel">
            <button className="feedback-nav prev" onClick={prevFeedback} aria-label="Previous feedback">‹</button>

            <div className="feedback-track">
              {feedbacks.map((fb, idx) => (
                <div
                  key={idx}
                  className={`feedback-slide ${idx === currentFeedback ? 'active' : ''}`}
                >
                  <div className="feedback-card">
                    <div className="feedback-meta">
                      <div className="feedback-avatar">{fb.name?.[0]?.toUpperCase() || 'P'}</div>
                      <div>
                        <strong>{fb.name || 'Guest'}</strong>
                        <div className="feedback-rating">{'⭐'.repeat(fb.rating || 5)}</div>
                      </div>
                    </div>
                    <p className="feedback-text">{fb.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="feedback-nav next" onClick={nextFeedback} aria-label="Next feedback">›</button>
          </div>

          <div className="feedback-indicators">
            {feedbacks.map((_, i) => (
              <button
                key={i}
                className={`feedback-indicator ${i === currentFeedback ? 'active' : ''}`}
                onClick={() => setCurrentFeedback(i)}
                aria-label={`Go to feedback ${i + 1}`}
              />
            ))}
          </div>

          <form className="feedback-form" onSubmit={submitFeedback}>
            <div className="feedback-rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= feedbackRating ? 'active' : ''}`}
                  onClick={() => setFeedbackRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Share your feedback..."
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              className="feedback-input"
            />
            <button type="submit" className="feedback-submit">Send</button>
          </form>
        </section>
      </main>
      <Footer />
    </div >
  );
}

export default Home;

