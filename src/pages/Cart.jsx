import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [phoneError, setPhoneError] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    zip: ''
  });

  useEffect(() => {
    // Get cart from location state or localStorage
    if (location.state?.cart) {
      setCart(location.state.cart);
    } else {
      const savedCart = localStorage.getItem('medicalShopCart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          setCart([]);
        }
      }
    }
  }, [location.state]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medicalShopCart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null; // Remove item
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setShippingAddress({ ...shippingAddress, phone: digitsOnly });
    if (phoneError) setPhoneError('');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zip) {
      alert('Please fill in your complete shipping address!');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingAddress.phone)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    const total = calculateTotal();
    navigate('/payment', {
      state: {
        serviceType: 'Medical Shop',
        cart: cart,
        shippingAddress: shippingAddress,
        total: `₹${total.toLocaleString('en-IN')}`,
        item: {
          name: `${cart.length} item${cart.length > 1 ? 's' : ''}`,
          price: `₹${total.toLocaleString('en-IN')}`
        }
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-card">
          <button className="back-btn" onClick={() => navigate('/services/medical-shop')}>
            ← Back to Shop
          </button>
          <div className="empty-cart">
            <h1>Your Cart is Empty</h1>
            <p>Add some products to your cart to get started!</p>
            <button className="shop-btn" onClick={() => navigate('/services/medical-shop')}>
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-card">
        <button className="back-btn" onClick={() => navigate('/services/medical-shop')}>
          ← Back to Shop
        </button>
        <h1>Shopping Cart</h1>

        <div className="cart-items">
          {cart.map((item) => {
            const price = parseFloat(item.price.replace('₹', '').replace(',', ''));
            const itemTotal = price * item.quantity;

            return (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="cart-item-description">{item.description}</p>
                  <div className="cart-item-price">₹{price.toLocaleString('en-IN')} each</div>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      −
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">₹{itemTotal.toLocaleString('en-IN')}</div>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="shipping-address-section">
          <h2>Shipping Address</h2>
          <div className="address-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter receiver's name"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={shippingAddress.phone}
                  onChange={handlePhoneChange}
                  maxLength="10"
                  className={phoneError ? 'input-error' : ''}
                />
                {phoneError && <span className="field-error">{phoneError}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                placeholder="House No, Building, Street"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <select
                  className="form-input"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                >
                  <option value="">Select city</option>
                  <option value="Udupi">Udupi</option>
                  <option value="Mangalore">Mangalore</option>
                  <option value="Kundapura">Kundapura</option>
                </select>
              </div>
              <div className="form-group">
                <label>ZIP / PIN Code</label>
                <input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={shippingAddress.zip}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;

