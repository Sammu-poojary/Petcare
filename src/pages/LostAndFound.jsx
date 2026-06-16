import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LostAndFound.css';

const LostAndFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' or 'found'
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [contactError, setContactError] = useState('');
  const [newPost, setNewPost] = useState({
    type: 'lost',
    petName: '',
    description: '',
    location: '',
    contact: '',
    image: null
  });

  // Function to load posts from localStorage
  const loadPosts = () => {
    try {
      const storedPosts = localStorage.getItem('lostFoundPosts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        // Ensure it's an array
        if (Array.isArray(parsedPosts)) {
          setPosts(parsedPosts);
          console.log('Loaded posts from localStorage:', parsedPosts.length);
        } else {
          console.warn('Invalid data format in localStorage, resetting...');
          setPosts([]);
          localStorage.removeItem('lostFoundPosts');
        }
      } else {
        // Sample data - only create if no data exists
        const samples = [
          {
            id: 1,
            type: 'lost',
            petName: 'Bella',
            description: 'Golden Retriever, wearing a red collar. Very friendly.',
            location: 'Central Park Area',
            contact: '555-0123',
            date: new Date().toLocaleDateString(),
            image: null
          },
          {
            id: 2,
            type: 'found',
            petName: 'Unknown',
            description: 'Found a small black cat near the bakery.',
            location: 'Main Street',
            contact: '555-0199',
            date: new Date().toLocaleDateString(),
            image: null
          }
        ];
        setPosts(samples);
        localStorage.setItem('lostFoundPosts', JSON.stringify(samples));
        console.log('Created sample posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  // Load posts from localStorage on mount and when location changes
  useEffect(() => {
    loadPosts();
  }, [location.pathname]);

  // Also reload when component becomes visible (handles browser back/forward)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update form type when active tab changes
  useEffect(() => {
    setNewPost(prev => ({ ...prev, type: activeTab }));
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contact') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setNewPost(prev => ({ ...prev, contact: digitsOnly }));
      if (contactError) setContactError('');
      return;
    }
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  // Compress image to reduce size
  // Compress image to reduce size aggressively
  const compressImage = (file, maxWidth = 500, maxHeight = 500, quality = 0.5) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please select an image smaller than 5MB.');
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setNewPost(prev => ({ ...prev, image: compressedImage }));
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try another image.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newPost.petName || !newPost.location || !newPost.contact || !newPost.description) {
      alert('Please fill in all required fields');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(newPost.contact)) {
      setContactError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const post = {
        id: Date.now(),
        ...newPost,
        type: activeTab,
        date: new Date().toLocaleDateString()
      };

      // Get current posts from state and add new post
      setPosts(prevPosts => {
        const updatedPosts = [post, ...prevPosts];

        // Save to localStorage immediately
        try {
          const jsonString = JSON.stringify(updatedPosts);

          // Check if data is too large (localStorage limit is usually 5-10MB)
          if (jsonString.length > 3 * 1024 * 1024) { // 3MB limit
            // If too large, remove oldest posts to make room
            const maxPosts = 20; // Keep only last 20 posts
            const trimmedPosts = updatedPosts.slice(0, maxPosts);
            localStorage.setItem('lostFoundPosts', JSON.stringify(trimmedPosts));
            console.log('Storage limit reached. Kept only last 50 posts.');
            return trimmedPosts;
          }

          localStorage.setItem('lostFoundPosts', jsonString);
          console.log('Post saved to localStorage:', post);
        } catch (error) {
          console.error('Error saving to localStorage:', error);

          // Check if it's a quota exceeded error
          if (error.name === 'QuotaExceededError' || error.code === 22) {
            // Try to save without the image if it exists
            if (post.image) {
              const postWithoutImage = { ...post, image: null };
              const updatedPostsWithoutImage = [postWithoutImage, ...prevPosts];
              try {
                localStorage.setItem('lostFoundPosts', JSON.stringify(updatedPostsWithoutImage));
                alert('Post saved, but image was too large and was removed. Please use a smaller image.');
                return updatedPostsWithoutImage;
              } catch (retryError) {
                // If still fails, remove oldest posts
                const trimmedPosts = prevPosts.slice(0, 20);
                localStorage.setItem('lostFoundPosts', JSON.stringify(trimmedPosts));
                alert('Storage is full. Some older posts were removed. Please try again.');
                return trimmedPosts;
              }
            } else {
              // Remove oldest posts to make room
              const trimmedPosts = prevPosts.slice(0, 20);
              localStorage.setItem('lostFoundPosts', JSON.stringify(trimmedPosts));
              alert('Storage is full. Some older posts were removed. Please try again.');
              return trimmedPosts;
            }
          } else {
            alert('Error saving post: ' + error.message);
            return prevPosts; // Don't update state if save failed
          }
        }

        return updatedPosts;
      });

      // Reset form
      setNewPost({
        type: activeTab,
        petName: '',
        description: '',
        location: '',
        contact: '',
        image: null
      });
      setShowForm(false);

      // Show success message
      alert('Post submitted successfully!');

      // Reload posts to ensure UI is updated
      setTimeout(() => {
        loadPosts();
      }, 100);
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Error submitting post. Please try again.');
    }
  };

  const filteredPosts = posts.filter(post => post.type === activeTab);

  return (
    <div className="lost-found-container">
      <header className="lf-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1>Lost & Found</h1>
        <button className="report-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : 'Report Pet'}
        </button>
      </header>

      <div className="lf-tabs">
        <button
          className={`tab-btn ${activeTab === 'lost' ? 'active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          Lost Pets 🐕
        </button>
        <button
          className={`tab-btn ${activeTab === 'found' ? 'active' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          Found Pets 🏠
        </button>
      </div>

      {showForm && (
        <div className="lf-form-container">
          <form onSubmit={handleSubmit} className="lf-form">
            <h3>Report a {activeTab === 'lost' ? 'Lost' : 'Found'} Pet</h3>

            <input
              type="text"
              name="petName"
              placeholder={activeTab === 'lost' ? "Pet Name" : "Pet Name (if known) or Description"}
              value={newPost.petName}
              onChange={handleInputChange}
              required
            />

            <input
              type="text"
              name="location"
              placeholder="Location"
              value={newPost.location}
              onChange={handleInputChange}
              required
            />

            <input
              type="tel"
              name="contact"
              placeholder="Enter 10-digit mobile number"
              value={newPost.contact}
              onChange={handleInputChange}
              required
              maxLength="10"
              className={contactError ? 'input-error' : ''}
            />
            {contactError && <span className="field-error">{contactError}</span>}

            <textarea
              name="description"
              placeholder="Description (Breed, Color, Distinctive marks...)"
              value={newPost.description}
              onChange={handleInputChange}
              required
            />

            <div className="file-input-wrapper">
              <label>Upload Photo:</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            {newPost.image && <img src={newPost.image} alt="Preview" className="img-preview" />}

            <button type="submit" className="submit-btn">Post Report</button>
          </form>
        </div>
      )}

      <div className="lf-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="lf-card">
              <div className="lf-card-img">
                {post.image ? (
                  <img src={post.image} alt={post.petName} />
                ) : (
                  <div className="placeholder-img">🐾</div>
                )}
                <span className={`status-badge ${post.type}`}>{post.type.toUpperCase()}</span>
              </div>
              <div className="lf-card-content">
                <h3>{post.petName}</h3>
                <p className="location">📍 {post.location}</p>
                <p className="desc">{post.description}</p>
                <p className="date">📅 {post.date}</p>
                <a href={`tel:${post.contact}`} className="contact-btn">📞 {post.contact}</a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts">
            <p>No reports found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LostAndFound;
