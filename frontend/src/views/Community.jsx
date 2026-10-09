import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Grid, SlidersHorizontal, ArrowUpDown, Copy, Calendar, MessageSquare, Heart, Bookmark } from 'lucide-react';

const Community = () => {
  const { apiCall } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  const [sharedTrips, setSharedTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState(null);

  useEffect(() => {
    fetchSharedTrips();
  }, []);

  const fetchSharedTrips = async () => {
    try {
      const data = await apiCall('/api/trips/public');
      setSharedTrips(data);
    } catch (err) {
      console.error('Failed to fetch shared trips', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTrip = async (e, tripId) => {
    e.stopPropagation();
    setCopyingId(tripId);
    try {
      const cloned = await apiCall(`/api/trips/public/${tripId}/copy`, {
        method: 'POST',
      });
      alert(`Itinerary successfully cloned to your trips! You can edit it now.`);
      navigate(`/trips/${cloned.id}/edit`);
    } catch (err) {
      console.error('Failed to clone trip', err);
      alert('Error cloning trip: ' + err.message);
    } finally {
      setCopyingId(null);
    }
  };

  const filteredShared = sharedTrips.filter(item =>
    item.trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.trip.description && item.trip.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6 pb-24 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title */}
        <div className="border-b border-[#2d2d2d] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">Community</h1>
            <p className="text-xs text-gray-400 mt-1">Explore, share, and duplicate travel plans created by other GlobeTrotters</p>
          </div>
        </div>

        {/* Search header exactly like mockup 10 */}
        <div className="bg-[#1e1e1e] p-4 border border-[#2d2d2d] rounded-xl flex flex-col md:flex-row items-center gap-4 shadow-md">
          <div className="relative flex-grow w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Search size={17} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bar ......"
              className="pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-lg w-full text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="flex w-full md:w-auto items-center space-x-2">
            <button type="button" className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-gray-300 hover:bg-[#333] hover:text-white transition">
              <Grid size={14} />
              <span>Group by</span>
            </button>
            <button type="button" className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-gray-300 hover:bg-[#333] hover:text-white transition">
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
            <button type="button" className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-gray-300 hover:bg-[#333] hover:text-white transition">
              <ArrowUpDown size={14} />
              <span>Sort by...</span>
            </button>
          </div>
        </div>

        {/* Shared Trip Rows exactly like mockup 10 */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Loading community plans...</div>
        ) : filteredShared.length === 0 ? (
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] border-dashed rounded-xl p-12 text-center text-gray-500">
            No public shared trips found. Change a trip settings to public to see it here!
          </div>
        ) : (
          <div className="space-y-6">
            {filteredShared.map((item) => (
              <div
                key={item.trip.id}
                onClick={() => navigate(`/shared/${item.trip.id}`)}
                className="flex items-start space-x-4 cursor-pointer group"
              >
                {/* Left: Circular User Avatar exactly like mockup 10 */}
                <div className="w-14 h-14 rounded-full border-2 border-green-500 overflow-hidden shadow-lg bg-[#2c2c2c] flex-shrink-0 relative group-hover:border-green-400 transition">
                  <img
                    src={item.creatorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={item.creatorName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right: Large details card exactly like mockup 10 */}
                <div className="flex-grow bg-[#1e1e1e] border border-[#2d2d2d] group-hover:border-green-500 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between transition">
                  <div className="space-y-1 w-full md:w-3/4">
                    <h3 className="font-bold text-lg text-white leading-tight">{item.trip.name}</h3>
                    <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">Created by: {item.creatorName}</p>
                    <p className="text-xs text-gray-400 font-medium flex items-center space-x-1.5">
                      <Calendar size={12} />
                      <span>{item.trip.startDate} to {item.trip.endDate} • {item.destinationCount} stops</span>
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.trip.description || 'Check out my personalized day-by-day travel plan!'}</p>
                  </div>
                  
                  <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-[#2d2d2d] pt-3 md:pt-0">
                    <span className="text-sm font-bold text-green-500">{formatAmount(item.trip.budget)}</span>
                    <button
                      onClick={(e) => handleCopyTrip(e, item.trip.id)}
                      disabled={copyingId === item.trip.id}
                      className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow transition"
                    >
                      <Copy size={13} />
                      <span>{copyingId === item.trip.id ? 'Copying...' : 'Copy Trip'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Community;
