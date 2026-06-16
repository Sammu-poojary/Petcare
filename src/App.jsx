import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import { supabase } from './supabase';
import Login from './pages/Login';
import Register from './pages/Register';
import PetProfile from './pages/PetProfile';
import Home from './pages/Home';
import PetGrooming from './pages/services/PetGrooming';
import PetTraining from './pages/services/PetTraining';
import PetWalking from './pages/services/PetWalking';
import PetBoarding from './pages/services/PetBoarding';
import ConsultDoctor from './pages/services/ConsultDoctor';
import DoctorDetail from './pages/services/DoctorDetail';
import DogShow from './pages/services/DogShow';
import MedicalShop from './pages/services/MedicalShop';
import Cart from './pages/Cart';
import BookingSummary from './pages/BookingSummary';
import Payment from './pages/Payment';
import Notifications from './pages/Notifications';
import AboutUs from './pages/AboutUs';
import './App.css';
import ChatWidget from './components/ChatWidget';
import AdminSplash from "./admin/AdminSplash";
import AdminLogin from "./admin/AdminLogin";
import AdminRoute from "./admin/AdminRoute";
import AdminDashboard from "./admin/AdminDashboard";
import TrackOrder from "./pages/TrackOrder";
import LostAndFound from "./pages/LostAndFound";
import PetHealth from "./pages/PetHealth";
import Community from "./pages/Community";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const ensureProfile = async (user) => {
    if (!user) return;
    const login_method = user.app_metadata?.provider || 'email';
    const name = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const phone = user.user_metadata?.phone || null;
    const profileData = {
      id: user.id || `demo-${Date.now()}`,
      email: user.email,
      name: name,
      phone: phone,
      role: 'user',
      login_method: login_method
    };

    // Save to Supabase (if online)
    try {
      if (supabase && supabase.auth) {
        await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Supabase profile upsert failed:', err);
    }

    // Always save to local storage for Admin Dashboard visibility
    try {
      const localProfiles = JSON.parse(localStorage.getItem('petcare_local_profiles') || '[]');
      const exists = localProfiles.find(p => p.email === profileData.email);
      if (!exists) {
        localProfiles.push(profileData);
        localStorage.setItem('petcare_local_profiles', JSON.stringify(localProfiles));
      } else {
        // Update existing local profile with any new information
        const updated = localProfiles.map(p => p.email === profileData.email ? { ...p, ...profileData } : p);
        localStorage.setItem('petcare_local_profiles', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Local profile sync failed:', e);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      if (!supabase || !supabase.auth) {
        setLoading(false);
        return;
      }
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000));
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          timeout
        ]);
        const session = data?.session;

        if (session?.user) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');

          // Ensure profile exists in database
          await ensureProfile(session.user);

          // Get profile for this specific user
          const userId = session.user.id;
          const userProfileKey = `pets_${userId}`;
          const userHasProfileKey = `hasProfile_${userId}`;

          try {
            const storedPets = localStorage.getItem(userProfileKey);
            const storedHasProfile = localStorage.getItem(userHasProfileKey) === 'true';

            if (storedPets && storedHasProfile) {
              setHasProfile(true);
            } else {
              setHasProfile(false);
              localStorage.setItem(userHasProfileKey, 'false');
            }
          } catch (error) {
            console.error('Profile load error:', error);
            setHasProfile(false);
          }
        } else {
          // Demo/offline mode check
          const localAuth = localStorage.getItem('isAuthenticated') === 'true';
          if (localAuth) {
            setIsAuthenticated(true);
            setHasProfile(localStorage.getItem('hasProfile') === 'true');
          } else {
            setIsAuthenticated(false);
            setHasProfile(false);
            localStorage.removeItem('isAuthenticated');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Fallback to local storage if supabase is down
        const localAuth = localStorage.getItem('isAuthenticated') === 'true';
        if (localAuth) {
          setIsAuthenticated(true);
          setHasProfile(localStorage.getItem('hasProfile') === 'true');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Watch for auth state changes
    let subscription = null;
    if (supabase && supabase.auth) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');

          // Ensure profile exists in database
          ensureProfile(session.user);

          const userId = session.user.id;
          const userProfileKey = `pets_${userId}`;
          const userHasProfileKey = `hasProfile_${userId}`;

          try {
            const storedPets = localStorage.getItem(userProfileKey);
            const storedHasProfile = localStorage.getItem(userHasProfileKey) === 'true';

            if (storedPets && storedHasProfile) {
              setHasProfile(true);
            } else {
              setHasProfile(false);
              localStorage.setItem(userHasProfileKey, 'false');
            }
          } catch (error) {
            setHasProfile(false);
          }
        } else {
          setIsAuthenticated(false);
          setHasProfile(false);
          localStorage.removeItem('isAuthenticated');
        }
      });
      subscription = data.subscription;
    }

    // Close splash after 1.5s
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    // Wait a moment for session to be established, then check
    await new Promise(resolve => setTimeout(resolve, 300));
    const { data: { session } } = await supabase.auth.getSession();

    // Check if demo/offline login was triggered
    const isDemo = sessionStorage.getItem('justLoggedIn') === 'true';

    if (session?.user || isDemo) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');

      // Load user-specific profile or generic one
      if (session?.user) {
        // Ensure profile exists in database
        await ensureProfile(session.user);

        const userId = session.user.id;
        const userProfileKey = `pets_${userId}`;
        const userHasProfileKey = `hasProfile_${userId}`;

        try {
          const storedPets = localStorage.getItem(userProfileKey);
          const storedHasProfile = localStorage.getItem(userHasProfileKey) === 'true';

          if (storedPets && storedHasProfile) {
            setHasProfile(true);
          } else {
            setHasProfile(false);
            localStorage.setItem(userHasProfileKey, 'false');
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setHasProfile(false);
        }
      } else {
        // Demo/Offline Fallback
        setHasProfile(localStorage.getItem('hasProfile') === 'true');
      }
    }
  };

  const handleRegister = async (userData) => {
    // After register, ensure profile is reset so the user can fill it fresh
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || userData;

    const isDemo = localStorage.getItem('isAuthenticated') === 'true';

    if (user || isDemo) {
      setIsAuthenticated(true);
      setHasProfile(false);
      localStorage.setItem('isAuthenticated', 'true');

      if (user) {
        await ensureProfile(user);
        const userId = user.id;
        const userHasProfileKey = `hasProfile_${userId}`;
        localStorage.setItem(userHasProfileKey, 'false');
      } else {
        localStorage.setItem('hasProfile', 'false');
      }
    }
  };

  const handleGoogleLogin = async () => {
    // Check session after Google login
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');

      // Ensure profile exists in database
      await ensureProfile(session.user);

      // Load user-specific profile
      const userId = session.user.id;
      const userProfileKey = `pets_${userId}`;
      const userHasProfileKey = `hasProfile_${userId}`;

      try {
        const storedPets = localStorage.getItem(userProfileKey);
        const storedHasProfile = localStorage.getItem(userHasProfileKey) === 'true';

        if (storedPets && storedHasProfile) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
          localStorage.setItem(userHasProfileKey, 'false');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setHasProfile(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore errors but log for debugging
      console.warn('Supabase signOut error', e);
    }

    setIsAuthenticated(false);
    setHasProfile(false);
    localStorage.removeItem('isAuthenticated');
    // Note: We don't remove user-specific profile data on logout
    // so it persists for the next login
  };

  const handleProfileComplete = async () => {
    setHasProfile(true);

    // Save profile state for current user
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userId = session.user.id;
      const userHasProfileKey = `hasProfile_${userId}`;
      localStorage.setItem(userHasProfileKey, 'true');
    } else {
      // Fallback to old method if no session (shouldn't happen)
      localStorage.setItem('hasProfile', 'true');
    }
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f3f8',
        color: '#6c5ce7',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Loading Pawfect Care...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />}
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Register onRegister={handleRegister} />
            )
          }
        />
        <Route
          path="/pet-profile"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <PetProfile onComplete={handleProfileComplete} />
            )
          }
        />
        <Route
          path="/home"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : !hasProfile ? (
              <Navigate to="/pet-profile" replace />
            ) : (
              <Home onLogout={handleLogout} onToggleTheme={toggleDarkMode} isDarkMode={darkMode} />
            )
          }
        />
        <Route path="/services/grooming" element={<PetGrooming />} />
        <Route path="/services/training" element={<PetTraining />} />
        <Route path="/services/walking" element={<PetWalking />} />
        <Route path="/services/boarding" element={<PetBoarding />} />
        <Route path="/services/consult-doctor" element={<ConsultDoctor />} />
        <Route path="/services/doctor-detail" element={<DoctorDetail />} />
        <Route path="/services/dog-show" element={<DogShow />} />
        <Route path="/services/medical-shop" element={<MedicalShop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/booking-summary" element={<BookingSummary />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/lost-and-found" element={<LostAndFound />} />
        <Route path="/community" element={<Community />} />
        <Route
          path="/pet-health"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <PetHealth />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <Notifications />
            )
          }
        />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/admin" element={<AdminSplash />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />


      </Routes>
      <ChatWidget />
    </Router>
  );
}

export default App;
