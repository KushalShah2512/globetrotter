import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Save, User as UserIcon, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, Camera, Loader2, LogOut, Coins } from 'lucide-react';

const UserProfile = () => {
  const { user, updateProfile, deleteAccount, logout, apiCall } = useAuth();
  const { currencyCode, changeCurrency, currencies, formatAmount } = useCurrency();
  const navigate = useNavigate();

  // Profile Form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [additionalInformation, setAdditionalInformation] = useState(user?.additionalInformation || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [languagePreference, setLanguagePreference] = useState(user?.languagePreference || 'en');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [userTrips, setUserTrips] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleLocalUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('gt_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('/api/auth/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const data = await res.json();
      if (data.url) {
        setPhotoUrl(data.url);
        // Immediately persist the new photo URL to the database
        await updateProfile({
          firstName,
          lastName,
          phoneNumber,
          city,
          country,
          additionalInformation,
          photoUrl: data.url,
          languagePreference,
        });
        setSuccess('Image uploaded and saved!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhoneNumber(user.phoneNumber || '');
      setCity(user.city || '');
      setCountry(user.country || '');
      setAdditionalInformation(user.additionalInformation || '');
      setPhotoUrl(user.photoUrl || '');
      setLanguagePreference(user.languagePreference || 'en');
      fetchUserTrips();
    }
  }, [user]);

  const fetchUserTrips = async () => {
    try {
      const data = await apiCall('/api/trips');
      setUserTrips(data);
    } catch (err) {
      console.error('Failed to load profile trips', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await updateProfile({
        firstName,
        lastName,
        phoneNumber,
        city,
        country,
        additionalInformation,
        photoUrl,
        languagePreference,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('WARNING: Are you sure you want to delete your account permanently? This action cannot be undone.')) {
      try {
        await deleteAccount();
        navigate('/');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Split trips for bottom section: Preplanned vs Previous
  const today = new Date().toISOString().split('T')[0];
  const preplannedTrips = userTrips.filter(t => t.startDate >= today);
  const previousTrips = userTrips.filter(t => t.endDate < today);

  const TripCardGrid = ({ title, list }) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-3 border-b border-[#2d2d2d] pb-1 uppercase tracking-wider">{title}</h3>
        {list.length === 0 ? (
          <p className="text-gray-500 text-sm">No trips in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {list.slice(0, 3).map((trip) => (
              <div
                key={trip.id}
                className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl overflow-hidden shadow-md flex flex-col justify-between h-72"
              >
                <div className="h-32 w-full overflow-hidden">
                  <img
                    src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'}
                    alt={trip.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{trip.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{trip.description || 'No description.'}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2d2d2d]">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center space-x-1">
                      <Calendar size={11} className="text-green-500" />
                      <span>{trip.startDate}</span>
                    </span>
                    <button
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Title */}
        <div className="border-b border-[#2d2d2d] pb-4">
          <h1 className="text-2xl font-extrabold text-white tracking-wide">My Profile</h1>
        </div>

        {/* User Details Form Section exactly like mockup 7 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left Panel: Profile Photo */}
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="relative group w-36 h-36 sm:w-40 sm:h-40">
              <div className="w-full h-full rounded-full border-4 border-green-500 overflow-hidden shadow-xl bg-[#2c2c2c] flex items-center justify-center">
                <img
                  src={photoUrl || '/default-avatar.png'}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Professional Camera Badge Upload Icon */}
              <label
                htmlFor="profile-upload"
                className="absolute bottom-1 right-1 bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-full cursor-pointer shadow-2xl border-2 border-[#1e1e1e] transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center"
                title="Upload New Photo"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Camera size={16} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalUpload}
                  className="hidden"
                  id="profile-upload"
                />
              </label>
            </div>
            <h3 className="text-lg font-bold text-white mt-4">{firstName} {lastName}</h3>
            <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">{user?.email}</p>
          </div>

          {/* Right Panel: Editable User Details exactly like mockup 7 */}
          <form onSubmit={handleUpdate} className="md:col-span-2 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-green-500 uppercase tracking-wider border-b border-[#2d2d2d] pb-2">
              User Details
            </h2>

            {success && (
              <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3 text-green-200 text-xs flex items-center space-x-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+xx xxxxxxxx"
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Language Preference</label>
                <select
                  value={languagePreference}
                  onChange={(e) => setLanguagePreference(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
                >
                  <option value="en">English (en)</option>
                  <option value="fr">Français (fr)</option>
                  <option value="es">Español (es)</option>
                  <option value="ja">日本語 (ja)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                  <Coins size={12} className="text-green-500" />
                  <span>Currency Preference</span>
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => changeCurrency(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Bio / User Information</label>
              <textarea
                value={additionalInformation}
                onChange={(e) => setAdditionalInformation(e.target.value)}
                rows="3"
                className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md transition"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>

        </div>

        {/* Bottom Lists exactly like mockup 7 */}
        <div className="space-y-8 pt-4">
          <TripCardGrid title="Preplanned Trips" list={preplannedTrips} />
          <TripCardGrid title="Previous Trips" list={previousTrips} />
        </div>

        {/* Sign Out Section */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <LogOut size={16} className="text-green-500" />
              <span>Account Session</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1">Sign out of your active GlobeTrotter session on this device.</p>
          </div>
          <button
            onClick={logout}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md whitespace-nowrap flex items-center justify-center space-x-2"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Danger Zone: Delete Account at Bottom */}
        <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>Danger Zone</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1">Permanently delete your user account and erase all saved travel itineraries.</p>
          </div>
          <button
            onClick={handleDelete}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-950/40 border border-red-500/30 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
