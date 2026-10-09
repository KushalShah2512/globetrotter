import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';

// Views
import LoginSignup from './views/LoginSignup';
import Dashboard from './views/Dashboard';
import CreateTrip from './views/CreateTrip';
import MyTrips from './views/MyTrips';
import ItineraryBuilder from './views/ItineraryBuilder';
import ItineraryTimeline from './views/ItineraryTimeline';
import SearchResults from './views/SearchResults';
import Community from './views/Community';
import SharedItinerary from './views/SharedItinerary';
import TripCalendar from './views/TripCalendar';
import UserProfile from './views/UserProfile';
import AdminDashboard from './views/AdminDashboard';

// Protected Route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">
        Authenticating session...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">
        Authenticating session...
      </div>
    );
  }

  return user && user.email === 'admin@globetrotter.com' ? children : <Navigate to="/" replace />;
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <Router>
      <div className="min-h-screen bg-[#121212] text-gray-200">
        {/* Render navbar only for authenticated users */}
        {user && <Navbar />}
        
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginSignup />} />

          {/* Public Read-Only Share Link */}
          <Route path="/shared/:id" element={<SharedItinerary />} />

          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/create-trip" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
          <Route path="/trips" element={<PrivateRoute><MyTrips /></PrivateRoute>} />
          <Route path="/trips/:id" element={<PrivateRoute><ItineraryTimeline /></PrivateRoute>} />
          <Route path="/trips/:id/edit" element={<PrivateRoute><ItineraryBuilder /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><SearchResults /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><TripCalendar /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
