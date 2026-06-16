import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { addNotification } from "../utils/notifications";
import { compressImage, performEmergencyCleanup, getStorageUsage } from "../utils/storage";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dogShowDates, setDogShowDates] = useState([]);
  const [newShowDate, setNewShowDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inventory, setInventory] = useState({ medicines: [], foods: [], toys: [] });
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'medicines',
    image: '',
    usage: '',
    dosage: '',
    isOutOfStock: false
  });

  const handleLogout = async () => {
    localStorage.removeItem("isAdminLocal");
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    // Fetch from Supabase
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, name, email, role, provider, login_method");

    // Fetch from Local Storage (for offline/demo users)
    const localProfiles = JSON.parse(localStorage.getItem('petcare_local_profiles') || '[]');

    // Merge and Deduplicate (prefer Supabase data if exists)
    const mergedUsers = [...(usersData || [])];
    localProfiles.forEach(lp => {
      if (!mergedUsers.find(u => u.email === lp.email)) {
        mergedUsers.push(lp);
      }
    });

    const allPets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pets_')) {
        try {
          const petsData = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(petsData)) {
            petsData.forEach((p, idx) => {
              allPets.push({ ...p, id: p.id || `${key}-${idx}` });
            });
          }
        } catch (e) {
          console.error('Pet data error:', key, e);
        }
      }
    }

    const guestApps = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
    const generalBookings = JSON.parse(localStorage.getItem('petcare_bookings') || '[]');
    const shopOrders = JSON.parse(localStorage.getItem('petcare_orders') || '[]');

    const allBookings = [...guestApps, ...generalBookings].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    setUsers(mergedUsers);
    setPets(allPets);
    setBookings(allBookings);
    setOrders(shopOrders);

    const savedDates = JSON.parse(localStorage.getItem('dog_show_dates') || '[]');
    setDogShowDates(savedDates);

    const loadInventory = () => {
      try {
        const savedInventoryStr = localStorage.getItem('petcare_inventory');
        if (savedInventoryStr) {
          const savedInventory = JSON.parse(savedInventoryStr);
          const isInventoryEmpty = !savedInventory ||
            (!Array.isArray(savedInventory.medicines) &&
              !Array.isArray(savedInventory.foods) &&
              !Array.isArray(savedInventory.toys)) ||
            (savedInventory.medicines?.length === 0 &&
              savedInventory.foods?.length === 0 &&
              savedInventory.toys?.length === 0);

          if (!isInventoryEmpty) {
            setInventory(savedInventory);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load inventory:", e);
      }

      // Import and seed if necessary
      import('../pages/services/medicalProducts').then(module => {
        const defaultProducts = module.default || module.products;
        setInventory(defaultProducts);
        try {
          localStorage.setItem('petcare_inventory', JSON.stringify(defaultProducts));
        } catch (e) {
          console.warn("Storage full: could not seed default inventory.");
        }
      });
    };

    loadInventory();

    setLoading(false);
  };

  const handleAction = (type, id, action) => {
    if (type === 'booking') {
      let updated;
      if (action === 'remove') {
        updated = bookings.filter(b => b.id !== id);
      } else if (action === 'reject') {
        updated = bookings.map(b => {
          if (b.id === id) {
            const isDoctor = (b.service || '').toLowerCase().includes('consultation') || b.doctorName;
            addNotification({
              title: isDoctor ? "Consultation Update" : "Booking Update",
              message: isDoctor
                ? "Rejected by doctor because it's a busy day. Please contact another doctor or wait for availability."
                : `Your booking for ${b.service} has been declined. Please contact us for more information.`,
              type: 'admin'
            });
            return { ...b, status: 'Rejected' };
          }
          return b;
        });
      } else if (action === 'accept') {
        updated = bookings.map(b => {
          if (b.id === id) {
            const serviceName = (b.service || '').toLowerCase();
            const isDoctor = serviceName.includes('consultation') || b.doctorName;
            let customMessage = `Your booking for ${b.service} has been accepted.`;

            if (serviceName.includes('email')) {
              customMessage = "The doctor will consult you via email in a few minutes.";
            } else if (serviceName.includes('video')) {
              customMessage = "The doctor will contact you for a video call in a few minutes.";
            } else if (serviceName.includes('consultation')) {
              customMessage = "The doctor will consult you shortly.";
            }

            addNotification({
              title: isDoctor ? "Consultation Update" : "Booking Accepted",
              message: customMessage,
              type: 'admin'
            });

            return { ...b, status: 'Accepted' };
          }
          return b;
        });
      } else if (action === 'pickup') {
        updated = bookings.map(b => {
          if (b.id === id) {
            addNotification({ title: "Service Update", message: `Your pet has been Picked Up.`, type: 'admin' });
            return { ...b, status: 'Picked Up' };
          }
          return b;
        });
      } else if (action === 'wip') {
        updated = bookings.map(b => {
          if (b.id === id) {
            addNotification({ title: "Service Update", message: `Your service is Work In Progress.`, type: 'admin' });
            return { ...b, status: 'Work In Progress' };
          }
          return b;
        });
      } else if (action === 'returning') {
        updated = bookings.map(b => {
          if (b.id === id) {
            addNotification({ title: "Service Update", message: `Your pet is Returning.`, type: 'admin' });
            return { ...b, status: 'Returning' };
          }
          return b;
        });
      } else if (action === 'drop') {
        updated = bookings.map(b => {
          if (b.id === id) {
            addNotification({ title: "Service Update", message: `Your pet has been Dropped. Service complete.`, type: 'admin' });
            return { ...b, status: 'Dropped' };
          }
          return b;
        });
      }

      setBookings(updated);

      // Separate bookings back to their original categories
      const guestApps = [];
      const general = [];

      updated.forEach(b => {
        if (typeof b.id === 'string' && b.id.startsWith('BK')) {
          general.push(b);
        } else {
          guestApps.push(b); // Default to guestApps for safety
        }
      });

      localStorage.setItem('appointments_guest', JSON.stringify(guestApps));
      localStorage.setItem('petcare_bookings', JSON.stringify(general));
    }
    else if (type === 'order') {
      const updated = orders.map(o => {
        if (o.id === id) {
          let newStatus;
          if (action === 'approve') newStatus = 'Processing';
          else if (action === 'ship') newStatus = 'Shipped';
          else if (action === 'deliver') newStatus = 'Delivered';
          else newStatus = 'Cancelled';

          addNotification({
            title: `Order ${newStatus}`,
            message: `Your order #${o.id} has been ${newStatus.toLowerCase()}.`,
            type: 'admin'
          });

          return { ...o, status: newStatus };
        }
        return o;
      });
      setOrders(updated);
      localStorage.setItem('petcare_orders', JSON.stringify(updated));
    }
  };

  const handleAddDate = () => {
    if (!newShowDate) return;
    const updated = [...dogShowDates, newShowDate].sort();
    setDogShowDates(updated);
    localStorage.setItem('dog_show_dates', JSON.stringify(updated));
    setNewShowDate("");
    addNotification({
      title: "Dog Show Update",
      message: `New show date ${newShowDate} added successfully.`,
      type: 'admin'
    });
  };

  const handleDeleteDate = (dateToDelete) => {
    const updated = dogShowDates.filter(d => d !== dateToDelete);
    setDogShowDates(updated);
    localStorage.setItem('dog_show_dates', JSON.stringify(updated));
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Use shared compression utility
        const compressedImage = await compressImage(file);
        setNewProduct({ ...newProduct, image: compressedImage });
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try another image.');
      }
    }
  };

  const handleInventoryAction = (action, category, id) => {
    let updated;
    if (action === 'add') {
      const productToAdd = { ...newProduct, id: Date.now() };
      updated = {
        ...inventory,
        [newProduct.category]: [...inventory[newProduct.category], productToAdd]
      };
      setNewProduct({
        name: '',
        price: '',
        description: '',
        category: 'medicines',
        image: '',
        usage: '',
        dosage: '',
        isOutOfStock: false
      });
    } else if (action === 'delete') {
      updated = {
        ...inventory,
        [category]: inventory[category].filter(p => p.id !== id)
      };
    }
    setInventory(updated);
    try {
      localStorage.setItem('petcare_inventory', JSON.stringify(updated));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('Inventory save failed, performing emergency cleanup...');
        performEmergencyCleanup();
        try {
          localStorage.setItem('petcare_inventory', JSON.stringify(updated));
        } catch (retryError) {
          // Absolute last resort: clear even more aggressively
          localStorage.removeItem('petcare_orders');
          localStorage.removeItem('petcare_notifications');
          localStorage.removeItem('petcare_reviews');
          try {
            localStorage.setItem('petcare_inventory', JSON.stringify(updated));
          } catch (f) {
            alert("Critically low space! The browser cannot store more data. Please manually clear your browser cache or remove large products.");
            return;
          }
        }
      } else {
        alert("Could not save inventory update due to a storage error.");
        return;
      }
      console.error("Storage Error:", e);
    }
    addNotification({
      title: "Inventory Updated",
      message: `Product successfully ${action === 'add' ? 'added to' : 'removed from'} inventory.`,
      type: 'admin'
    });

    if (action === 'add') {
      alert("Product added successfully! It will now be visible in the Medical Shop.");
    }
  };

  const handleToggleStock = (category, id) => {
    const updated = {
      ...inventory,
      [category]: inventory[category].map(p =>
        p.id === id ? { ...p, isOutOfStock: !p.isOutOfStock } : p
      )
    };
    setInventory(updated);
    localStorage.setItem('petcare_inventory', JSON.stringify(updated));
    addNotification({
      title: "Stock Updated",
      message: "Product stock status has been updated.",
      type: 'admin'
    });
  };

  const handleResetInventory = () => {
    if (window.confirm("This will remove all custom products and restore the default inventory. Proceed?")) {
      import('../pages/services/medicalProducts').then(module => {
        const defaultProducts = module.default || module.products;
        setInventory(defaultProducts);
        try {
          localStorage.setItem('petcare_inventory', JSON.stringify(defaultProducts));
          alert("Inventory has been reset to defaults.");
        } catch (e) {
          performEmergencyCleanup();
          localStorage.setItem('petcare_inventory', JSON.stringify(defaultProducts));
          alert("Inventory reset (storage cleanup performed).");
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Initializing Admin Control Center...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-info">
            <h1>Admin Dashboard</h1>
            <p style={{ color: '#8b949e', marginTop: '4px' }}>PetCare Management Console</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            System Logout
          </button>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard title="Total Users" value={users.length} icon="👥" label="Active Accounts" />
          <StatCard title="Total Orders" value={orders.length} icon="📦" label="Commerce Volume" />
          <StatCard
            title="Pending Actions"
            value={bookings.filter(b => b.status === 'Pending' || b.status === 'Pending Approval').length + orders.filter(o => o.status === 'Pending Approval').length}
            icon="⚠️"
            label="Needs Attention"
            color="#e3b341"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${orders.reduce((acc, curr) => acc + (parseFloat((curr.total || "0").replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString('en-IN')}`}
            icon="💰"
            label="Sales Volume"
          />
        </div>

        <div className="dashboard-sections">
          {/* USERS */}
          <section className="glass-section">
            <div className="section-head">
              <h2>User Directory</h2>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name || u.username || "Guest"}</td>
                      <td>{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PET PROFILES */}
          <section className="glass-section">
            <div className="section-head">
              <h2>Pet Database</h2>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Pet Name</th>
                    <th>Species</th>
                    <th>Breed</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No pet profiles registered</td></tr>
                  ) : (
                    pets.map((p, i) => (
                      <tr key={i}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.type}</td>
                        <td>{p.breed}</td>
                        <td>{p.age} mo</td>
                        <td>
                          <button className="modern-btn btn-view" onClick={() => setSelectedPet(p)}>
                            Profile details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* INVENTORY MANAGEMENT */}
          <section className="glass-section">
            <div className="section-head">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Inventory Management</h2>
                  <p style={{ color: '#8b949e', fontSize: '14px', marginTop: '5px' }}>Manage Medical Shop Products</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '15px', textAlign: 'right', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button
                    onClick={handleResetInventory}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Reset Inventory
                  </button>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8b949e' }}>Storage Usage</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: parseFloat(getStorageUsage()) > 4 ? '#ff4d4d' : '#4CAF50' }}>{getStorageUsage()} / 5.00 MB</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-form-box" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
              <h3>Add New Product</h3>
              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium Dog Biscuits"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="medicines">Medicines</option>
                    <option value="foods">Foods</option>
                    <option value="toys">Toys</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (with ₹)</label>
                  <input
                    type="text"
                    placeholder="₹500"
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Product Image</label>
                  <div className="file-upload-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      style={{ padding: '8px' }}
                    />
                    {newProduct.image && (
                      <div className="product-preview-thumb" style={{ position: 'relative' }}>
                        <img src={newProduct.image} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                        <button
                          className="clear-img-btn"
                          onClick={() => setNewProduct({ ...newProduct, image: '' })}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea
                    placeholder="Brief description of the product..."
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Usage (for Medicine)</label>
                  <input
                    type="text"
                    placeholder="Give orally..."
                    value={newProduct.usage}
                    onChange={e => setNewProduct({ ...newProduct, usage: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Dosage (for Medicine)</label>
                  <input
                    type="text"
                    placeholder="Weight-based..."
                    value={newProduct.dosage}
                    onChange={e => setNewProduct({ ...newProduct, dosage: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="isOutOfStock"
                    checked={newProduct.isOutOfStock}
                    onChange={e => setNewProduct({ ...newProduct, isOutOfStock: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="isOutOfStock" style={{ cursor: 'pointer', margin: 0 }}>Mark as Out of Stock</label>
                </div>
              </div>
              <button
                className="modern-btn btn-accept"
                style={{ marginTop: '20px', width: '100%' }}
                onClick={() => handleInventoryAction('add')}
                disabled={!newProduct.name || !newProduct.price || !newProduct.category}
              >
                ➕ Add to Inventory
              </button>
            </div>

            <div className="inventory-lists">
              {['medicines', 'foods', 'toys'].map(cat => (
                <div key={cat} className="inventory-category-group" style={{ marginBottom: '30px' }}>
                  <h3 style={{ textTransform: 'capitalize', color: '#667eea', marginBottom: '15px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                    {cat} ({inventory[cat]?.length || 0})
                  </h3>
                  <div className="modern-table-container">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory[cat]?.length === 0 ? (
                          <tr><td colSpan="3" style={{ textAlign: 'center' }}>No products in this category</td></tr>
                        ) : (
                          inventory[cat].map(prod => (
                            <tr key={prod.id}>
                              <td>{prod.name}</td>
                              <td>{prod.price}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button
                                    className={`modern-btn ${prod.isOutOfStock ? 'btn-accept' : 'btn-view'}`}
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                    onClick={() => handleToggleStock(cat, prod.id)}
                                  >
                                    {prod.isOutOfStock ? 'In Stock' : 'Out Stock'}
                                  </button>
                                  <button
                                    className="modern-btn btn-reject"
                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                    onClick={() => handleInventoryAction('delete', cat, prod.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ORDERS */}
          <section className="glass-section">
            <div className="section-head">
              <h2>Order Management</h2>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No orders found</td></tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td><strong>#{o.id}</strong></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{o.customerName}</span>
                            <small style={{ color: '#8b949e', fontSize: '11px' }}>{o.userEmail}</small>
                          </div>
                        </td>
                        <td>{o.total}</td>
                        <td>{new Date(o.date).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${o.status.toLowerCase().replace(/\s/g, '-')}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button className="modern-btn btn-view" onClick={() => setSelectedOrder(o)}>View</button>
                            {o.status === 'Pending Approval' && (
                              <button className="modern-btn btn-accept" onClick={() => handleAction('order', o.id, 'approve')}>Process</button>
                            )}
                            {o.status === 'Processing' && (
                              <button className="modern-btn btn-accept" onClick={() => handleAction('order', o.id, 'ship')}>Ship</button>
                            )}
                            {o.status === 'Shipped' && (
                              <button className="modern-btn btn-accept" onClick={() => handleAction('order', o.id, 'deliver')}>Deliver</button>
                            )}
                            {(o.status !== 'Delivered' && o.status !== 'Cancelled') && (
                              <button className="modern-btn btn-reject" onClick={() => handleAction('order', o.id, 'cancel')}>Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SERVICE REQUESTS */}
          <section className="glass-section">
            <div className="section-head">
              <h2>Service Desk</h2>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Client Pet</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.petName}</td>
                      <td>{b.service}{b.item?.name ? ` - ${b.item.name}` : ''}</td>
                      <td>{new Date(b.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${b.status.toLowerCase().replace(/\s/g, '-')}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button className="modern-btn btn-view" onClick={() => setSelectedBooking(b)}>Data</button>
                          {(b.status === 'Pending' || b.status === 'Pending Approval') && (
                            <>
                              <button className="modern-btn btn-accept" onClick={() => handleAction('booking', b.id, 'accept')}>Approve</button>
                              <button className="modern-btn btn-reject" onClick={() => handleAction('booking', b.id, 'reject')}>Decline</button>
                            </>
                          )}
                          {b.status === 'Accepted' && (
                            <button className="modern-btn btn-accept" onClick={() => handleAction('booking', b.id, 'pickup')}>Pick Up</button>
                          )}
                          {b.status === 'Picked Up' && (
                            <button className="modern-btn btn-accept" onClick={() => handleAction('booking', b.id, 'wip')}>WIP</button>
                          )}
                          {b.status === 'Work In Progress' && (
                            <button className="modern-btn btn-accept" onClick={() => handleAction('booking', b.id, 'returning')}>Return</button>
                          )}
                          {b.status === 'Returning' && (
                            <button className="modern-btn btn-accept" onClick={() => handleAction('booking', b.id, 'drop')}>Drop</button>
                          )}
                          {(b.status === 'Rejected' || b.status === 'Dropped' || (!['Pending', 'Pending Approval', 'Accepted', 'Picked Up', 'Work In Progress', 'Returning', 'Dropped', 'Rejected'].includes(b.status) && b.status !== 'Completed')) && (
                            <button className="modern-btn btn-reject" style={{ padding: '4px 10px' }} onClick={() => handleAction('booking', b.id, 'remove')}>&times;</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* DOG SHOW CONTROL */}
          <section className="glass-section">
            <div className="section-head">
              <h2>Dog Show Calendar</h2>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <input
                type="date"
                value={newShowDate}
                onChange={(e) => setNewShowDate(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px' }}
              />
              <button className="modern-btn btn-accept" onClick={handleAddDate}>Schedule Show</button>
            </div>
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dogShowDates.map((date, idx) => (
                    <tr key={idx}>
                      <td>{new Date(date).toDateString()}</td>
                      <td><span className="status-badge accepted">Confirmed</span></td>
                      <td><button className="modern-btn btn-reject" onClick={() => handleDeleteDate(date)}>Unschedule</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}
      {selectedPet && (
        <div className="premium-modal-overlay" onClick={() => setSelectedPet(null)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Pet Identity Card</h2>
              <button className="close-modal-btn" onClick={() => setSelectedPet(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="pet-showcase">
                <div className="pet-image-container">
                  <img src={selectedPet.image || 'https://via.placeholder.com/200?text=Pet'} alt={selectedPet.name} />
                </div>
                <div className="pet-specs">
                  <SpecBox label="Call Name" value={selectedPet.name} />
                  <SpecBox label="Species" value={selectedPet.type} />
                  <SpecBox label="Lineage / Breed" value={selectedPet.breed} />
                  <SpecBox label="Biological Age" value={`${selectedPet.age} months`} />
                  <SpecBox label="Gender" value={selectedPet.gender} />
                  <SpecBox label="Health Status" value={selectedPet.healthConditions || 'Standard'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="premium-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Service Payload</h2>
              <button className="close-modal-btn" onClick={() => setSelectedBooking(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="pet-specs" style={{ gridTemplateColumns: '1fr' }}>
                <SpecBox label="Service Type" value={selectedBooking.service || 'Medical Consultation'} />
                <SpecBox label="Patient Name" value={selectedBooking.petName} />
                <SpecBox label="Application Date" value={new Date(selectedBooking.date).toLocaleString()} />
                {selectedBooking.issue && <SpecBox label="Issue Report" value={selectedBooking.issue} />}
                {selectedBooking.details?.address && <SpecBox label="Fulfillment Address" value={selectedBooking.details.address} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="premium-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Order Manifest</h2>
              <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="order-details-summary">
                <div className="pet-specs" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
                  <SpecBox label="Order ID" value={`#${selectedOrder.id}`} />
                  <SpecBox label="Customer" value={selectedOrder.customerName} />
                  <SpecBox label="Email" value={selectedOrder.userEmail} />
                  <SpecBox label="Delivery Address" value={selectedOrder.shippingAddress || "Not provided"} />
                  <SpecBox label="Grand Total" value={selectedOrder.total} />
                </div>
                <h3>Items Summary</h3>
                <div className="modern-table-container">
                  <table className="modern-table" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.cart?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function StatCard({ title, value, icon, label, color }) {
  return (
    <div className="premium-stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer" style={color ? { color } : {}}>
        {label}
      </div>
    </div>
  );
}

function SpecBox({ label, value }) {
  return (
    <div className="spec-box">
      <span className="spec-label">{label}</span>
      <span className="spec-value">{value}</span>
    </div>
  );
}

export default AdminDashboard;
