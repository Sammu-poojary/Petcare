import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { performEmergencyCleanup, compressImage } from '../utils/storage';
import './PetProfile.css';

const createEmptyPet = () => ({
  name: '',
  type: '',
  breed: '',
  age: '',
  gender: '',
  weight: '',
  image: ''
});

const loadStoredPets = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'guest';
    const userProfileKey = `pets_${userId}`;
    const stored = localStorage.getItem(userProfileKey);

    if (!stored) return [createEmptyPet()];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.length) {
      return [createEmptyPet()];
    }
    return parsed.map((pet) => ({ ...createEmptyPet(), ...pet }));
  } catch {
    return [createEmptyPet()];
  }
};

const breedOptions = {
  dog: ['Doberman', 'Husky', 'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Beagle', 'Pug', 'Pomeranian', 'Rottweiler', 'Other (Dog)'],
  cat: ['Persian', 'Siamese', 'Maine Coon', 'Bengal', 'British Shorthair', 'Sphynx', 'Ragdoll', 'Abyssinian', 'Russian Blue', 'Other (Cat)'],
  other: ['Horse', 'Rabbit', 'Monkey', 'Hamster', 'Parrot', 'Turtle', 'Guinea Pig', 'Ferret', 'Fish', 'Other']
};


function PetProfile({ onComplete }) {
  const [pets, setPets] = useState([createEmptyPet()]);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [validationMessages, setValidationMessages] = useState([]);
  const navigate = useNavigate();
  const fileInputRefs = useRef([]);

  const [isViewMode, setIsViewMode] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const loadedPets = await loadStoredPets();
      setPets(loadedPets);

      // If we have pet data (at least one pet with a name), default to view mode
      if (loadedPets.length > 0 && loadedPets[0].name) {
        setIsViewMode(true);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (userId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, phone')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            if (profileData.name) setOwnerName(profileData.name);
            if (profileData.phone) setOwnerPhone(profileData.phone);
          } else {
            // Fallback to local storage if profile not found/fetched
            const ownerKey = `ownerName_${userId}`;
            const phoneKey = `ownerPhone_${userId}`;
            const storedOwner = localStorage.getItem(ownerKey);
            const storedPhone = localStorage.getItem(phoneKey);
            if (storedOwner) setOwnerName(storedOwner);
            if (storedPhone) setOwnerPhone(storedPhone);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    loadProfile();
  }, []);

  const handleEditToggle = () => {
    setIsViewMode(false);
  };

  const handlePetChange = (index, field, value) => {
    const updatedPets = [...pets];

    // Guard against unrealistic inputs for age only (weight has no strict validation)
    if (field === 'age') {
      const numeric = Number(value);
      if (Number.isNaN(numeric) || numeric < 0) {
        updatedPets[index][field] = '';
      } else if (numeric > 20) {
        updatedPets[index][field] = 20;
        alert('Age cannot exceed 20 years for this profile.');
      } else {
        updatedPets[index][field] = value;
      }
    } else if (field === 'weight') {
      // Only allow numeric input for weight (including decimals)
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      const cleanedValue = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : numericValue;
      const numeric = parseFloat(cleanedValue);

      if (cleanedValue === '' || Number.isNaN(numeric)) {
        updatedPets[index][field] = cleanedValue;
      } else if (numeric < 0) {
        updatedPets[index][field] = '';
      } else if (numeric >= 100) {
        updatedPets[index][field] = cleanedValue;
        alert('Weight must be less than 100 kg.');
      } else {
        updatedPets[index][field] = cleanedValue;
      }
    } else {
      updatedPets[index][field] = value;
    }

    setPets(updatedPets);
  };

  const addPet = () => {
    setPets([...pets, createEmptyPet()]);
  };

  const removePet = (index) => {
    if (pets.length > 1) {
      setPets(pets.filter((_, i) => i !== index));
    }
  };


  const handleImageChange = async (index, file) => {
    if (!file) return;
    try {
      const compressedImage = await compressImage(file);
      handlePetChange(index, 'image', compressedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try another image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const weightValid = (w) => {
      if (!w || w === '') return true;
      const num = parseFloat(String(w).replace(/[^0-9.]/g, ''));
      return !Number.isNaN(num) && num >= 0 && num < 100;
    };
    const phoneRegex = /^[1-9][0-9]{9}$/;
    const isValid = ownerName && ownerPhone && phoneRegex.test(ownerPhone) && pets.every(pet =>
      pet.name && pet.type && pet.breed && pet.age && pet.gender && weightValid(pet.weight)
    );

    if (!phoneRegex.test(ownerPhone)) {
      alert('Please enter a valid 10-digit phone number (cannot start with 0).');
      return;
    }

    if (isValid) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

        if (session?.user || isAuthenticated) {
          const userId = session?.user?.id || 'guest';
          const userProfileKey = `pets_${userId}`;
          const ownerKey = userId !== 'guest' ? `ownerName_${userId}` : 'ownerName';
          const hasProfileKey = userId !== 'guest' ? `hasProfile_${userId}` : 'hasProfile';

          const attemptSave = (data) => {
            localStorage.setItem(userProfileKey, JSON.stringify(data));
            localStorage.setItem(ownerKey, ownerName);
            localStorage.setItem(`ownerPhone_${userId}`, ownerPhone);
            localStorage.setItem(hasProfileKey, 'true');
          };

          try {
            attemptSave(pets);
          } catch (storageError) {
            if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
              console.warn('Profile save failed, performing emergency cleanup...');
              performEmergencyCleanup();

              try {
                // Try again after cleanup
                attemptSave(pets);
              } catch (retryError) {
                // If still failing, try saving without images as last resort
                const petsWithoutImages = pets.map(p => ({ ...p, image: '' }));
                try {
                  attemptSave(petsWithoutImages);
                  alert('Profile saved. Images could not be stored due to browser limits.');
                } catch (finalError) {
                  alert('Storage is completely full. Please clear some space in your browser.');
                  return;
                }
              }
            } else {
              throw storageError;
            }
          }

          if (session?.user) {
            try {
              // 1. Update Profile (Name and Phone)
              await supabase
                .from('profiles')
                .update({ name: ownerName, phone: ownerPhone })
                .eq('id', userId);

              // 2. Overwrite existing pets for this owner
              await supabase.from('pets').delete().eq('owner_id', userId);

              const supabasePayload = pets.map(p => ({
                owner_id: userId,
                name: p.name,
                type: p.type,
                breed: p.breed,
                age: p.age ? Number(p.age) : null,
                gender: p.gender,
                weight: p.weight ? Number(p.weight) : null,
                image: p.image || null
              }));

              const { error: insertError } = await supabase.from('pets').insert(supabasePayload);
              if (insertError) {
                console.error("Supabase pet insert error:", insertError.message);
              }
            } catch (dbErr) {
              console.error("Supabase pet sync failed:", dbErr);
            }
          }

          if (typeof onComplete === 'function') {
            onComplete();
          }
          localStorage.setItem('hasProfile', 'true');
          setIsViewMode(true);
        } else {
          alert('Session expired. Please login again.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
      }
    } else {
      alert('Please fill in Owner Name and all fields for all pets.');
    }
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  if (isViewMode) {
    return (
      <div className="pet-profile-container">
        <div className="pet-profile-card glass-morphism view-mode-card">
          <div className="profile-header">
            <span className="paw-icon">🐾</span>
            <h1>Pet Profile</h1>
            <p>Owned by <span className="owner-name-display">{ownerName}</span></p>
            {ownerPhone && <p className="owner-phone-display">📞 {ownerPhone}</p>}
          </div>

          <div className="pet-view-list">
            {pets.map((pet, index) => (
              <div key={index} className="pet-view-section">
                <div className="pet-view-image-container">
                  {pet.image ? (
                    <img src={pet.image} alt={pet.name} className="pet-view-image" />
                  ) : (
                    <div className="pet-view-image-placeholder">
                      {pet.name ? pet.name.charAt(0).toUpperCase() : '🐾'}
                    </div>
                  )}
                </div>
                <div className="pet-view-details">
                  <h2>{pet.name}</h2>
                  <div className="pet-view-grid">
                    <div className="view-group">
                      <label>Type</label>
                      <span>{pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}</span>
                    </div>
                    <div className="view-group">
                      <label>Breed</label>
                      <span>{pet.breed}</span>
                    </div>
                    <div className="view-group">
                      <label>Age</label>
                      <span>{pet.age} Years</span>
                    </div>
                    <div className="view-group">
                      <label>Gender</label>
                      <span>{pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}</span>
                    </div>
                    {pet.weight && (
                      <div className="view-group">
                        <label>Weight</label>
                        <span>{pet.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="view-actions">
            <button className="edit-profile-btn" onClick={handleEditToggle}>
              Edit Profile
            </button>
            <button className="back-home-btn" onClick={handleBackToHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-profile-container">
      <div className="pet-profile-card glass-morphism">
        <div className="profile-header">
          <span className="paw-icon">🐾</span>
          <h1>{pets[0].name ? 'Edit Pet Profile' : 'Create Pet Profile'}</h1>
          <p>Tell us about your furry friends</p>
          <div className="owner-name-field">
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter owner name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  if (val.startsWith('0')) {
                    setOwnerPhone('');
                    alert('Phone number cannot start with 0');
                  } else {
                    setOwnerPhone(val);
                  }
                }}
                placeholder="10-digit phone number"
                pattern="[1-9][0-9]{9}"
                maxLength="10"
                required
              />
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="pet-profile-form">
          {pets.map((pet, index) => (
            <div key={index} className="pet-form-section">
              <div className="pet-section-header">
                <h2>Pet {index + 1}</h2>
                {pets.length > 1 && (
                  <button
                    type="button"
                    className="remove-pet-btn"
                    onClick={() => removePet(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group image-upload">
                  <label>Profile Image</label>
                  <div
                    className="pet-image-clickable"
                    onClick={() => fileInputRefs.current[index]?.click()}
                  >
                    {pet.image ? (
                      <img
                        src={pet.image}
                        alt={`${pet.name || 'Pet'} preview`}
                        className="pet-image-preview"
                      />
                    ) : (
                      <div className="pet-image-placeholder">
                        <span>{pet.name ? pet.name.charAt(0).toUpperCase() : '🐾'}</span>
                        <p>Tap to add photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(index, e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pet Name</label>
                  <input
                    type="text"
                    value={pet.name}
                    onChange={(e) => handlePetChange(index, 'name', e.target.value)}
                    placeholder="Enter pet name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pet Type</label>
                  <select
                    value={pet.type}
                    onChange={(e) => handlePetChange(index, 'type', e.target.value)}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Breed</label>
                  <select
                    value={pet.breed}
                    onChange={(e) => handlePetChange(index, 'breed', e.target.value)}
                    disabled={!pet.type}
                    required
                  >
                    <option value="">
                      {pet.type ? 'Select breed' : 'Select pet type first'}
                    </option>
                    {pet.type &&
                      breedOptions[pet.type].map((breed) => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={pet.age}
                    onChange={(e) => handlePetChange(index, 'age', e.target.value)}
                    placeholder="By years"
                    min="0"
                    max="20"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={pet.gender}
                    onChange={(e) => handlePetChange(index, 'gender', e.target.value)}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pet.weight}
                    onChange={(e) => handlePetChange(index, 'weight', e.target.value)}
                    placeholder="Enter weight"
                    pattern="[0-9.]*"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="add-pet-btn"
            onClick={addPet}
          >
            + Add Another Pet
          </button>
          <button type="submit" className="submit-profile-btn">
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default PetProfile;

