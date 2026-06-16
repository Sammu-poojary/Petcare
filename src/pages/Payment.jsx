import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { addNotification, requestNotificationPermission } from '../utils/notifications';
import { saveBooking } from '../utils/storage';
import { supabase } from '../supabase';
import Footer from '../components/Footer';
import './Payment.css';

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;
  const [method, setMethod] = useState('upi');
  const [card, setCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoModalStep, setDemoModalStep] = useState('selection');
  const [includeFood, setIncludeFood] = useState(booking?.includeFood || false);

  const extractWeeks = (durationStr) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/(\d+)(?:-(\d+))?\s*(week|day|month)s?/i);
    if (match) {
      const val2 = match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
      const unit = match[3].toLowerCase();
      if (unit === 'day') return Math.ceil(val2 / 7);
      if (unit === 'month') return val2 * 4;
      return val2;
    }
    return 0;
  };

  // Check if Razorpay script is loaded
  useEffect(() => {
    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
    } else {
      // Wait for script to load
      const checkRazorpay = setInterval(() => {
        if (window.Razorpay) {
          setIsRazorpayLoaded(true);
          clearInterval(checkRazorpay);
        }
      }, 100);
      return () => clearInterval(checkRazorpay);
    }
  }, []);

  if (!booking) {
    navigate('/home', { replace: true });
    return null;
  }

  const { serviceType, item, cart, total, shippingAddress } = booking;
  const isCartPayment = !!cart;

  const foodWeeks = extractWeeks(item?.duration);
  const foodPricePerWeek = 200;
  const foodPrice = includeFood ? foodWeeks * foodPricePerWeek : (booking.foodPrice || 0);

  const basePriceNum = item?.price ? parseInt(item.price.replace(/\D/g, ''), 10) || 0 : 0;
  const shippingNum = booking.shippingCharge || 0;
  const computedTotal = basePriceNum + shippingNum + (includeFood ? foodPrice : 0);
  const displayTotal = computedTotal > 0 ? `₹${computedTotal}` : (total || booking.total || item?.price);

  // Helper function to extract amount from price string
  const extractAmount = (priceString) => {
    if (!priceString) {
      console.error('extractAmount: priceString is empty');
      return 0;
    }
    console.log('extractAmount input:', priceString);
    // Remove ₹, commas, and convert to number
    const num = parseFloat(priceString.toString().replace(/[₹,\s]/g, ''));
    if (isNaN(num)) {
      console.error('extractAmount: Failed to parse number from', priceString);
      return 0;
    }
    // Convert to paise and ensure it's a rounded integer
    const amount = Math.round(num * 100);
    console.log('extractAmount result (paise):', amount);
    return amount;
  };

  // Initialize Razorpay payment (Simulated Demo Mode)
  const initiateRazorpayPayment = async () => {
    const amount = extractAmount(displayTotal);
    if (amount === 0) {
      alert('Invalid amount. Please try again.');
      return;
    }

    console.log('--- REALISTIC DEMO MODE ACTIVATED ---');
    setShowDemoModal(true);
    setDemoModalStep('selection');
  };

  const handleDemoPayment = (method) => {
    if (method === 'upi') {
      setDemoModalStep('upi_input');
    } else {
      setDemoModalStep('processing');
      simulateSuccess();
    }
  };

  const simulateSuccess = () => {
    // Simulate network delay
    setTimeout(() => {
      setDemoModalStep('success');

      setTimeout(() => {
        const mockResponse = {
          razorpay_payment_id: 'pay_DEMO_' + Math.random().toString(36).substr(2, 9),
          razorpay_order_id: 'order_DEMO_' + Math.random().toString(36).substr(2, 9),
          razorpay_signature: 'sig_DEMO_val_mock_123'
        };

        console.log('Demo Payment Successful:', mockResponse);
        setShowDemoModal(false);
        handlePaymentSuccess(mockResponse);
      }, 1500);
    }, 2000);
  };

  // Handle payment success
  const handlePaymentSuccess = async (response) => {
    // Request notification permission if not already granted
    await requestNotificationPermission();

    const paymentMessage = 'UPI payment successful! Your order is confirmed.';
    const notificationTitle = 'Payment Successful';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const orderAmount = parseFloat((total || item?.price || "0").toString().replace(/[₹,\s]/g, ''));
        const cartNames = isCartPayment && cart ? cart.map(c => `${c.name} (x${c.quantity || 1})`).join(', ') : 'Multiple Items';
        const st = serviceType || (isCartPayment ? 'Medical Shop' : 'Service Booking');
        const itemNameRaw = isCartPayment ? cartNames : (item?.name || 'Service Booking');

        const getPetName = () => {
          try {
            if (booking.petName) return booking.petName;
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('pets_')) {
                const pets = JSON.parse(localStorage.getItem(key) || '[]');
                if (pets.length > 0) return pets[0].name;
              }
            }
          } catch (e) {}
          return booking.petName || 'My Pet';
        };

        let tableName = 'orders';
        let payload = {};

        if (st === 'Medical Shop') {
          tableName = 'orders';
          payload = {
            user_id: session.user.id,
            service_type: st,
            item_name: itemNameRaw,
            payment_method: 'upi',
            amount: orderAmount,
            date: new Date().toISOString().split('T')[0]
          };
        } else if (st === 'Doctor Consultation' || st === 'Consult Doctor') {
          tableName = 'appointments';
          payload = {
            owner_id: session.user.id,
            pet_name: getPetName(),
            service: `${st} (${itemNameRaw})`,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
          };
        } else {
          tableName = 'trainings';
          payload = {
            owner_id: session.user.id,
            pet_name: getPetName(),
            training_type: itemNameRaw,
            status: 'Pending'
          };
        }

        const { error: insertError } = await supabase.from(tableName).insert(payload);
        if (insertError) {
          console.error(`Supabase ${tableName} insert error:`, insertError.message);
          alert(`Database Sync Error (${tableName}): ` + insertError.message);
        }
      }
    } catch (dbErr) {
      console.error('Order table insert failed:', dbErr);
    }

    // Clear cart if it's a cart payment
    if (isCartPayment) {
      const newOrder = {
        id: 'ORD' + Date.now(),
        type: 'Medical Shop',
        items: cart,
        total: total || item?.price,
        status: 'Pending Approval',
        date: new Date().toISOString(),
        paymentMethod: 'upi',
        customerName: shippingAddress?.fullName || 'Guest User',
        userEmail: shippingAddress ? 'Verified via UPI' : 'guest@example.com',
        shippingAddress: shippingAddress ? `${shippingAddress.fullName}, ${shippingAddress.street}, ${shippingAddress.city} - ${shippingAddress.zip} (Ph: ${shippingAddress.phone})` : null,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      };
      const existingOrders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
      localStorage.setItem('petcare_orders', JSON.stringify([newOrder, ...existingOrders]));
      localStorage.removeItem('medicalShopCart');
    } else {
      // Save service booking
      const getPetName = () => {
        try {
          // Try to get from state first
          if (booking.petName) return booking.petName;

          // Fallback to local storage pets
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('pets_')) {
              const pets = JSON.parse(localStorage.getItem(key) || '[]');
              if (pets.length > 0) return pets[0].name;
            }
          }
        } catch (e) {
          console.warn('getPetName error:', e);
        }
        return booking.petName || 'My Pet';
      };

      const newBooking = {
        id: 'BK' + Date.now(),
        service: serviceType || 'Service',
        item: item || { name: 'Service Booking', price: 'TBD' },
        status: 'Pending Approval',
        date: new Date().toISOString(),
        petName: getPetName(),
        address: booking.address,
        total: booking.total || item?.price,
        shippingCharge: booking.shippingCharge,
        details: { ...booking.item },
        razorpayPaymentId: response.razorpay_payment_id || 'DEMO_ID',
        razorpayOrderId: response.razorpay_order_id || 'DEMO_ORD',
        razorpaySignature: response.razorpay_signature || 'DEMO_SIG',
      };

      console.log('Saving booking to storage:', newBooking);
      saveBooking(newBooking);
    }

    // Send notification
    const notificationMessage = isCartPayment
      ? `${paymentMessage} Order from ${serviceType}. Total: ${total || item?.price || 'N/A'}`
      : `${paymentMessage} Service: ${serviceType} - ${item?.name || 'N/A'}. Amount: ${item?.price || 'N/A'}`;

    addNotification({
      title: notificationTitle,
      message: notificationMessage,
      type: 'payment',
    });

    alert("Payment processed successfully! Your order is waiting for Admin approval.");
    navigate('/home');
  };

  // Handle payment failure
  const handlePaymentFailure = (response) => {
    alert(`Payment failed: ${response.error.description || 'Please try again.'}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Request notification permission if not already granted
    await requestNotificationPermission();

    if (method === 'card' || method === 'upi') {
      // Both Card and UPI are handled via Razorpay
      await initiateRazorpayPayment();
      return;
    } else if (method === 'cod') {
      const paymentMessage = 'Cash on Delivery selected! Please be ready with cash at delivery.';
      const notificationTitle = 'Cash on Delivery';
      await handleOrderCreation(method, paymentMessage, notificationTitle);
    }
  };

  const handleOrderCreation = async (paymentMethod, paymentMessage, notificationTitle) => {
    // Shared order/booking logic
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const orderAmount = parseFloat((total || item?.price || "0").toString().replace(/[₹,\s]/g, ''));
        const cartNames = isCartPayment && cart ? cart.map(c => `${c.name} (x${c.quantity || 1})`).join(', ') : 'Multiple Items';
        const st = serviceType || (isCartPayment ? 'Medical Shop' : 'Service Booking');
        const itemNameRaw = isCartPayment ? cartNames : (item?.name || 'Service Booking');

        const getPetName = () => {
          try {
            if (booking.petName) return booking.petName;
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('pets_')) {
                const pets = JSON.parse(localStorage.getItem(key) || '[]');
                if (pets.length > 0) return pets[0].name;
              }
            }
          } catch (e) {}
          return booking.petName || 'My Pet';
        };

        let tableName = 'orders';
        let payload = {};

        if (st === 'Medical Shop') {
          tableName = 'orders';
          payload = {
            user_id: session.user.id,
            service_type: st,
            item_name: itemNameRaw,
            payment_method: paymentMethod,
            amount: orderAmount,
            date: new Date().toISOString().split('T')[0]
          };
        } else if (st === 'Doctor Consultation' || st === 'Consult Doctor') {
          tableName = 'appointments';
          payload = {
            owner_id: session.user.id,
            pet_name: getPetName(),
            service: `${st} (${itemNameRaw})`,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
          };
        } else {
          tableName = 'trainings';
          payload = {
            owner_id: session.user.id,
            pet_name: getPetName(),
            training_type: itemNameRaw,
            status: 'Pending'
          };
        }

        const { error: insertError } = await supabase.from(tableName).insert(payload);
        if (insertError) {
          console.error(`Supabase ${tableName} insert error:`, insertError.message);
          alert(`Database Sync Error (${tableName}): ` + insertError.message);
        }
      } else {
        alert("You are not logged in. Orders will only save locally.");
      }
    } catch (dbErr) {
      console.error('Order table insert exception:', dbErr);
    }

    if (isCartPayment) {
      const newOrder = {
        id: 'ORD' + Date.now(),
        type: 'Medical Shop',
        items: cart,
        total: total || item?.price,
        status: 'Pending Approval',
        date: new Date().toISOString(),
        paymentMethod: paymentMethod,
        customerName: shippingAddress?.fullName || 'Guest User',
        userEmail: shippingAddress ? '(Saved with Address)' : 'guest@example.com',
        shippingAddress: shippingAddress ? `${shippingAddress.fullName}, ${shippingAddress.street}, ${shippingAddress.city} - ${shippingAddress.zip} (Ph: ${shippingAddress.phone})` : null,
      };
      const existingOrders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');
      localStorage.setItem('petcare_orders', JSON.stringify([newOrder, ...existingOrders]));
      localStorage.removeItem('medicalShopCart');
    } else {
      const getPetName = () => {
        try {
          if (booking.petName) return booking.petName;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('pets_')) {
              const pets = JSON.parse(localStorage.getItem(key) || '[]');
              if (pets.length > 0) return pets[0].name;
            }
          }
        } catch (e) {
          console.warn('getPetName error:', e);
        }
        return booking.petName || 'My Pet';
      };

      const newBooking = {
        id: 'BK' + Date.now(),
        service: serviceType || 'Service',
        item: item || { name: 'Service Booking', price: 'N/A' },
        status: 'Pending Approval',
        date: new Date().toISOString(),
        petName: getPetName(),
        address: booking.address,
        paymentMethod: paymentMethod,
        total: booking.total || item?.price,
        shippingCharge: booking.shippingCharge,
        details: { ...booking.item }
      };
      console.log('Saving COD/Fallback booking to storage:', newBooking);
      saveBooking(newBooking);
    }

    const notificationMessage = isCartPayment
      ? `${paymentMessage} Order from ${serviceType}. Total: ${total || item?.price || 'N/A'}`
      : `${paymentMessage} Service: ${serviceType} - ${item?.name || 'N/A'}. Amount: ${item?.price || 'N/A'}`;

    addNotification({
      title: notificationTitle,
      message: notificationMessage,
      type: 'payment',
    });

    alert(paymentMessage + "\nYour order is waiting for Admin approval.");
    navigate('/home');
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1>Payment</h1>
        <p className="payment-subtitle">
          Complete your payment to confirm the booking.
        </p>

        <div className="payment-summary">
          <h2>{isCartPayment ? 'Order Summary' : 'Booking'}</h2>
          <p>{serviceType}</p>
          {isCartPayment ? (
            <>
              <div className="cart-items-summary">
                {cart.map((cartItem) => (
                  <div key={cartItem.id} className="cart-item-summary">
                    <span>{cartItem.name} x {cartItem.quantity}</span>
                    <span>₹{(parseFloat(cartItem.price.replace('₹', '').replace(',', '')) * cartItem.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <p className="payment-amount">{total || item?.price}</p>
            </>
          ) : (
            <>
              <p>{item?.name}</p>
              {/* Food option — show when item has a duration with weeks */}
              {!isCartPayment && foodWeeks > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(102,126,234,0.06)', border: '1px dashed rgba(102,126,234,0.35)', borderRadius: '10px', padding: '10px 14px', margin: '10px 0', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="paymentFoodToggle"
                      checked={includeFood}
                      onChange={(e) => setIncludeFood(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#667eea' }}
                    />
                    <label htmlFor="paymentFoodToggle" style={{ cursor: 'pointer', fontWeight: '600', color: '#444' }}>
                      Include Food (₹200/week &times; {foodWeeks} weeks)
                    </label>
                  </div>
                  <span style={{ fontWeight: '700', color: '#667eea' }}>₹{foodWeeks * foodPricePerWeek}</span>
                </div>
              )}
              {(shippingNum > 0 || foodPrice > 0 || booking.shippingCharge > 0) ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                    <span>Base Price:</span>
                    <span>{item?.price}</span>
                  </div>
                  {shippingNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                      <span>Shipping Charges:</span>
                      <span>₹{shippingNum}</span>
                    </div>
                  )}
                  {includeFood && foodPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#2ecc71' }}>
                      <span>Food Charges:</span>
                      <span>₹{foodPrice}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #eee' }}>
                    <span>Total Amount:</span>
                    <span className="payment-amount" style={{ margin: 0 }}>{displayTotal}</span>
                  </div>
                </>
              ) : (
                <p className="payment-amount">{displayTotal}</p>
              )}
            </>
          )}

          {shippingAddress && (
            <div className="shipping-summary" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#666' }}>Shipping To:</h3>
              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{shippingAddress.fullName}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>{shippingAddress.street}, {shippingAddress.city} - {shippingAddress.zip}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Phone: {shippingAddress.phone}</p>
            </div>
          )}
        </div>

        <form className="payment-form" onSubmit={handleSubmit}>
          <h2>Payment Method</h2>
          <div className="payment-methods">
            <label className={`method-pill ${method === 'upi' ? 'active' : ''}`}>
              <input
                type="radio"
                name="method"
                value="upi"
                checked={method === 'upi'}
                onChange={() => setMethod('upi')}
              />
              UPI
            </label>
            <label className={`method-pill ${method === 'cod' ? 'active' : ''}`}>
              <input
                type="radio"
                name="method"
                value="cod"
                checked={method === 'cod'}
                onChange={() => setMethod('cod')}
              />
              Cash on Delivery
            </label>
          </div>


          {method === 'upi' && (
            <div className="online-payment-hint">
              <p>You can enter your UPI ID or select from available UPI apps when the secure Razorpay gateway opens.</p>
            </div>
          )}

          <button type="submit" className="pay-btn">
            {method === 'cod' ? 'Place Order' : 'Pay Now'}
          </button>
        </form>
      </div>
      <Footer />

      {showDemoModal && (
        <div className="demo-modal-overlay">
          <div className="demo-razorpay-modal">
            <div className="demo-modal-left">
              <div className="demo-modal-logo">
                <div className="demo-logo-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <path d="M16 2.667c7.364 0 13.333 5.97 13.333 13.333S23.364 29.333 16 29.333 2.667 23.364 2.667 16 8.636 2.667 16 2.667zm0 2.666a10.667 10.667 0 100 21.334 10.667 10.667 0 000-21.334zM16 8a1.333 1.333 0 011.333 1.333v2.667L20 12a1.333 1.333 0 110 2.667l-2.667.666v2.667a1.333 1.333 0 11-2.666 0v-2.667L12 14.667a1.333 1.333 0 110-2.667l2.667.667V9.333A1.333 1.333 0 0116 8z" fill="#fff" />
                  </svg>
                </div>
                <span>PetCare</span>
              </div>
              <div className="demo-modal-amount-section">
                <span className="demo-amount-label">Price Summary</span>
                <span className="demo-amount-value">{total || item?.price}</span>
              </div>
              <div className="demo-modal-user">
                <div className="demo-user-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <span>Using as +91 96385 27410</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </div>
              <div className="demo-footer-brand">
                <span>Secured by</span>
                <img src="https://razorpay.com/favicon.png" alt="RZP" />
                <strong>Razorpay</strong>
              </div>
            </div>

            <div className="demo-modal-right">
              <div className="demo-modal-header">
                <span>Payment Options</span>
                <div className="demo-header-actions">
                  <div className="demo-dots">•••</div>
                  <div className="demo-close" onClick={() => setShowDemoModal(false)}>✕</div>
                </div>
              </div>

              {demoModalStep === 'selection' && (
                <div className="demo-selection-area">
                  <div className="demo-payment-item" onClick={() => handleDemoPayment('upi')}>
                    <div className="demo-payment-icon upi-purple">U</div>
                    <div className="demo-payment-info">
                      <strong>UPI</strong>
                      <span>Google Pay, PhonePe, Paytm & more</span>
                    </div>
                    <div className="demo-arrow">›</div>
                  </div>
                </div>
              )}

              {demoModalStep === 'upi_input' && (
                <div className="demo-upi-area">
                  <div className="demo-back" onClick={() => setDemoModalStep('selection')}>← Back to options</div>
                  <h3>Enter UPI ID</h3>
                  <div className="demo-upi-input-group">
                    <input type="text" placeholder="e.g. user@okhdfcbank" className="demo-upi-field" autoFocus />
                    <button className="demo-upi-pay-btn" onClick={simulateSuccess}>PAY NOW</button>
                  </div>
                  <div className="demo-upi-apps">
                    <p>Or pay using app</p>
                    <div className="demo-app-grid">
                      <div className="demo-app" onClick={simulateSuccess}><div className="demo-app-icon gpay">G</div><span>Google Pay</span></div>
                      <div className="demo-app" onClick={simulateSuccess}><div className="demo-app-icon phonepe">P</div><span>PhonePe</span></div>
                      <div className="demo-app" onClick={simulateSuccess}><div className="demo-app-icon paytm">P</div><span>Paytm</span></div>
                    </div>
                  </div>
                </div>
              )}

              {demoModalStep === 'processing' && (
                <div className="demo-processing-area">
                  <div className="demo-loader"></div>
                  <h3>Processing Payment</h3>
                  <p>Please wait while we confirm your transaction...</p>
                </div>
              )}

              {demoModalStep === 'success' && (
                <div className="demo-success-area">
                  <div className="demo-success-icon">
                    <svg viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="25" fill="none" />
                      <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  </div>
                  <h3>Payment Successful</h3>
                  <p>Redirecting you back to PetCare...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;


