import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Plus, Search, Calendar, MapPin, Grid, SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const Dashboard = () => {
  const { user, apiCall } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);

  // Typewriter effect state
  const fullTitle = "Explore the World";
  const fullSubtitle = "Empowering personalized travel planning with custom itineraries, local activities, and budget tracking.";

  const [typedTitle, setTypedTitle] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setHeroMounted(true);

    const fetchData = async () => {
      try {
        const tripData = await apiCall('/api/trips');
        setTrips(tripData);

        const destData = await apiCall('/api/destinations');
        setDestinations(destData);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Typewriter effect timer
    let titleIndex = 0;
    let subtitleIndex = 0;

    const titleTimer = setInterval(() => {
      if (titleIndex < fullTitle.length) {
        titleIndex++;
        setTypedTitle(fullTitle.slice(0, titleIndex));
      } else {
        clearInterval(titleTimer);
        const subtitleTimer = setInterval(() => {
          if (subtitleIndex < fullSubtitle.length) {
            subtitleIndex++;
            setTypedSubtitle(fullSubtitle.slice(0, subtitleIndex));
          } else {
            clearInterval(subtitleTimer);
            setIsTypingComplete(true);
          }
        }, 18);
      }
    }, 60);

    return () => {
      clearInterval(titleTimer);
    };
  }, []);

  // Handler for search navigation
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Filter regional selections dynamically if search is entered in dashboard
  const filteredDestinations = destinations.filter(dest => 
    dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleDestinations = showAllDestinations ? filteredDestinations : filteredDestinations.slice(0, 6);

  // Render title with green gradient highlight on "World"
  const renderTypedTitle = () => {
    if (!typedTitle) return null;
    const baseText = "Explore the ";
    if (typedTitle.length <= baseText.length) {
      return <span>{typedTitle}</span>;
    }
    const mainPart = typedTitle.slice(0, baseText.length);
    const highlightedPart = typedTitle.slice(baseText.length);
    return (
      <>
        <span>{mainPart}</span>
        <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
          {highlightedPart}
        </span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 overflow-x-hidden">
      
      {/* Hero Banner with Smooth Image Zoom & Dark Overlay */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#121212]">
        
        {/* Background Image */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out transform ${
            heroMounted ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
          }`}
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600')" }}
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#121212]" />

        {/* Typewriter Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-12 max-w-7xl mx-auto space-y-2">
          <div className="transition-all duration-700">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-wider text-white drop-shadow-2xl">
              {renderTypedTitle()}
              {typedTitle.length < fullTitle.length && (
                <span className="inline-block text-green-400 font-normal animate-pulse ml-1">|</span>
              )}
            </h1>
            
            {(typedTitle.length >= fullTitle.length || typedSubtitle) && (
              <p className="text-gray-300 mt-2 text-xs sm:text-base font-medium max-w-xl drop-shadow-md min-h-[48px]">
                {typedSubtitle}
                {!isTypingComplete && typedTitle.length >= fullTitle.length && (
                  <span className="inline-block text-green-400 font-bold animate-pulse ml-0.5">|</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-8">
        
        {/* Search Bar - overlaps the hero banner */}
        <form onSubmit={handleSearchSubmit} className="bg-[#1e1e1e]/90 backdrop-blur-md p-3 sm:p-4 border border-[#2d2d2d] rounded-2xl flex flex-col md:flex-row items-center gap-3 sm:gap-4 shadow-2xl">
          <div className="relative flex-grow w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bar ...... (e.g. Paris, Tokyo, Paragliding)"
              className="pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-xl w-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="flex w-full md:w-auto flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2">
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs sm:text-sm text-gray-300 hover:bg-[#333] hover:text-white whitespace-nowrap transition">
              <Grid size={15} />
              <span>Group by</span>
            </button>
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs sm:text-sm text-gray-300 hover:bg-[#333] hover:text-white whitespace-nowrap transition">
              <SlidersHorizontal size={15} />
              <span>Filter</span>
            </button>
            <button type="button" className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs sm:text-sm text-gray-300 hover:bg-[#333] hover:text-white whitespace-nowrap transition">
              <ArrowUpDown size={15} />
              <span>Sort by...</span>
            </button>
          </div>
        </form>

        {/* Top Regional Selections row of square cards */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4 border-b border-[#2d2d2d] pb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">Top Regional Selections</h3>
            <span className="text-xs text-gray-400">{filteredDestinations.length} destinations</span>
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Loading cities...</div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-gray-500 py-4">No regional selections found.</div>
          ) : (
            <div className="relative space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {visibleDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(dest.name)}`)}
                    className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl overflow-hidden cursor-pointer hover:border-green-500 transition duration-300 shadow-md aspect-square relative group"
                  >
                    <img
                      src={dest.imageUrl || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400'}
                      alt={dest.name}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 sm:p-3 flex flex-col justify-end">
                      <p className="text-xs sm:text-sm font-bold text-white leading-tight">{dest.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{dest.country}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* View More Button below grid */}
              {filteredDestinations.length > 6 && !showAllDestinations && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAllDestinations(true)}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-[#1e1e1e] border border-green-500/40 text-green-400 hover:bg-green-600 hover:text-white hover:border-green-500 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    <span>View More Destinations ({filteredDestinations.length})</span>
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}

              {/* Show Less Button when expanded */}
              {showAllDestinations && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setShowAllDestinations(false)}
                    className="flex items-center space-x-2 px-6 py-2 bg-[#1e1e1e] border border-[#333] hover:border-gray-500 text-gray-300 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition shadow-md"
                  >
                    <span>Show Less</span>
                    <ChevronUp size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previous Trips vertical card list row */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 border-b border-[#2d2d2d] pb-2 tracking-wide">Previous Trips</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] border-dashed rounded-2xl p-8 text-center text-gray-500 text-sm">
              No trips planned yet. Click "+ Plan a trip" to begin your journey!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {trips.slice(0, 4).map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl overflow-hidden cursor-pointer hover:border-green-500 hover:-translate-y-1 transition duration-300 shadow-lg flex flex-col h-auto sm:h-72"
                >
                  <div className="h-28 sm:h-36 w-full overflow-hidden relative flex-shrink-0">
                    <img
                      src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'}
                      alt={trip.name}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'; }}
                      className="w-full h-full object-cover"
                    />
                    {trip.isPublic && (
                      <span className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Public
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">{trip.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{trip.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#2d2d2d] mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} className="text-green-500" />
                        <span className="text-[11px] sm:text-xs">{trip.startDate}</span>
                      </div>
                      <span className="font-bold text-green-500 text-xs sm:text-sm">{formatAmount(trip.budget)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Action Button for mobile & desktop */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => navigate('/create-trip')}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-sm sm:text-base transition-transform transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>PLAN A TRIP</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
