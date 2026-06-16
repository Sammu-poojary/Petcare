import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import Footer from '../../components/Footer';
import './PetGrooming.css';

function PetGrooming() {
  const navigate = useNavigate();
  const location = useLocation();
  const petType = location.state?.petType || 'Dog';
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');

  useEffect(() => {
    const loadUserPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;
          const userProfileKey = `pets_${userId}`;
          const storedPets = localStorage.getItem(userProfileKey);
          if (storedPets) {
            const parsed = JSON.parse(storedPets);
            if (Array.isArray(parsed)) {
              setPets(parsed);
              if (parsed.length > 0) setSelectedPet(parsed[0].name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user pets:', error);
      }
    };
    loadUserPets();
  }, []);

  const groomingStyles = {
    Dog: [
      { name: 'Full Grooming', description: 'Full grooming for pets typically includes a comprehensive routine designed to maintain their hygiene, comfort, and overall health. Key components of full grooming often include:bath ,haircut ,nail trim, ear cleaning.', price: '₹2500' },
      { name: 'Bath & Brush', description: 'Brushing: This step removes loose fur, dirt, and mats, preventing skin irritation and promoting healthy coat growth, Bathing: A thorough bath is performed using pet-safe shampoos to clean the coat without stripping natural oils.', price: '₹1650' },
      { name: 'Haircut Only', description: 'Haircuts and Styling: For pets with longer coats, grooming services may include haircuts and styling to maintain a neat appearance.', price: '₹900' },
      { name: 'Nail Trimming and Ear Cleaning', description: 'Nail trim and ear cleaning: Regular nail trimming and ear cleaning are essential to prevent infections and maintain hygiene', price: '₹1500' },
      { name: 'Deluxe Spa', description: 'Deluxe spa services for pets in India offer a comprehensive grooming experience that includes a range of treatments designed to enhance your pets health and well-being. ', price: '₹3000' }
    ],
    Cat: [
      { name: 'Full Grooming', description: 'Complete bath, haircut, nail trim, and ear cleaning', price: '₹950' },
      { name: 'Bath & Brush', description: 'Bath, blow dry, and brushing', price: '₹550' },
      { name: 'Haircut Only', description: 'Professional haircut and styling', price: '₹750' },
      { name: 'Nail Trimming', description: 'Nail trim and paw care', price: '₹275' },
      { name: 'Deluxe Spa', description: 'Full grooming + massage + aromatherapy', price: '₹1600' }
    ],
    Horse: [
      { name: 'Full Grooming', description: 'Complete bath, mane and tail care, hoof cleaning', price: '₹3500' },
      { name: 'Mane & Tail Care', description: 'Professional mane and tail styling', price: '₹1500' },
      { name: 'Hoof Care', description: 'Hoof cleaning and trimming', price: '₹800' },
      { name: 'Body Wash', description: 'Complete body wash and conditioning', price: '₹1500' },
      { name: 'Premium Spa', description: 'Full grooming + massage + coat conditioning', price: '₹3500' }
    ],
    Rabbit: [
      { name: 'Full Grooming', description: 'Complete bath, nail trim, and fur care', price: '₹800' },
      { name: 'Nail Trimming', description: 'Nail trim service', price: '₹300' },
      { name: 'Fur Brushing', description: 'Professional fur brushing and care', price: '₹500' },
      { name: 'Bath Service', description: 'Bath and blow dry', price: '₹600' },
      { name: 'Deluxe Care', description: 'Full grooming + health check', price: '₹1200' }
    ],
    Birds: [
      { name: 'Wing & Nail Trimming', description: 'Professional wing and nail trimming', price: '₹500' },
      { name: 'Beak Trimming', description: 'Beak care and trimming', price: '₹400' },
      { name: 'Feather Care', description: 'Feather cleaning and conditioning', price: '₹600' },
      { name: 'Full Grooming', description: 'Complete grooming package', price: '₹900' },
      { name: 'Health Check', description: 'Grooming + basic health examination', price: '₹1200' }
    ],
    'Other Pets': [
      { name: 'Basic Grooming', description: 'Bath and basic care', price: '₹600' },
      { name: 'Nail Trimming', description: 'Nail trim service', price: '₹225' },
      { name: 'Full Service', description: 'Complete grooming package', price: '₹900' }
    ]
  };

  const styles = groomingStyles[petType] || groomingStyles.Dog;


  const handleBook = (style) => {
    navigate('/booking-summary', {
      state: {
        serviceType: 'Pet Grooming',
        petType,
        item: style,
        petName: selectedPet,
        backTo: '/services/grooming',
      },
    });
  };

  const handleAddToCart = (style) => {
    const cartKey = 'servicesCart';
    const existingCart = localStorage.getItem(cartKey);
    const cart = existingCart ? JSON.parse(existingCart) : [];

    cart.push({
      id: `grooming-${petType}-${style.name}-${Date.now()}`,
      name: style.name,
      description: style.description,
      price: style.price,
      serviceType: 'Pet Grooming',
      petType,
      type: 'service'
    });

    localStorage.setItem(cartKey, JSON.stringify(cart));
    alert(`${style.name} added to cart!`);
  };

  return (
    <div className="grooming-container">
      <div className="grooming-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Pet Grooming Services</h1>
        <p className="pet-type-badge">{petType}</p>
      </div>

      <div className="pet-selection-section" style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#fff' }}>Select Your Pet</h2>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '1rem' }}
          >
            <option value="">Choose a pet</option>
            {pets.map((pet, idx) => (
              <option key={idx} value={pet.name}>{pet.name} ({pet.type})</option>
            ))}
            {!pets.length && <option value="My Pet">My Pet (Default)</option>}
          </select>
        </div>
      </div>

      <div className="grooming-content">
        <div className="grooming-styles">
          {styles.map((style, index) => {
            const serviceImages = [
              '/images/pg1.jfif',
              '/images/pg2.jfif',
              '/images/pg3.jfif',
              '/images/pg4.jfif',
              '/images/pg5.webp'
            ];
            return (
              <div
                key={index}
                className="grooming-card"
              >
                {serviceImages[index] && (
                  <img 
                    src={serviceImages[index]} 
                    alt={style.name} 
                    className="grooming-style-img" 
                  />
                )}
              <h3>{style.name}</h3>
              <p className="description">{style.description}</p>
              <div className="price">{style.price}</div>
              <div className="card-actions">
                <button className="add-to-cart-btn" onClick={() => handleAddToCart(style)}>
                  Add to Cart
                </button>
                <button className="book-btn" onClick={() => handleBook(style)}>
                  Book Now
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {/* ✅ AUTOPLAY + LOOP GROOMING VIDEOS */}
        <div className="grooming-videos-section">
          <h2 className="videos-section-title">Watch Our Grooming Services</h2>
          <div className="grooming-videos-container">
            {['groom1.mp4', 'groom2.mp4', 'groom3.mp4'].map((video, index) => (
              <div className="grooming-video-item" key={index}>
                <video
                  className="grooming-video"
                  src={`/videos/${video}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default PetGrooming;
