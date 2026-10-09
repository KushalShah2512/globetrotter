import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle, Mail, Lock, User, Phone, MapPin, Globe, Compass, Sparkles } from 'lucide-react';

const LoginSignup = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          city,
          country,
          additionalInformation: '',
          photoUrl,
        });
        setSuccess('Account created successfully! Logging you in...');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#121212] overflow-hidden">
      
      {/* Fullscreen Travel Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transform scale-105 filter brightness-75 transition-all duration-1000"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600')" }}
      />

      {/* Dark Vignette & Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/90 backdrop-blur-xs" />

      {/* Main Glassmorphism Container */}
      <div className="max-w-md w-full bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 shadow-inner">
              <Compass size={28} className="animate-spin-slow" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              Globe<span className="text-green-500">Trotter</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-medium">Your personalized travel planning companion</p>
        </div>



        {/* Circular Avatar Placeholder */}
        <div className="flex justify-center pt-1">
          <div className="w-20 h-20 rounded-full border-2 border-green-500 overflow-hidden shadow-xl bg-[#252525] flex items-center justify-center">
            <img
              src={photoUrl || '/default-avatar.png'}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2 text-red-300 text-xs shadow">
            <AlertCircle className="flex-shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-950/40 border border-green-500/30 rounded-xl p-3 text-green-300 text-xs text-center font-medium shadow">
            {success}
          </div>
        )}

        {/* Form Fields */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {isLogin ? (
            /* Sign In Fields */
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 pr-4 py-2.5 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-4 py-2.5 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Create Account Fields */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+xx xxxxxxxx"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="px-3 py-2 bg-[#252525]/80 border border-[#3d3d3d] rounded-xl w-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>
          )}

          {/* Form Action Button */}
          <button
            type="submit"
            className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-xl hover:shadow-green-500/20 active:scale-95 transition-all"
          >
            {isLogin ? (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle Link */}
        <div className="pt-3 border-t border-[#2d2d2d] text-center text-xs">
          <p className="text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-green-400 hover:text-green-300 font-bold transition underline"
            >
              {isLogin ? 'Sign up here' : 'Log in here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginSignup;
