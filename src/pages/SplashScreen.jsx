import { useEffect } from 'react';
import './SplashScreen.css';

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <img src="/images/logo_premium.png" alt="Pawfect Care Logo" className="splash-logo" />
          <h1 className="app-title">Pawfect Care</h1>
        </div>
        <p className="tagline">Your Pet's Best Friend</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
}

export default SplashScreen;

