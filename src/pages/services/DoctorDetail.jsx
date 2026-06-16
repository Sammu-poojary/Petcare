import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { addNotification, requestNotificationPermission } from '../../utils/notifications';
import { supabase } from '../../supabase';
import Footer from '../../components/Footer';
import './DoctorDetail.css';

function DoctorDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;

  if (!doctor) {
    navigate('/services/consult-doctor', { replace: true });
    return null;
  }

  const notifyAndConfirm = async (title, message) => {
    await requestNotificationPermission();
    addNotification({
      title,
      message,
      type: 'consult',
    });
  };

  const getPetName = () => {
    return selectedPet || 'Buddy';
  };

  const saveToAdmin = async (serviceType) => {
    const serviceString = `${serviceType} (${doctor.name})`;

    try {
      const { error: insertError } = await supabase.from('appointments').insert({
        pet_name: getPetName(),
        service: serviceString,
        date: new Date().toLocaleDateString(),
        status: 'Pending'
      });
      if (insertError) {
        console.error("Supabase appointments insert error:", insertError.message);
      }
    } catch (err) {
      console.error("Supabase insert exception:", err);
    }

    const newAppointment = {
      id: Date.now(),
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      petName: getPetName(),
      service: serviceString
    };

    const existingAppointments = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
    localStorage.setItem('appointments_guest', JSON.stringify([...existingAppointments, newAppointment]));
  };

  const [showEmailOptions, setShowEmailOptions] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [consultData, setConsultData] = useState({ issue: '', images: [] });
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const emailRef = useRef(null);

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
              if (parsed.length > 0) setSelectedPet(parsed[0].name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user pets:', error);
      }
    };
    loadUserPets();
  }, []);

  useEffect(() => {
    if (!showEmailOptions) return;
    const handleClickOutside = (e) => {
      if (emailRef.current && !emailRef.current.contains(e.target)) {
        setShowEmailOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmailOptions]);

  const handleEmail = () => setShowEmailOptions((s) => !s);

  const handleEmailSelection = (recipient) => {
    setSelectedRecipient(recipient);
    setShowEmailForm(true);
    setShowEmailOptions(false);
  };

  const submitEmailInquiry = async () => {
    if (!emailMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "8f07ec8c-1a02-4461-9881-7cdb6474a9fb",
          subject: `Consultation Inquiry for ${doctor.name} (To: ${selectedRecipient})`,
          message: `Intended Recipient: ${selectedRecipient}\nDoctor: ${doctor.name}\n\nClient Message:\n${emailMessage}`,
        }),
      });
      const result = await response.json();
      
      if (!result.success) {
        alert("There was an issue sending the email. Please try again.");
        return;
      }
    } catch (error) {
      alert("Error connecting to email server.");
      console.error(error);
      return;
    }

    await saveToAdmin('Email Inquiry');

    // Add additional detailed log to appointment (since it's an inquiry)
    const existing = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
    if (existing.length > 0) {
      existing[existing.length - 1].issue = emailMessage;
      localStorage.setItem('appointments_guest', JSON.stringify(existing));
    }

    notifyAndConfirm('Email Delivered', `Your message was delivered to ${selectedRecipient}`);
    alert(`Email successfully sent to ${selectedRecipient}!`);
    
    setShowEmailForm(false);
    setEmailMessage('');
  };

  const handleConsult = () => setShowConsultForm(true);

  const handleConsultImage = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConsultData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const submitConsultation = async () => {
    if (!consultData.issue.trim()) {
      alert('Please describe the issue');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      petName: getPetName(),
      service: `Consultation (${doctor.name})`,
      issue: consultData.issue,
      attachments: consultData.images
    };

    // Instead of saving directly, navigate to Payment
    // We'll pass the booking details to Payment page
    const consultationFee = "₹500"; // Fake standard fee

    navigate('/payment', {
      state: {
        serviceType: 'Doctor Consultation',
        item: {
          name: `Consultation with ${doctor.name}`,
          price: consultationFee,
          details: newAppointment // Pass the full appointment details to be saved after payment
        },
        petName: getPetName()
      }
    });

    setShowConsultForm(false);
  };

  return (
    <div className="doctor-detail-container">
      <div className="doctor-detail-card">
        <button className="back-btn" onClick={() => navigate('/services/consult-doctor')}>
          ← Back
        </button>

        <div className="doctor-detail-header">
          <div className="doctor-avatar">
            <img src={doctor.image} alt={doctor.name} />
          </div>
          <div className="doctor-header-info">
            <h1>{doctor.name}</h1>
            <p className="doctor-specialization">{doctor.specialization}</p>
            <div className="doctor-rating">
              ⭐ {doctor.rating} Rating
            </div>
          </div>
        </div>

        <div className="doctor-detail-content">
          <div className="detail-section">
            <h2>Professional Information</h2>
            <div className="detail-item">
              <span className="detail-label">Experience:</span>
              <span className="detail-value">{doctor.experience}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Specialization:</span>
              <span className="detail-value">{doctor.specialization}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rating:</span>
              <span className="detail-value">⭐ {doctor.rating} / 5.0</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>Contact Information</h2>
            <div className="detail-item">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{doctor.phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{doctor.email}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>About</h2>
            <p className="doctor-description">
              {doctor.name} is a highly experienced {doctor.specialization.toLowerCase()} with {doctor.experience} of professional experience.
              They specialize in providing comprehensive veterinary care and have a proven track record of excellent patient outcomes.
              With a {doctor.rating} rating, they are committed to providing the best care for your pets.
            </p>
          </div>

          <div className="contact-actions">
            <div className="email-actions-wrapper" style={{ position: 'relative', flex: 1 }}>
              <button className="contact-action-btn email-btn" onClick={handleEmail}>
                ✉️ Send Email
              </button>
              {showEmailOptions && (
                <div className="email-options" ref={emailRef}>
                  <button className="email-option-btn" onClick={() => handleEmailSelection(doctor.email)}>
                    Email Doctor
                  </button>
                  <button className="email-option-btn" onClick={() => handleEmailSelection('carepawfect5@gmail.com')}>
                    Contact Pawfect Care
                  </button>
                </div>
              )}
            </div>
          </div>

          <button className="consult-btn" onClick={handleConsult}>
            Consult Now
          </button>
        </div>
      </div>

      {showEmailForm && (
        <div className="admin-modal-overlay" onClick={() => setShowEmailForm(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', background: 'rgba(20, 16, 50, 0.95)', border: '1px solid rgba(162,155,254,0.25)', borderRadius: '24px', backdropFilter: 'blur(24px)' }}>
            <div className="modal-header">
              <h2 style={{ background: 'linear-gradient(90deg,#fff,#a29bfe)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Compose Email</h2>
              <button className="close-btn" onClick={() => setShowEmailForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Recipient</label>
                <p style={{ color: '#a29bfe', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 600 }}>{selectedRecipient}</p>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Your Message</label>
                <textarea
                  placeholder="Type your message here..."
                  style={{ width: '100%', height: '130px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(162,155,254,0.25)', borderRadius: '12px', color: 'white', padding: '12px', marginTop: '8px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>
              <button
                className="consult-btn"
                onClick={submitEmailInquiry}
                style={{ width: '100%', marginTop: '8px' }}
              >
                🚀 Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsultForm && (
        <div className="admin-modal-overlay" onClick={() => setShowConsultForm(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', background: 'rgba(20, 16, 50, 0.95)', border: '1px solid rgba(162,155,254,0.25)', borderRadius: '24px', backdropFilter: 'blur(24px)' }}>
            <div className="modal-header">
              <h2 style={{ background: 'linear-gradient(90deg,#fff,#a29bfe)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Describe the Issue</h2>
              <button className="close-btn" onClick={() => setShowConsultForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>What's the problem?</label>
                <textarea
                  placeholder="Tell us what's happening with your pet..."
                  style={{ width: '100%', height: '110px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(162,155,254,0.25)', borderRadius: '12px', color: 'white', padding: '12px', marginTop: '8px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                  value={consultData.issue}
                  onChange={(e) => setConsultData({ ...consultData, issue: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Select Your Pet</label>
                <select
                  value={selectedPet}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(162,155,254,0.25)', marginTop: '8px', outline: 'none', fontSize: '0.95rem' }}
                >
                  <option value="">Choose a pet</option>
                  {pets.map((pet, idx) => (
                    <option key={idx} value={pet.name}>{pet.name} ({pet.type})</option>
                  ))}
                  {!pets.length && <option value="My Pet">My Pet (Default)</option>}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Attachments (Photos)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleConsultImage}
                  style={{ marginTop: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {consultData.images.map((img, i) => (
                    <img key={i} src={img} alt="pet" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(162,155,254,0.4)' }} />
                  ))}
                </div>
              </div>
              <button
                className="consult-btn"
                onClick={submitConsultation}
                style={{ width: '100%', marginTop: '8px' }}
              >
                ✅ Send to Doctor & Admin
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default DoctorDetail;

