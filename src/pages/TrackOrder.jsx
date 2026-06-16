import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Footer from '../components/Footer';
import './TrackOrder.css';

function TrackOrder() {
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [review, setReview] = useState({ rating: 5, comment: '', everythingGood: 'Yes', image: null });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load initial order and booking history from various storage sources on mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 1. Load Local Data
                const localOrders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
                const localBookings = JSON.parse(localStorage.getItem('petcare_bookings') || '[]');
                const storedReviews = JSON.parse(localStorage.getItem('petcare_reviews') || '[]');
                setReviews(storedReviews);

                // 2. Load Supabase Data if logged in
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const userId = session.user.id;

                    // Fetch Orders (Medical Shop)
                    const { data: dbOrders } = await supabase.from('orders').select('*').eq('user_id', userId);
                    const formattedDbOrders = (dbOrders || []).map(o => ({
                        id: o.id,
                        type: o.service_type || 'Medical Shop',
                        total: `₹${parseFloat(o.amount || 0).toLocaleString('en-IN')}`,
                        status: o.status || 'Pending',
                        date: o.date || o.created_at,
                        isFromDb: true
                    }));

                    // Fetch Appointments (Doctor)
                    const { data: dbAppointments } = await supabase.from('appointments').select('*').eq('owner_id', userId);
                    const formattedDbAppointments = (dbAppointments || []).map(a => ({
                        id: a.id,
                        service: a.service,
                        petName: a.pet_name,
                        status: a.status || 'Pending',
                        date: a.date || a.created_at,
                        isFromDb: true
                    }));

                    // Fetch Trainings (Grooming/Training/Boarding)
                    const { data: dbTrainings } = await supabase.from('trainings').select('*').eq('owner_id', userId);
                    const formattedDbTrainings = (dbTrainings || []).map(t => ({
                        id: t.id,
                        service: t.training_type,
                        petName: t.pet_name,
                        status: t.status || 'Pending',
                        date: t.date || t.created_at,
                        isFromDb: true
                    }));

                    // Merge and Deduplicate (Supabase IDs are numbers, Local are strings like ORD...)
                    setOrders([...formattedDbOrders, ...localOrders]);
                    setBookings([...formattedDbAppointments, ...formattedDbTrainings, ...localBookings]);
                } else {
                    setOrders(localOrders);
                    setBookings(localBookings);
                }
            } catch (error) {
                console.error('Error fetching trade/booking data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const getExistingReview = (orderId) => {
        return reviews.find(r => r.orderId === orderId);
    };

    // Launch the review dialog, pre-loading existing feedback if the user has already shared their thoughts
    const handleOpenReview = (order) => {
        const existing = getExistingReview(order.id);
        setCurrentOrder(order);
        if (existing) {
            setReview({
                rating: existing.rating,
                comment: existing.comment,
                everythingGood: existing.everythingGood || 'Yes',
                image: existing.image
            });
        } else {
            setReview({ rating: 5, comment: '', everythingGood: 'Yes', image: null });
        }
        setShowReviewModal(true);
    };

    // Convert the selected image into a data URL for instant previewing and storage
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReview({ ...review, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const submitReview = () => {
        if (!review.comment) {
            alert('Please enter a comment');
            return;
        }

        const storedReviews = JSON.parse(localStorage.getItem('petcare_reviews') || '[]');
        const existingIndex = storedReviews.findIndex(r => r.orderId === currentOrder.id);

        const newReview = {
            ...review,
            orderId: currentOrder.id,
            productName: currentOrder.type === 'Medical Shop' ? 'Medical Products' : (currentOrder.service || currentOrder.doctorName),
            date: new Date().toISOString()
        };

        let updatedReviews;
        if (existingIndex !== -1) {
            updatedReviews = [...storedReviews];
            updatedReviews[existingIndex] = newReview;
        } else {
            updatedReviews = [newReview, ...storedReviews];
        }

        localStorage.setItem('petcare_reviews', JSON.stringify(updatedReviews));
        setReviews(updatedReviews);
        alert('Review saved successfully! Thank you for your feedback.');
        setShowReviewModal(false);
        setReview({ rating: 5, comment: '', everythingGood: 'Yes', image: null });
    };

    return (
        <div className="track-order-container">
            <div className="track-header">
                <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
                <h1>Track Your Orders & Bookings</h1>
            </div>

            <div className="track-content">
                {loading ? (
                    <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
                        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid white', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                        <p>Syncing your orders from cloud...</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <>
                        <section className="track-section">
                            <h2>🛒 Medical Shop Orders</h2>
                            {orders.length === 0 ? (
                                <p className="no-data">No orders found.</p>
                            ) : (
                                <div className="order-list">
                            {orders.map((order) => (
                                <div key={order.id} className="order-card">
                                    <div className="order-info">
                                        <h3>Order #{order.id}</h3>
                                        <p>Status: <span className={`status ${order.status.toLowerCase().replace(/\s/g, '-')}`}>{order.status}</span></p>
                                        <p>Total: {order.total}</p>
                                        <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="track-btn"
                                            onClick={() => {
                                                setTrackingOrder(order);
                                                setShowTrackingModal(true);
                                            }}
                                        >
                                            Track
                                        </button>
                                        {order.status === 'Delivered' && (
                                            <button
                                                className="review-btn"
                                                onClick={() => handleOpenReview(order)}
                                                style={getExistingReview(order.id) ? { background: '#6c5ce7' } : {}}
                                            >
                                                {getExistingReview(order.id) ? 'Edit Review' : 'Write Review'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="track-section">
                    <h2>📅 Service Bookings</h2>
                    {bookings.length === 0 ? (
                        <p className="no-data">No bookings found.</p>
                    ) : (
                        <div className="order-list">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="order-card">
                                    <div className="order-info">
                                        <h3>{booking.service}</h3>
                                        <p>Pet: {booking.petName}</p>
                                        <p>Status: <span className={`status ${booking.status.toLowerCase().replace(/\s/g, '-')}`}>{booking.status}</span></p>
                                        <p>Date: {new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="order-actions">
                                        <button
                                            className="track-btn"
                                            onClick={() => {
                                                setTrackingOrder(booking);
                                                setShowTrackingModal(true);
                                            }}
                                        >
                                            Track
                                        </button>
                                        {(booking.status === 'Completed' || booking.status === 'Dropped') && (
                                            <button
                                                className="review-btn"
                                                onClick={() => handleOpenReview(booking)}
                                                style={getExistingReview(booking.id) ? { background: '#6c5ce7' } : {}}
                                            >
                                                {getExistingReview(booking.id) ? 'Edit Review' : 'Write Review'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </>
        )}
    </div>

            {showReviewModal && (
                <div className="modal-overlay">
                    <div className="review-modal">
                        <h2>{getExistingReview(currentOrder?.id) ? 'Edit Your Review' : 'Write a Review'}</h2>
                        <div className="form-group">
                            <label>Is everything good?</label>
                            <div className="radio-group" style={{ display: 'flex', gap: '15px', color: 'white', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                        type="radio"
                                        name="everythingGood"
                                        value="Yes"
                                        checked={review.everythingGood === 'Yes'}
                                        onChange={(e) => setReview({ ...review, everythingGood: e.target.value })}
                                    /> Yes
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                        type="radio"
                                        name="everythingGood"
                                        value="No"
                                        checked={review.everythingGood === 'No'}
                                        onChange={(e) => setReview({ ...review, everythingGood: e.target.value })}
                                    /> No
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Rating</label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${review.rating >= star ? 'active' : ''}`}
                                        onClick={() => setReview({ ...review, rating: star })}
                                        style={{ transition: '0.2s transform' }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Comment</label>
                            <textarea
                                placeholder="Share your experience..."
                                value={review.comment}
                                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Upload Image</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {review.image && <img src={review.image} alt="Preview" className="image-preview" />}
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowReviewModal(false)}>Cancel</button>
                            <button className="submit-btn" onClick={submitReview}>
                                {getExistingReview(currentOrder?.id) ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showTrackingModal && trackingOrder && (
                <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
                    <div className="tracking-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Track Order #{trackingOrder.id}</h2>
                            <button className="close-btn" onClick={() => setShowTrackingModal(false)}>&times;</button>
                        </div>
                        <div className="tracking-body">
                            <div className="stepper">
                                {(() => {
                                    const isBooking = !!trackingOrder.service;
                                    const stepsArray = isBooking ? [
                                        { label: 'Accepted', status: 'Accepted', icon: '✅' },
                                        { label: 'Picked Up', status: 'Picked Up', icon: '🚗' },
                                        { label: 'WIP', status: 'Work In Progress', icon: '⚙️' },
                                        { label: 'Returning', status: 'Returning', icon: '🚙' },
                                        { label: 'Dropped', status: 'Dropped', icon: '🏠' }
                                    ] : [
                                        { label: 'Confirmed', status: 'Pending Approval', icon: '✅' },
                                        { label: 'Processed', status: 'Processing', icon: '📦' },
                                        { label: 'Shipped', status: 'Shipped', icon: '🚚' },
                                        { label: 'Delivered', status: 'Delivered', icon: '🏠' }
                                    ];
                                    const statuses = stepsArray.map(s => s.status);
                                    const terminalStatus = isBooking ? 'Dropped' : 'Delivered';

                                    return stepsArray.map((step, index, arr) => {
                                        const currentStatusIndex = statuses.indexOf(trackingOrder.status);
                                        const stepIndex = statuses.indexOf(step.status);

                                        let state = 'upcoming';
                                        if (stepIndex < currentStatusIndex || trackingOrder.status === terminalStatus) state = 'completed';
                                        else if (stepIndex === currentStatusIndex) state = 'current';

                                        if (currentStatusIndex === -1 && trackingOrder.status !== terminalStatus) {
                                            if (index === 0) state = 'completed';
                                        }

                                        return (
                                            <div key={step.label} className={`step ${state}`}>
                                                <div className="step-icon-container">
                                                    <div className="step-icon">{step.icon}</div>
                                                    {index < arr.length - 1 && <div className="step-connector"></div>}
                                                </div>
                                                <div className="step-content">
                                                    <span className="step-label">{step.label}</span>
                                                    <span className="step-desc">
                                                        {state === 'completed' ? 'Completed' : state === 'current' ? 'In Progress' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="order-details-summary">
                                <div className="detail-item">
                                    <span>{trackingOrder.service ? 'Service Type' : 'Estimate Delivery'}</span>
                                    <strong>{trackingOrder.service || '2-3 Business Days'}</strong>
                                </div>
                                <div className="detail-item">
                                    <span>{trackingOrder.service ? 'Location / Address' : 'Shipping Address'}</span>
                                    <p>{trackingOrder.details?.address || trackingOrder.shippingAddress || 'Address not found'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default TrackOrder;
