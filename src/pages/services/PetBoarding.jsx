import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Footer from '../../components/Footer';
import './PetBoarding.css';
import { saveBooking } from '../../utils/storage';

function PetBoarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pet: '',
    address: '',
    city: '',
    checkInDate: '',
    checkOutDate: '',
    dropOffTime: '',
    pickupTime: ''
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    comment: ''
  });
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [pets, setPets] = useState([]);

  // Load user-specific pets
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
            }
          }
        }
      } catch (error) {
        console.error('Error loading user pets:', error);
      }
    };
    loadUserPets();

    const savedReviews = localStorage.getItem('pet_boarding_reviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      const defaultReviews = [
        { name: 'Meera Roy', rating: 5, comment: 'Excellent care! My Bruno was so happy here.' },
        { name: 'Karan Singh', rating: 5, comment: 'Very professional and clean facility.' }
      ];
      setReviews(defaultReviews);
      localStorage.setItem('pet_boarding_reviews', JSON.stringify(defaultReviews));
    }
  }, []);

  const handleReviewChange = (e) => {
    setReviewForm({
      ...reviewForm,
      [e.target.name]: e.target.value
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (reviewForm.name && reviewForm.comment) {
      const updatedReviews = [reviewForm, ...reviews];
      setReviews(updatedReviews);
      localStorage.setItem('pet_boarding_reviews', JSON.stringify(updatedReviews));
      setReviewForm({ name: '', rating: 5, comment: '' });
    }
  };

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      // Fallback to address components if display_name is missing
      if (data && data.address) {
        const { road, suburb, city, town, state } = data.address;
        return [road, suburb, city || town, state].filter(Boolean).join(', ');
      }
      return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  // Forward geocoding function to get coordinates from address
  const geocode = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PetCareApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const addressName = await reverseGeocode(latitude, longitude);
        setFormData((prev) => ({
          ...prev,
          address: addressName
        }));
        setIsLoadingLocation(false);
      },
      () => {
        alert('Unable to fetch your current location. Please check location permissions.');
        setIsLoadingLocation(false);
      }
    );
  };

  const handleOpenMapPicker = () => {
    setShowMapPicker(true);
  };

  const handleCloseMapPicker = () => {
    setShowMapPicker(false);
  };

  // Initialize map when modal opens
  useEffect(() => {
    if (showMapPicker && !mapInstanceRef.current) {
      // Load Leaflet CSS and JS dynamically
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (mapRef.current && !mapInstanceRef.current) {
          // Initialize map centered on a default location (or user's location)
          mapInstanceRef.current = window.L.map(mapRef.current).setView([20.5937, 78.9629], 13); // Default to India center

          // Add OpenStreetMap tiles
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(mapInstanceRef.current);

          // Try to get user's current location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                mapInstanceRef.current.setView([latitude, longitude], 15);
                if (markerRef.current) {
                  mapInstanceRef.current.removeLayer(markerRef.current);
                }
                markerRef.current = window.L.marker([latitude, longitude])
                  .addTo(mapInstanceRef.current);
              },
              () => {
                // If geolocation fails, keep default location
              }
            );
          }

          // Handle map clicks
          mapInstanceRef.current.on('click', async (e) => {
            const { lat, lng } = e.latlng;

            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
            }

            // Add new marker
            markerRef.current = window.L.marker([lat, lng])
              .addTo(mapInstanceRef.current);

            // Get address for clicked location
            const address = await reverseGeocode(lat, lng);
            setFormData((prev) => ({
              ...prev,
              address: address
            }));
          });
        }
      };
      document.body.appendChild(script);

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, [showMapPicker]);

  const handleConfirmMapSelection = () => {
    setShowMapPicker(false);
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    const result = await geocode(searchQuery);

    if (result) {
      // Move map to searched location
      mapInstanceRef.current.setView([result.lat, result.lng], 15);

      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker at searched location
      markerRef.current = window.L.marker([result.lat, result.lng])
        .addTo(mapInstanceRef.current);

      // Update address field
      setFormData((prev) => ({
        ...prev,
        address: result.address
      }));
    } else {
      alert('Location not found. Please try a different search term.');
    }

    setIsSearching(false);
  };

  const calculateTotal = () => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        return days * 800; // ₹800 per day
      }
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pet) return alert('Please select your pet');
    if (!formData.city) return alert('Please select a city');
    if (!formData.address) return alert('Please enter or select a pickup address');
    if (!formData.checkInDate) return alert('Please select a check-in date');
    if (!formData.checkOutDate) return alert('Please select a check-out date');
    if (!formData.dropOffTime) return alert('Please select a drop-off time');
    if (!formData.pickupTime) return alert('Please select a pickup time');

    try {
      // Save enquiry to localStorage for Admin
      const totalPrice = calculateTotal();
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);

      if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date');
        return;
      }

      const newEnquiry = {
        id: 'BK' + Date.now(),
        service: 'Pet Boarding',
        item: {
          name: 'Pet Boarding Service',
          price: `₹${totalPrice}`,
        },
        status: 'Pending Approval',
        date: new Date().toISOString(),
        petName: formData.pet,
        details: {
          address: formData.address,
          city: formData.city,
          checkIn: formData.checkInDate,
          checkOut: formData.checkOutDate,
          dropOff: formData.dropOffTime,
          pickup: formData.pickupTime,
          totalDays: Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
        }
      };

      const success = saveBooking(newEnquiry);

      // Sync to Supabase trainings table for Admin visibility
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error: syncError } = await supabase.from('trainings').insert({
            owner_id: session.user.id,
            pet_name: formData.pet,
            training_type: 'Pet Boarding Service',
            status: 'Pending'
          });
          if (syncError) console.error('Supabase boarding sync error:', syncError.message);
        }
      } catch (e) {
        console.error('Supabase boarding sync exception:', e);
      }

      if (success) {
        navigate('/payment', {
          state: {
            serviceType: 'Pet Boarding',
            petType: 'Dog',
            petName: formData.pet,
            address: formData.address,
            item: {
              name: 'Pet Boarding Service',
              price: `₹${totalPrice}`,
              duration: `${Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))} days`
            },
            shippingCharge: 0,
            total: `₹${totalPrice}`,
            backTo: '/services/boarding'
          }
        });
      } else {
        alert('Failed to send enquiry. Please clear your browser data or old Lost & Found reports to free up space.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="boarding-page">
      <div className="boarding-glass-bg"></div>
      <div className="boarding-container">
        <header className="boarding-header">
          <button className="back-btn-v2" onClick={() => navigate('/home')}>
            <span className="icon">←</span> Back
          </button>
          <h1 className="premium-title">Pet Boarding<span>🏠</span></h1>
        </header>

        <div className="boarding-content">
          <form onSubmit={handleSubmit} className="boarding-form">
            <div className="form-section">
              <h2>Select Your Pet</h2>
              <select
                name="pet"
                value={formData.pet}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Choose your pet</option>
                {pets.map((pet, index) => (
                  <option key={index} value={pet.name}>
                    {pet.name} ({pet.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <h2>Select City</h2>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Choose city</option>
                <option value="Udupi">Udupi</option>
                <option value="Mangalore">Mangalore</option>
                <option value="Kundapura">Kundapura</option>
              </select>
            </div>

            <div className="form-section">
              <h2>Pickup/Drop-off Address</h2>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                required
                className="form-input"
                rows="3"
              />
              <div className="address-actions">
                <button
                  type="button"
                  className="use-location-btn"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? 'Loading...' : 'Use Current Location'}
                </button>
                <button
                  type="button"
                  className="use-location-btn"
                  onClick={handleOpenMapPicker}
                >
                  Select Address on Map
                </button>
              </div>
            </div>

            {/* Map Picker Modal */}
            {showMapPicker && (
              <div className="map-picker-modal">
                <div className="map-picker-content">
                  <div className="map-picker-header">
                    <h3>Select Address on Map</h3>
                    <button className="close-map-btn" onClick={handleCloseMapPicker}>
                      ×
                    </button>
                  </div>
                  <div className="map-search-container">
                    <form onSubmit={handleSearchLocation} className="map-search-form">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a place, address, or landmark..."
                        className="map-search-input"
                      />
                      <button
                        type="submit"
                        className="map-search-btn"
                        disabled={isSearching || !searchQuery.trim()}
                      >
                        {isSearching ? 'Searching...' : '🔍'}
                      </button>
                    </form>
                  </div>
                  <div className="map-picker-instructions">
                    <p>Search for a location or click on the map to select your address</p>
                  </div>
                  <div ref={mapRef} className="map-container" style={{ height: '400px', width: '100%' }} />
                  <div className="map-picker-footer">
                    <button className="confirm-map-btn" onClick={handleConfirmMapSelection}>
                      Confirm Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-section">
                <h2>Check-in Date</h2>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-section">
                <h2>Check-out Date</h2>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-section">
                <h2>Drop-off Time</h2>
                <input
                  type="time"
                  name="dropOffTime"
                  value={formData.dropOffTime}
                  onChange={handleChange}
                  min="08:00"
                  max="21:00"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-section">
                <h2>Pickup Time</h2>
                <input
                  type="time"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  min="08:00"
                  max="21:00"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="summary-section">
              <h2>Summary</h2>
              <div className="summary-details">
                <div className="summary-item">
                  <span>Pet:</span>
                  <span>{formData.pet || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span>City:</span>
                  <span>{formData.city || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span>Check-in:</span>
                  <span>{formData.checkInDate || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span>Check-out:</span>
                  <span>{formData.checkOutDate || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span>Total Days:</span>
                  <span>
                    {formData.checkInDate && formData.checkOutDate
                      ? Math.ceil((new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24))
                      : 0} days
                  </span>
                </div>
                <div className="summary-item total">
                  <span>Estimated Total:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">Send Enquiry</button>
          </form>

          {/* Reviews Section */}
          <section className="reviews-section-v2">
            <h2 className="section-title"><span>💬</span> Service Reviews</h2>
            <div className="reviews-grid-v2">
              {reviews.map((review, index) => (
                <div key={index} className="review-card-v2">
                  <div className="review-header-v2">
                    <h4>{review.name}</h4>
                    <div className="stars">{'⭐'.repeat(review.rating)}</div>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="add-review-v2">
              <h3>Share Your Experience</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="review-inputs-v2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={reviewForm.name}
                    onChange={handleReviewChange}
                    required
                  />
                  <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                    {[5, 4, 3, 2, 1].map(num => (
                      <option key={num} value={num}>{num} Stars</option>
                    ))}
                  </select>
                </div>
                <textarea
                  name="comment"
                  placeholder="How was our service?"
                  value={reviewForm.comment}
                  onChange={handleReviewChange}
                  required
                ></textarea>
                <button type="submit">Post Review</button>
              </form>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PetBoarding;

