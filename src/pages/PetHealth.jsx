import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import './PetHealth.css';

function PetHealth() {
    const [petName, setPetName] = useState('My Pet');
    const [vaccines, setVaccines] = useState([
        { id: 1, name: 'Rabies', date: '2025-01-15', status: 'Done' },
        { id: 2, name: 'Distemper', date: '2025-06-20', status: 'Due' }
    ]);
    const [showVaccineForm, setShowVaccineForm] = useState(false);

    const [weights, setWeights] = useState([
        { id: 1, value: 12.5, date: '2025-01-10' },
        { id: 2, value: 12.8, date: '2025-02-12' }
    ]);
    const [showWeightForm, setShowWeightForm] = useState(false);

    const [appointments, setAppointments] = useState([
        { id: 1, doctor: 'Dr. Smith', date: '2025-03-05', time: '10:00 AM' }
    ]);
    const [showApptForm, setShowApptForm] = useState(false);

    // Forms State
    const [newVaccine, setNewVaccine] = useState({ name: '', date: '' });
    const [newWeight, setNewWeight] = useState({ value: '', date: '' });
    const [newAppt, setNewAppt] = useState({ doctor: '', date: '', time: '' });

    const navigate = useNavigate();

    useEffect(() => {
        // Load Pet Name
        const loadProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userId = session.user.id;
                const userProfileKey = `pets_${userId}`;
                const stored = localStorage.getItem(userProfileKey);
                if (stored) {
                    const pets = JSON.parse(stored);
                    if (pets.length > 0) setPetName(pets[0].name);
                }
            }
        };
        loadProfile();

        // Load Health Data
        const savedVaccines = localStorage.getItem('pet_vaccines');
        if (savedVaccines) setVaccines(JSON.parse(savedVaccines));

        const savedWeights = localStorage.getItem('pet_weights');
        if (savedWeights) setWeights(JSON.parse(savedWeights));

        const savedAppts = localStorage.getItem('pet_appointments');
        if (savedAppts) setAppointments(JSON.parse(savedAppts));
    }, []);

    const addVaccine = (e) => {
        e.preventDefault();
        if (!newVaccine.name || !newVaccine.date) return;
        const updated = [...vaccines, { id: Date.now(), name: newVaccine.name, date: newVaccine.date, status: 'Upcoming' }];
        setVaccines(updated);
        localStorage.setItem('pet_vaccines', JSON.stringify(updated));
        setNewVaccine({ name: '', date: '' });
        setShowVaccineForm(false);
    };

    const addWeight = (e) => {
        e.preventDefault();
        if (!newWeight.value || !newWeight.date) return;
        const updated = [...weights, { id: Date.now(), value: parseFloat(newWeight.value), date: newWeight.date }];
        setWeights(updated);
        localStorage.setItem('pet_weights', JSON.stringify(updated));
        setNewWeight({ value: '', date: '' });
        setShowWeightForm(false);
    };

    const addAppt = (e) => {
        e.preventDefault();
        if (!newAppt.doctor || !newAppt.date) return;
        const updated = [...appointments, { id: Date.now(), doctor: newAppt.doctor, date: newAppt.date, time: newAppt.time }];
        setAppointments(updated);
        localStorage.setItem('pet_appointments', JSON.stringify(updated));
        setNewAppt({ doctor: '', date: '', time: '' });
        setShowApptForm(false);
    };

    return (
        <div className="health-container">
            <div className="health-header">
                <h1>{petName}'s Health</h1>
                <p>Dashboard & Medical Records</p>
                <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', marginTop: '10px' }}>
                    ← Back Home
                </button>
            </div>

            <div className="health-grid">
                {/* Vaccinations */}
                <div className="health-card">
                    <div className="card-header">
                        <h2>💉 Vaccinations</h2>
                        <button className="add-btn" onClick={() => setShowVaccineForm(!showVaccineForm)}>+</button>
                    </div>

                    {showVaccineForm && (
                        <form onSubmit={addVaccine} className="health-form">
                            <input
                                className="health-input"
                                placeholder="Vaccine Name (e.g. Rabies)"
                                value={newVaccine.name}
                                onChange={e => setNewVaccine({ ...newVaccine, name: e.target.value })}
                            />
                            <input
                                type="date"
                                className="health-input"
                                value={newVaccine.date}
                                onChange={e => setNewVaccine({ ...newVaccine, date: e.target.value })}
                            />
                            <button type="submit" className="save-btn">Save Record</button>
                        </form>
                    )}

                    <ul className="health-list">
                        {vaccines.map(v => (
                            <li key={v.id} className="health-item">
                                <div className="item-date">{v.date}</div>
                                <div className="item-details">
                                    <h4>{v.name}</h4>
                                    <p>{v.status}</p>
                                </div>
                                <span className={`status-badge ${v.status === 'Done' ? 'status-done' : 'status-due'}`}>
                                    {v.status === 'Done' ? '✓' : '⚠'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Weights */}
                <div className="health-card">
                    <div className="card-header">
                        <h2>⚖️ Weight Log</h2>
                        <button className="add-btn" onClick={() => setShowWeightForm(!showWeightForm)}>+</button>
                    </div>

                    {showWeightForm && (
                        <form onSubmit={addWeight} className="health-form">
                            <input
                                type="number" step="0.1"
                                className="health-input"
                                placeholder="Weight (kg)"
                                value={newWeight.value}
                                onChange={e => setNewWeight({ ...newWeight, value: e.target.value })}
                            />
                            <input
                                type="date"
                                className="health-input"
                                value={newWeight.date}
                                onChange={e => setNewWeight({ ...newWeight, date: e.target.value })}
                            />
                            <button type="submit" className="save-btn">Log Weight</button>
                        </form>
                    )}

                    <ul className="health-list">
                        {weights.map(w => (
                            <li key={w.id} className="health-item">
                                <div className="item-date">{w.date}</div>
                                <div className="item-details">
                                    <h4>{w.value} kg</h4>
                                    <p>Recorded</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Appointments */}
                <div className="health-card">
                    <div className="card-header">
                        <h2>📅 Vet Visits</h2>
                        <button className="add-btn" onClick={() => setShowApptForm(!showApptForm)}>+</button>
                    </div>

                    {showApptForm && (
                        <form onSubmit={addAppt} className="health-form">
                            <input
                                className="health-input"
                                placeholder="Doctor / Clinic Name"
                                value={newAppt.doctor}
                                onChange={e => setNewAppt({ ...newAppt, doctor: e.target.value })}
                            />
                            <input
                                className="health-input"
                                placeholder="Time (e.g. 10:00 AM)"
                                value={newAppt.time}
                                onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                            />
                            <input
                                type="date"
                                className="health-input"
                                value={newAppt.date}
                                onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                            />
                            <button type="submit" className="save-btn">Scheduling Visit</button>
                        </form>
                    )}

                    <ul className="health-list">
                        {appointments.map(a => (
                            <li key={a.id} className="health-item">
                                <div className="item-date">{a.date}</div>
                                <div className="item-details">
                                    <h4>{a.doctor}</h4>
                                    <p>{a.time}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PetHealth;
