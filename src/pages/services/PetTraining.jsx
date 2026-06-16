import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Footer from '../../components/Footer';
import './PetTraining.css';

function PetTraining() {
  const navigate = useNavigate();
  const location = useLocation();
  const petType = location.state?.petType || 'Dog';
  const [selectedTraining, setSelectedTraining] = useState(null);
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

  const trainingTypes = {
    Dog: [
      { name: 'Basic Obedience', description: 'Sit, stay, come, and basic commands', price: '₹3000', duration: '4-6 weeks' },
      { name: 'Advanced Training', description: 'Complex commands and behavior modification', price: '₹6000', duration: '8-12 weeks' },
      { name: 'Puppy Training', description: 'Early socialization and basic commands', price: '₹2250', duration: '4 weeks' },
      { name: 'Behavioral Training', description: 'Addressing aggression, anxiety, and other issues', price: '₹7500', duration: '12-16 weeks' },
      { name: 'Agility Training', description: 'Agility course and obstacle training', price: '₹4500', duration: '8-10 weeks' }
    ],
    Cat: [
      { name: 'Basic Commands', description: 'Sit, stay, and basic cat training', price: '₹2250', duration: '4-6 weeks' },
      { name: 'Litter Training', description: 'Proper litter box usage', price: '₹1500', duration: '2-4 weeks' },
      { name: 'Behavioral Training', description: 'Addressing scratching, aggression issues', price: '₹4500', duration: '8-12 weeks' }
    ],
    Horse: [
      { name: 'Basic Riding', description: 'Fundamental riding skills and commands', price: '₹5000', duration: '6-8 weeks' },
      { name: 'Advanced Riding', description: 'Advanced techniques and jumping', price: '₹8000', duration: '10-12 weeks' },
      { name: 'Ground Work', description: 'Ground handling and groundwork exercises', price: '₹3500', duration: '4-6 weeks' },
      { name: 'Behavioral Training', description: 'Addressing behavioral issues and trust building', price: '₹6000', duration: '8-12 weeks' }
    ],
    Rabbit: [
      { name: 'Litter Training', description: 'Proper litter box training', price: '₹1200', duration: '2-4 weeks' },
      { name: 'Basic Commands', description: 'Come, stay, and basic commands', price: '₹1800', duration: '4-6 weeks' },
      { name: 'Socialization', description: 'Social skills and interaction training', price: '₹1500', duration: '3-5 weeks' },
      { name: 'Behavioral Training', description: 'Addressing chewing and digging behaviors', price: '₹2500', duration: '6-8 weeks' }
    ],
    Birds: [
      { name: 'Basic Commands', description: 'Step up, stay, and basic commands', price: '₹2000', duration: '4-6 weeks' },
      { name: 'Talking Training', description: 'Speech and mimicry training', price: '₹3500', duration: '8-12 weeks' },
      { name: 'Socialization', description: 'Social skills and interaction training', price: '₹1800', duration: '4-6 weeks' },
      { name: 'Behavioral Training', description: 'Addressing biting and screaming issues', price: '₹3000', duration: '6-10 weeks' }
    ],
    'Other Pets': [
      { name: 'Basic Training', description: 'General pet training and commands', price: '₹1750', duration: '4-6 weeks' },
      { name: 'Behavioral Training', description: 'Addressing specific behavioral issues', price: '₹3750', duration: '8-12 weeks' }
    ]
  };

  const trainings = trainingTypes[petType] || trainingTypes.Dog;


  const getTrainingImage = (trainingName) => {
    if (trainingName.toLowerCase().includes('basic')) return '/images/training-basic.png';
    if (trainingName.toLowerCase().includes('advanced')) return '/images/training-advanced.png';
    if (trainingName.toLowerCase().includes('puppy')) return '/images/training-puppy.png';
    if (trainingName.toLowerCase().includes('agility')) return '/images/training-agility.png';
    return '/images/training-default.png';
  };

  const handleBook = (training) => {
    setSelectedTraining(training);
    navigate('/booking-summary', {
      state: {
        serviceType: 'Pet Training',
        petType,
        item: training,
        petName: selectedPet,
        backTo: '/services/training',
      },
    });
  };

  const handleAddToCart = (training) => {
    try {
      const cartKey = 'servicesCart';
      const existingCart = localStorage.getItem(cartKey);
      const cart = existingCart ? JSON.parse(existingCart) : [];

      const cartItem = {
        id: `training-${petType}-${training.name}-${Date.now()}`,
        name: training.name,
        description: training.description,
        price: training.price,
        duration: training.duration,
        serviceType: 'Pet Training',
        petType: petType,
        type: 'service'
      };

      cart.push(cartItem);
      localStorage.setItem(cartKey, JSON.stringify(cart));
      alert(`${training.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <div className="training-container">
      <div className="training-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Pet Training Services</h1>
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

      <div className="training-content">
        <div className="training-types">
          {trainings.map((training, index) => {
            const trainingImages = [
              '/images/pt1.webp',
              '/images/pt2.webp',
              '/images/pt3.webp',
              '/images/pt4.webp',
              '/images/pt5.webp'
            ];
            return (
              <div
                key={index}
                className={`training-card ${selectedTraining?.name === training.name ? 'selected' : ''}`}
                onClick={() => setSelectedTraining(training)}
              >
                {trainingImages[index] && (
                  <img
                    src={trainingImages[index]}
                    alt={training.name}
                    className="training-style-img"
                  />
                )}
                <h3>{training.name}</h3>
                <p className="description">{training.description}</p>
                <div className="training-details">
                  <div className="price">{training.price}</div>
                  <div className="duration">Duration: {training.duration}</div>
                </div>
                <div className="card-actions">
                  <button
                    className="add-to-cart-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(training);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="book-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBook(training);
                    }}
                  >
                    Book Training
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedTraining && (
          <div className="training-details-panel">
            <div className="training-details-image">
              <img
                src={getTrainingImage(selectedTraining.name)}
                alt={selectedTraining.name}
              />
            </div>
            <div className="training-details-content">
              <h2>{selectedTraining.name}</h2>
              <p className="details-description">{selectedTraining.description}</p>
              <p className="details-price">
                Package price: <strong>{selectedTraining.price}</strong> • Duration: {selectedTraining.duration}
              </p>
              <div className="details-actions">
                <button
                  className="add-to-cart-btn-detail"
                  onClick={() => handleAddToCart(selectedTraining)}
                >
                  Add to Cart
                </button>
                <button
                  className="book-btn-detail"
                  onClick={() => handleBook(selectedTraining)}
                >
                  Book Training
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Training Videos Section */}
        <div className="training-videos-section">
          <h2 className="training-videos-section-title">Watch Our Training Services</h2>
          <div className="training-videos-container">
            <div className="training-video-item">
              <video
                src="/videos/training3 (1).mp4"
                controls
                className="training-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="training-video-item">
              <video
                src="/videos/training3 (3).mp4"
                controls
                autoPlay
                muted
                loop
                playsInline
                className="training-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PetTraining;

