import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import './BookingSummary.css';

function BookingSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;

  if (!booking) {
    navigate('/home', { replace: true });
    return null;
  }

  const { serviceType, petType, item } = booking;
  const [address, setAddress] = useState(booking.address || '');
  const [includeFood, setIncludeFood] = useState(false);

  const extractWeeks = (durationStr) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/(\d+)(?:-(\d+))?\s*(week|day|month)s?/i);
    if (match) {
      const val1 = parseInt(match[1], 10);
      const val2 = match[2] ? parseInt(match[2], 10) : val1;
      const unit = match[3].toLowerCase();
      
      let weeks = val2;
      if (unit === 'day') weeks = Math.ceil(val2 / 7);
      if (unit === 'month') weeks = val2 * 4;
      return weeks;
    }
    return 0;
  };

  const foodWeeks = extractWeeks(item?.duration);
  const foodPricePerWeek = 200;
  const foodPrice = includeFood ? foodWeeks * foodPricePerWeek : 0;

  const isEligibleForShipping = ['Pet Training', 'Pet Grooming', 'Pet Walking', 'Pet Sitting'].includes(serviceType);
  const shippingCharge = isEligibleForShipping ? (petType === 'Horse' ? 999 : 500) : 0;
  
  let basePriceNum = 0;
  if (item?.price) {
    basePriceNum = parseInt(item.price.replace(/\D/g, ''), 10) || 0;
  }
  const totalPrice = basePriceNum + shippingCharge + foodPrice;
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const needsAddress = ['Pet Grooming', 'Pet Training'].includes(serviceType);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      if (data && data.display_name) return data.display_name;
      return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const geocode = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'PetCareApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported.');
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);
        setIsLoadingLocation(false);
      },
      () => {
        alert('Unable to fetch location.');
        setIsLoadingLocation(false);
      }
    );
  };

  useEffect(() => {
    if (showMapPicker && !mapInstanceRef.current) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = window.L.map(mapRef.current).setView([20.5937, 78.9629], 13);
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              mapInstanceRef.current.setView([latitude, longitude], 15);
              markerRef.current = window.L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
            });
          }

          mapInstanceRef.current.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
            const addr = await reverseGeocode(lat, lng);
            setAddress(addr);
          });
        }
      };
      document.body.appendChild(script);
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [showMapPicker]);

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    setIsSearching(true);
    const result = await geocode(searchQuery);
    if (result) {
      mapInstanceRef.current.setView([result.lat, result.lng], 15);
      if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = window.L.marker([result.lat, result.lng]).addTo(mapInstanceRef.current);
      setAddress(result.address);
    } else {
      alert('Location not found.');
    }
    setIsSearching(false);
  };

  const getServiceDescription = () => {
    switch (serviceType) {
      case 'Pet Grooming':
        return 'Our professional grooming service includes a complete pampering session for your beloved pet. Our experienced groomers use premium products and gentle techniques to ensure your pet looks and feels their best. The service includes bathing, brushing, nail trimming, and styling tailored to your pet\'s breed and needs.';

      case 'Pet Training':
        return 'Our comprehensive training program is designed to help your pet develop good behavior, learn essential commands, and build a stronger bond with you. Our certified trainers use positive reinforcement techniques and create a customized training plan based on your pet\'s age, breed, and specific needs.';

      case 'Pet Walking':
        return 'Regular walks are essential for your pet\'s physical and mental well-being. Our trusted and experienced pet walkers provide safe, enjoyable walking sessions that keep your pet active and happy. Each walk is tailored to your pet\'s energy level and requirements.';

      case 'Pet Boarding':
        return 'Give your pet a home away from home experience with our premium boarding facility. Your pet will receive personalized care, comfortable accommodations, regular exercise, and plenty of attention while you\'re away. Our facility is clean, safe, and staffed with trained professionals who love animals.';

      case 'Consult Doctor':
        return 'Get expert veterinary advice and consultation for your pet\'s health concerns. Our qualified veterinarians are available to answer your questions, provide diagnoses, recommend treatments, and guide you on the best care practices for your pet\'s well-being.';

      case 'Dog Show':
        return 'Participate in fun and exciting dog shows and competitions. These events provide a great opportunity for your pet to socialize, showcase their talents, and compete with other dogs in a friendly and supportive environment. Perfect for building confidence and having fun together.';

      case 'Medical Shop':
        return 'Access a wide range of pet care products, medicines, food, and accessories all in one place. Our medical shop offers quality products from trusted brands to keep your pet healthy and happy. All products are carefully selected to meet the highest standards of pet care.';

      default:
        return 'This service is designed to provide the best care and experience for your pet. Our team of professionals is dedicated to ensuring your pet receives top-quality service tailored to their individual needs.';
    }
  };

  const handleProceedToPayment = () => {
    if (needsAddress && !address) {
      alert('Please provide a pickup address');
      return;
    }
    navigate('/payment', { 
      state: { 
        ...booking, 
        address, 
        shippingCharge,
        foodPrice,
        includeFood,
        total: `₹${totalPrice}`
      } 
    });
  };

  const handleBack = () => {
    if (booking.backTo) {
      navigate(booking.backTo, { state: { petType } });
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="booking-summary-container">
      <div className="booking-summary-card">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <h1>Booking Summary</h1>
        <p className="summary-subtitle">
          Please review your booking details before making payment.
        </p>

        <div className="summary-section">
          <h2>Service Details</h2>
          <div className="summary-row">
            <span>Service:</span>
            <span>{serviceType}</span>
          </div>
          <div className="summary-row">
            <span>Selected Package:</span>
            <span>{item?.name}</span>
          </div>
          {item?.duration && (
            <div className="summary-row">
              <span>Duration:</span>
              <span>{item.duration}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Estimated Price:</span>
            <span>{item?.price}</span>
          </div>
          {shippingCharge > 0 && (
            <div className="summary-row">
              <span>Shipping Charges:</span>
              <span>₹{shippingCharge}</span>
            </div>
          )}
          {item?.duration && foodWeeks > 0 && (
            <div className="summary-row food-option-row">
              <div className="food-option-label">
                <input 
                  type="checkbox" 
                  id="includeFood" 
                  checked={includeFood} 
                  onChange={(e) => setIncludeFood(e.target.checked)}
                />
                <label htmlFor="includeFood">Include Food (₹200/week)</label>
              </div>
              <span>₹{foodWeeks * foodPricePerWeek}</span>
            </div>
          )}
          {(shippingCharge > 0 || foodPrice > 0) && (
            <div className="summary-row" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>Total Price:</span>
              <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>₹{totalPrice}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Pet Name:</span>
            <span>{booking.petName || 'My Pet'}</span>
          </div>
          <div className="summary-row">
            <span>Pet Type:</span>
            <span>{petType}</span>
          </div>
        </div>

        {needsAddress && (
          <div className="summary-section address-entry">
            <h2>Pickup Address</h2>
            <p className="summary-hint" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
              Our professional team will pick up your pet from this location.
            </p>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address for pet pickup"
              className="address-textarea"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem', marginBottom: '15px', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div className="address-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleUseCurrentLocation}
                className="address-sub-btn"
                disabled={isLoadingLocation}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #667eea', color: '#667eea', background: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                {isLoadingLocation ? 'Locating...' : 'Use My Current Location'}
              </button>
              <button
                onClick={() => setShowMapPicker(true)}
                className="address-sub-btn"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #667eea', color: '#667eea', background: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Select on Map
              </button>
            </div>
          </div>
        )}

        {showMapPicker && (
          <div className="map-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#333' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Pin Your Location</h3>
                <button onClick={() => setShowMapPicker(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '15px' }}>
                <form onSubmit={handleSearchLocation} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, area, or street..."
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <button type="submit" disabled={isSearching} style={{ padding: '10px 20px', borderRadius: '8px', background: '#667eea', color: 'white', border: 'none', cursor: 'pointer' }}>
                    {isSearching ? '...' : 'Search'}
                  </button>
                </form>
              </div>
              <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>
              <div style={{ padding: '20px', background: '#f9f9f9', textAlign: 'center' }}>
                <button onClick={() => setShowMapPicker(false)} style={{ padding: '12px 30px', borderRadius: '10px', background: '#667eea', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Confirm Location</button>
              </div>
            </div>
          </div>
        )}

        <div className="summary-section">
          <h2>About This Service</h2>
          <p className="service-description">
            {getServiceDescription()}
          </p>
        </div>

        <div className="summary-actions">
          <button className="edit-btn" onClick={handleBack}>
            Edit Selection
          </button>
          <button className="proceed-btn" onClick={handleProceedToPayment}>
            Proceed to Payment
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default BookingSummary;


