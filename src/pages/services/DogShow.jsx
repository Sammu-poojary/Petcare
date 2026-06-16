import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import './DogShow.css';

function DogShow() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dogName: '',
    breed: '',
    age: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    showDate: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [dynamicReviews, setDynamicReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    comment: ''
  });
  const [showDates, setShowDates] = useState([]);

  useEffect(() => {
    const savedDates = JSON.parse(localStorage.getItem('dog_show_dates') || '[]');
    setShowDates(savedDates);

    const savedReviews = localStorage.getItem('dog_show_reviews');
    if (savedReviews) {
      setDynamicReviews(JSON.parse(savedReviews));
    } else {
      const defaultReviews = [
        { name: 'Rahul Mehta', rating: 5, comment: 'Amazing experience! My dog won first place!' },
        { name: 'Sneha Patel', rating: 5, comment: 'Well organized event. Highly recommended!' },
        { name: 'Amit Kumar', rating: 4, comment: 'Great show, professional judges.' }
      ];
      setDynamicReviews(defaultReviews);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'ownerPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, ownerPhone: digitsOnly });
      if (phoneError) setPhoneError('');
      return;
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleReviewChange = (e) => {
    setReviewForm({
      ...reviewForm,
      [e.target.name]: e.target.value
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (reviewForm.name && reviewForm.comment) {
      const updatedReviews = [reviewForm, ...dynamicReviews];
      setDynamicReviews(updatedReviews);
      localStorage.setItem('dog_show_reviews', JSON.stringify(updatedReviews));
      setReviewForm({ name: '', rating: 5, comment: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.dogName && formData.breed && formData.age &&
      formData.ownerName && formData.ownerEmail && formData.ownerPhone && formData.showDate) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.ownerPhone)) {
        setPhoneError('Please enter a valid 10-digit mobile number');
        return;
      }
      // Save to Service Desk (Admin Dashboard)
      const newBooking = {
        id: Date.now(),
        petName: formData.dogName,
        service: `Dog Show Registration (${formData.breed})`,
        date: new Date().toISOString(),
        status: 'Pending',
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        age: formData.age,
        showDate: formData.showDate
      };
      const existing = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
      localStorage.setItem('appointments_guest', JSON.stringify([...existing, newBooking]));

      alert('Registration confirmed! We will send you confirmation details via email.');
      navigate('/home');
    } else {
      alert('Please fill in all fields');
    }
  };

  return (
    <div className="dogshow-container">
      <div className="dogshow-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Dog Show 2026</h1>
      </div>

      <div className="dogshow-content">
        <div className="reviews-section">
          <h2><span>💬</span> Recent Reviews</h2>
          <div className="reviews-list">
            {dynamicReviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <h4>{review.name}</h4>
                  <div className="review-rating">
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                <p>{review.comment}</p>
              </div>
            ))}
          </div>

          <div className="leave-review">
            <h3>Leave a Review</h3>
            <form onSubmit={handleReviewSubmit} className="review-mini-form">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={reviewForm.name}
                onChange={handleReviewChange}
                required
              />
              <div className="rating-select">
                <label>Rating:</label>
                <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>
              <textarea
                name="comment"
                placeholder="Share your experience..."
                value={reviewForm.comment}
                onChange={handleReviewChange}
                required
              ></textarea>
              <button type="submit" className="post-review-btn">Post Review</button>
            </form>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="dogshow-form">
          <h2><span>📜</span> Registration Form</h2>

          <div className="form-section">
            <h3><span>🐾</span> Dog Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Dog Name</label>
                <input
                  type="text"
                  name="dogName"
                  value={formData.dogName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Buddy"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Breed</label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Golden Retriever"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Age (Years)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="0"
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div className="form-section">
            <h3><span>👤</span> Owner Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                placeholder="Your Name"
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  required
                  placeholder="Enter 10-digit mobile number"
                  className={`form-input ${phoneError ? 'input-error' : ''}`}
                  maxLength="10"
                />
                {phoneError && <span className="field-error">{phoneError}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><span>📅</span> Show Details</h3>
            <div className="form-group">
              <label>Select Show Date</label>
              <select
                name="showDate"
                value={formData.showDate}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">Select an upcoming show</option>
                {showDates.length > 0 ? (
                  showDates.map((date, idx) => (
                    <option key={idx} value={date}>
                      {new Date(date).toDateString()}
                    </option>
                  ))
                ) : (
                  <option disabled>No upcoming shows scheduled</option>
                )}
              </select>
            </div>
          </div>

          <button type="submit" className="confirm-btn">Confirm Registration</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default DogShow;

