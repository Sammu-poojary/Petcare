import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { addNotification, requestNotificationPermission } from '../../utils/notifications';
import Footer from '../../components/Footer';
import './ConsultDoctor.css';

function ConsultDoctor() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');

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

  const doctors = [
    {
      id: 1,
      name: 'Dr. Chandra Shekar',
      specialization: 'Veterinary Surgeon',
      experience: '10 years',
      phone: '+91 98765 43210',
      email: 'carepawfect5@gmail.com',
      rating: 4.8,
      image: '/images/dr_chandrashekar.webp'
    },
    {
      id: 2,
      name: 'Dr. Vijayakumar',
      specialization: 'Pet Dermatologist',
      experience: '8 years',
      phone: '+91 98765 43211',
      email: 'vijayakumar@petcare.com',
      rating: 4.7,
      image: '/images/dr_vijaykumar.webp'
    },
    {
      id: 3,
      name: 'Dr. Anjali Patel',
      specialization: 'Pet Cardiologist',
      experience: '12 years',
      phone: '+91 98765 43212',
      email: 'anjali.patel@petcare.com',
      rating: 4.9,
      image: '/images/dr_anjali.webp'
    },
    {
      id: 4,
      name: 'Dr. Vikram Singh',
      specialization: 'Pet Orthopedic',
      experience: '9 years',
      phone: '+91 98765 43213',
      email: 'vikram.singh@petcare.com',
      rating: 4.6,
      image: '/images/dr_vikram.jpg'
    },
    {
      id: 5,
      name: 'Dr. Meera Reddy',
      specialization: 'Pet Nutritionist',
      experience: '7 years',
      phone: '+91 98765 43214',
      email: 'meera.reddy@petcare.com',
      rating: 4.8,
      image: '/images/dr_meera.webp'
    },
    {
      id: 6,
      name: 'Dr. Arjun Nair',
      specialization: 'Emergency Care',
      experience: '11 years',
      phone: '+91 98765 43215',
      email: 'arjun.nair@petcare.com',
      rating: 4.9,
      image: '/images/dr_arjun.webp'
    }
  ];

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDoctorClick = (doctor) => {
    navigate('/services/doctor-detail', { state: { doctor } });
  };

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

  const saveToAdmin = async (drName, drSpecialization, serviceType) => {
    const serviceString = `${serviceType} (${drName})`;
    
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
      doctorName: drName,
      doctorSpecialization: drSpecialization,
      date: new Date().toISOString(),
      status: 'Pending',
      petName: getPetName(),
      service: serviceString
    };

    const existingAppointments = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
    localStorage.setItem('appointments_guest', JSON.stringify([...existingAppointments, newAppointment]));
  };

  const handleEmail = (e, doctor) => {
    e.stopPropagation();
    setSelectedDoctor(doctor);
    setShowEmailForm(true);
    setEmailMessage('');
  };

  const submitEmailInquiry = async () => {
    if (!emailMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    // Try sending email via Web3Forms API
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "8f07ec8c-1a02-4461-9881-7cdb6474a9fb",
          subject: `Consultation Inquiry for ${selectedDoctor.name}`,
          message: `Doctor: ${selectedDoctor.name}\nSpecialization: ${selectedDoctor.specialization}\n\nClient Message:\n${emailMessage}`,
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

    await saveToAdmin(selectedDoctor.name, selectedDoctor.specialization, 'Email Inquiry');

    // Enrich with message for admin
    const existing = JSON.parse(localStorage.getItem('appointments_guest') || '[]');
    if (existing.length > 0) {
      existing[existing.length - 1].issue = emailMessage;
      localStorage.setItem('appointments_guest', JSON.stringify(existing));
    }

    await notifyAndConfirm(
      'Email Inquiry Sent',
      `You sent an email to ${selectedDoctor.name}.`
    );

    alert(`Email successfully sent to ${selectedDoctor.email}!`);
    setShowEmailForm(false);
  };

  return (
    <div className="consult-container">
      <div className="consult-header">
        <button className="back-btn" onClick={() => navigate('/home')}>← Back</button>
        <h1>Consult a Doctor</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search doctors by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="pet-selection-section" style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#fff' }}>Select Your Pet</h2>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '1rem' }}
          >
            <option value="">Choose a pet</option>
            {pets.map((pet, idx) => (
              <option key={idx} value={pet.name}>{pet.name} ({pet.type})</option>
            ))}
            {!pets.length && <option value="My Pet">My Pet (Default)</option>}
          </select>
        </div>
      </div>

      <div className="consult-content">
        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="doctor-card"
              onClick={() => handleDoctorClick(doctor)}
            >
              <div className="doctor-image">
                <img src={doctor.image} alt={doctor.name} />
              </div>
              <h3>{doctor.name}</h3>
              <p className="specialization">{doctor.specialization}</p>
              <p className="experience">Experience: {doctor.experience}</p>
              <div className="rating">
                ⭐ {doctor.rating}
              </div>
              <div className="contact-buttons">
                <button
                  className="contact-btn email-btn"
                  onClick={(e) => handleEmail(e, doctor)}
                >
                  ✉️ Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Consult Doctor Videos Section */}
        <div className="consult-videos-section">
          <h2 className="consult-videos-title">Our Consultation Services</h2>
          <div className="consult-videos-container">
            <div className="consult-video-item">
              <video
                src="/videos/consultdr1.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="consult-video"
              />
            </div>
            
            <div className="consult-video-item">
              <video
                src="/videos/consultdr3.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="consult-video"
              />
            </div>
          </div>
        </div>
      </div>

      {showEmailForm && selectedDoctor && (
        <div className="admin-modal-overlay" onClick={() => setShowEmailForm(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', background: 'rgba(20, 16, 50, 0.95)', border: '1px solid rgba(162,155,254,0.25)', borderRadius: '24px', backdropFilter: 'blur(24px)' }}>
            <div className="modal-header">
              <h2 style={{ background: 'linear-gradient(90deg,#fff,#a29bfe)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Compose Email to {selectedDoctor.name}</h2>
              <button className="close-btn" onClick={() => setShowEmailForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Recipient Email</label>
                <p style={{ color: '#a29bfe', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 600 }}>{selectedDoctor.email}</p>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Your Message</label>
                <textarea
                  placeholder="Tell the doctor about your pet's condition..."
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
      <Footer />
    </div>
  );
}

export default ConsultDoctor;

