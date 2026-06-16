import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Footer from '../../components/Footer';
import './PetWalking.css';
import { saveBooking } from '../../utils/storage';

function PetWalking() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pet: '',
    address: '',
    packageType: '',
    scheduleDate: '',
    scheduleTime: '',
    notes: ''
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [pets, setPets] = useState([]);

  const packages = [
    { name: 'Single Walk', price: '₹300', duration: '30 minutes' },
    { name: 'Daily Package', price: '₹1600', duration: '7 days' },
    { name: 'Weekly Package', price: '₹5000', duration: '4 weeks' },
    { name: 'Monthly Package', price: '₹15000', duration: '1 month' }
  ];

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
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pet) return alert('Please select your pet');
    if (!formData.address) return alert('Please enter or select a pickup address');
    if (!formData.packageType) return alert('Please choose a package');
    if (!formData.scheduleDate || !formData.scheduleTime) return alert('Please select a schedule date and time');

    if (formData.scheduleTime < '08:00' || formData.scheduleTime > '21:00') {
      return alert('we are not providing the service before 8am and after 9pm. please fix it');
    }

    // Save enquiry to localStorage for Admin
    const pkg = packages.find(p => p.name === formData.packageType);

    if (!pkg) {
      alert('Invalid package selected');
      return;
    }

    const newEnquiry = {
      id: 'BK' + Date.now(),
      service: 'Pet Walking',
      item: {
        name: pkg.name,
        price: pkg.price,
        duration: pkg.duration
      },
      status: 'Pending Approval',
      date: new Date().toISOString(),
      petName: formData.pet,
      details: {
        address: formData.address,
        schedule: `${formData.scheduleDate}T${formData.scheduleTime}`,
        notes: formData.notes
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
          training_type: `Pet Walking (${formData.packageType})`,
          status: 'Pending'
        });
        if (syncError) console.error('Supabase walking sync error:', syncError.message);
      }
    } catch (e) {
      console.error('Supabase walking sync exception:', e);
    }

    if (success) {
      navigate('/payment', {
        state: {
          serviceType: 'Pet Walking',
          petType: 'Dog',
          petName: formData.pet,
          address: formData.address,
          item: {
            name: pkg.name,
            price: pkg.price,
            duration: pkg.duration
          },
          shippingCharge: 500,
          total: `₹${parseInt(pkg.price.replace(/\D/g, ''), 10) + 500}`,
          backTo: '/services/walking'
        }
      });
    } else {
      alert('Failed to send enquiry. Please clear your browser data or old Lost & Found reports to free up space.');
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="walking-container">
      <div className="walking-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Pet Walking Service</h1>
      </div>

      <div className="walking-content">
        <form onSubmit={handleSubmit} className="walking-form">
          <div className="form-section">
            <h2><span>🐾</span> Select Your Pet</h2>
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
            <h2><span>🏠</span> Pickup Address</h2>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address for pet pickup"
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

          <div className="form-section">
            <h2><span>🎁</span> Choose Package</h2>
            <div className="packages-grid">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`package-card ${formData.packageType === pkg.name ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, packageType: pkg.name })}
                >
                  <h3>{pkg.name}</h3>
                  <div className="package-price">{pkg.price}</div>
                  <div className="package-duration">{pkg.duration}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2><span>📅</span> Schedule</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                name="scheduleDate"
                value={formData.scheduleDate}
                onChange={handleChange}
                required
                className="form-input"
                min={minDateStr}
              />
              <input
                type="time"
                name="scheduleTime"
                value={formData.scheduleTime}
                onChange={handleChange}
                min="08:00"
                max="21:00"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h2><span>📝</span> Notes for Walker</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions or notes for the walker..."
              className="form-input"
              rows="4"
            />
          </div>

          <button type="submit" className="submit-btn">Send Enquiry</button>
        </form>

        {/* Pet Walking Videos Section */}
        <div className="walking-videos-section">
          <h2 className="walking-videos-title">Our Pet Walking Services</h2>
          <div className="walking-videos-container">
            <div className="walking-video-item">
              <video
                src="/videos/petwalk1.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="walking-video"
              />
            </div>
            <div className="walking-video-item">
              <video
                src="/videos/petwalk2.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="walking-video"
              />
            </div>
            
           
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PetWalking;

