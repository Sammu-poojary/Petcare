import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import './MedicalShop.css';
import products from './medicalProducts';

function MedicalShop() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [allProducts, setAllProducts] = useState(products);

  const safeInventory = (data) => {
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.medicines) || !Array.isArray(data.foods) || !Array.isArray(data.toys)) return null;
    return data;
  };

  // Load cart and inventory from localStorage on mount
  useEffect(() => {
    // Inventory Loading
    const loadInventory = () => {
      try {
        const savedInventoryStr = localStorage.getItem('petcare_inventory');
        if (savedInventoryStr) {
          const inventoryData = JSON.parse(savedInventoryStr);
          const validated = safeInventory(inventoryData);
          if (validated) {
            setAllProducts(validated);
            return;
          }
        }
      } catch (e) {
        console.error("Inventory load failed:", e);
      }

      // Fallback: Use defaults without overwriting localStorage (to avoid erasing admin changes)
      setAllProducts(products);
    };

    loadInventory();

    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('medicalShopCart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        }
      } catch (e) {
        console.error("Cart load failed:", e);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medicalShopCart', JSON.stringify(cart));
  }, [cart]);

  // products imported from medicalProducts.js

  const getFilteredProducts = () => {
    const safeData = allProducts || { medicines: [], foods: [], toys: [] };
    const medicines = Array.isArray(safeData.medicines) ? safeData.medicines : [];
    const foods = Array.isArray(safeData.foods) ? safeData.foods : [];
    const toys = Array.isArray(safeData.toys) ? safeData.toys : [];

    let filtered = [];
    if (category === 'all') {
      filtered = [...medicines, ...foods, ...toys];
    } else {
      filtered = Array.isArray(safeData[category]) ? safeData[category] : [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    // Show brief feedback
    alert(`${product.name} added to cart!`);
  };

  const getCartCount = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const handleCartClick = () => {
    navigate('/cart', { state: { cart } });
  };

  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="shop-container">
      <div className="shop-header">
        <div className="shop-nav-row">
          <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
          <button className="cart-icon-btn" onClick={handleCartClick}>
            🛒 Cart
            {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
          </button>
        </div>

        <div className="shop-center-content">
          <h1>Medical Shop</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shop-search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>
      </div>

      <div className="shop-content">
        <div className="category-filter">
          <button
            className={`filter-btn ${category === 'all' ? 'active' : ''}`}
            onClick={() => { setCategory('all'); setSearchTerm(''); }}
          >
            All Products
          </button>
          <button
            className={`filter-btn ${category === 'medicines' ? 'active' : ''}`}
            onClick={() => { setCategory('medicines'); setSearchTerm(''); }}
          >
            💊 Medicines
          </button>
          <button
            className={`filter-btn ${category === 'foods' ? 'active' : ''}`}
            onClick={() => { setCategory('foods'); setSearchTerm(''); }}
          >
            🍖 Foods
          </button>
          <button
            className={`filter-btn ${category === 'toys' ? 'active' : ''}`}
            onClick={() => { setCategory('toys'); setSearchTerm(''); }}
          >
            🧸 Toys
          </button>
        </div>

        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-shop-notice" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', color: 'white' }}>
              <h2>Your Medical Shop seems to be empty.</h2>
              <p>This might be due to a data sync issue.</p>
              <button
                onClick={() => {
                  localStorage.removeItem('petcare_inventory');
                  window.location.reload();
                }}
                className="back-btn"
                style={{ marginTop: '20px', background: '#FF6B6B', color: 'white', borderColor: 'transparent' }}
              >
                🔄 Reset Shop Inventory
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className={`product-card ${product.isOutOfStock ? 'out-of-stock' : ''}`}>
                {product.isOutOfStock && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                {product.image && (
                  <div className="product-image-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      onClick={() => setSelectedProduct(product)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-price">{product.price}</div>
                </div>
                <div className="product-actions">
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                    disabled={product.isOutOfStock}
                  >
                    {product.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content glass-morphism" onClick={e => e.stopPropagation()}>
            <div className="modal-close-btn" onClick={() => setSelectedProduct(null)}>&times;</div>
            <div className="modal-grid">
              <div className="modal-image-section">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-img" />
              </div>
              <div className="modal-info-section">
                <h2 className="modal-product-name">{selectedProduct.name}</h2>
                <div className="modal-price-tag">{selectedProduct.price}</div>
                <div className="modal-divider"></div>

                <section className="modal-meta-info">
                  <div className="meta-item">
                    <label>Description</label>
                    <p>{selectedProduct.description}</p>
                  </div>
                  {(selectedProduct.usage || selectedProduct.category === 'medicines') && (
                    <div className="meta-item">
                      <label>Usage Guidelines</label>
                      <p>{selectedProduct.usage || 'Refer to label or consult your veterinarian.'}</p>
                    </div>
                  )}
                  {(selectedProduct.dosage || selectedProduct.category === 'medicines') && (
                    <div className="meta-item">
                      <label>Dosage / Prescription</label>
                      <p>{selectedProduct.dosage || 'Follow vet recommendation or product label.'}</p>
                    </div>
                  )}
                </section>

                <div className="modal-actions">
                  <button
                    className="add-to-cart-btn large"
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    disabled={selectedProduct.isOutOfStock}
                  >
                    {selectedProduct.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button className="back-btn-outline" onClick={() => setSelectedProduct(null)}>
                    Back to Shop
                  </button>
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

export default MedicalShop;
