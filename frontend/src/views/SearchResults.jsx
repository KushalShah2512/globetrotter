import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Grid, SlidersHorizontal, ArrowUpDown, Plus, Check, Clock, Compass, MapPin, Sparkles } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const preselectedDestId = searchParams.get('destinationId') || '';
  const preselectedTripId = searchParams.get('tripId') || '';

  const { apiCall } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add to trip modal state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [targetTripId, setTargetTripId] = useState(preselectedTripId);
  const [targetStopId, setTargetStopId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [stops, setStops] = useState([]);
  const [adding, setAdding] = useState(false);

  // Filter panel states
  const [showFilters, setShowFilters] = useState(false);
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  useEffect(() => {
    fetchResults();
    fetchUserTrips();
  }, [searchParams]);

  useEffect(() => {
    if (targetTripId) {
      fetchStopsForTrip(targetTripId);
    } else {
      setStops([]);
      setTargetStopId('');
    }
  }, [targetTripId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Fetch matching destinations
      const destList = await apiCall(`/api/destinations?search=${encodeURIComponent(searchTerm)}`);
      setDestinations(destList);

      // 2. Fetch activities for matched destinations or by search keyword
      let allActivities = [];

      if (preselectedDestId) {
        const actList = await apiCall(`/api/activities?destinationId=${preselectedDestId}`);
        allActivities = actList;
      } else if (destList && destList.length > 0) {
        // Fetch ALL activities for each matched destination so recommendations/suggestions are displayed!
        const promises = destList.map(d =>
          apiCall(`/api/activities?destinationId=${d.id}`).catch(() => [])
        );
        const destActResults = await Promise.all(promises);
        allActivities = destActResults.flat();
      } else {
        const allDests = await apiCall('/api/destinations');
        const promises = allDests.map(d =>
          apiCall(`/api/activities?destinationId=${d.id}&search=${encodeURIComponent(searchTerm)}`).catch(() => [])
        );
        const actResults = await Promise.all(promises);
        allActivities = actResults.flat();
      }

      setActivities(allActivities);
    } catch (err) {
      console.error('Search query failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTrips = async () => {
    try {
      const data = await apiCall('/api/trips');
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips for search modal', err);
    }
  };

  const fetchStopsForTrip = async (tripId) => {
    try {
      const data = await apiCall(`/api/trips/${tripId}/stops`);
      setStops(data);
      if (data.length > 0) {
        setTargetStopId(data[0].id.toString());
        setTargetDate(data[0].arrivalDate);
      }
    } catch (err) {
      console.error('Failed to load trip stops', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    if (!targetTripId || !targetStopId || !selectedActivity) {
      alert('Please select a trip and stop section to add this activity.');
      return;
    }

    setAdding(true);
    try {
      await apiCall(`/api/stops/${targetStopId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activityId: selectedActivity.id,
          name: selectedActivity.name,
          scheduledDate: targetDate || '2026-08-25',
          scheduledTime: targetTime || '10:00',
          cost: selectedActivity.cost,
        }),
      });

      alert(`"${selectedActivity.name}" added to your trip successfully!`);
      setSelectedActivity(null);
      navigate(`/trips/${targetTripId}`);
    } catch (err) {
      console.error('Failed to add activity', err);
      alert('Error adding activity: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  // Client-side filtering logic
  const filteredDestinations = destinations.filter(dest => {
    if (country && !dest.country.toLowerCase().includes(country.toLowerCase())) return false;
    if (region && !dest.region.toLowerCase().includes(region.toLowerCase())) return false;
    return true;
  });

  const filteredActivities = activities.filter(act => {
    if (category && act.category !== category) return false;
    if (maxCost && act.cost > parseFloat(maxCost)) return false;
    if (maxDuration && act.durationMinutes > parseInt(maxDuration)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Search Header Bar */}
        <form onSubmit={handleSearchSubmit} className="bg-[#1e1e1e] p-4 border border-[#2d2d2d] rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xl">
          <div className="relative flex-grow w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search destinations or activities... (e.g. Tokyo, Paris, Sushi, Museum)"
              className="pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-xl w-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              showFilters ? 'bg-green-600 text-white' : 'bg-[#252525] text-gray-300 border border-[#3d3d3d] hover:bg-[#333]'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filter</span>
          </button>
        </form>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Japan, France"
                className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white focus:outline-none focus:border-green-500"
              >
                <option value="">All Categories</option>
                <option value="activities">Activities & Sightseeing</option>
                <option value="meals">Dining & Food Tours</option>
                <option value="transport">Transport & Cruises</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Cost ({currency.symbol})</label>
              <input
                type="number"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Max Duration (mins)</label>
              <input
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        )}

        {/* Search Results Display */}
        <div className="space-y-8">
          
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading destination suggestions...</div>
          ) : (filteredDestinations.length === 0 && filteredActivities.length === 0) ? (
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] border-dashed rounded-2xl p-12 text-center text-gray-500">
              No matching destinations or activities found. Try adjusting your search query.
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Matched City Destination Overview Cards */}
              {filteredDestinations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide border-b border-[#2d2d2d] pb-2 flex items-center space-x-2">
                    <MapPin size={20} className="text-green-500" />
                    <span>Destination Overview</span>
                  </h2>

                  {filteredDestinations.map((dest) => (
                    <div
                      key={`dest-${dest.id}`}
                      className="bg-[#1e1e1e] border border-green-500/50 rounded-2xl overflow-hidden shadow-2xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between hover:border-green-400 transition"
                    >
                      <div className="flex flex-col md:flex-row gap-5 items-center w-full md:w-3/4">
                        <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden border border-[#2d2d2d] flex-shrink-0">
                          <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center md:text-left space-y-1.5 w-full">
                          <h3 className="font-extrabold text-xl text-white">{dest.name}, {dest.country}</h3>
                          <p className="text-xs text-green-400 font-bold uppercase tracking-wider">{dest.region} · Popularity {dest.popularity}/5</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{dest.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => navigate('/create-trip')}
                          className="w-full px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md whitespace-nowrap"
                        >
                          Plan Trip to {dest.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Activities & Places to Visit */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center space-x-2">
                    <Sparkles size={20} className="text-yellow-400 animate-pulse" />
                    <span>
                      {filteredDestinations.length === 1
                        ? `Suggested Places & Experiences in ${filteredDestinations[0].name}`
                        : 'Recommended Places to Visit & Activities'}
                    </span>
                  </h2>
                  <span className="text-xs text-gray-400">{filteredActivities.length} experience{filteredActivities.length !== 1 ? 's' : ''} available</span>
                </div>

                {filteredActivities.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">No specific activity suggestions found for this search.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredActivities.map((act) => (
                      <div
                        key={`act-${act.id}`}
                        className="bg-[#1e1e1e] border border-[#2d2d2d] hover:border-green-500/50 rounded-2xl overflow-hidden shadow-lg p-4 sm:p-5 flex flex-col justify-between transition duration-300 group"
                      >
                        <div className="flex gap-4 items-start">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#2d2d2d] flex-shrink-0 relative">
                            <img
                              src={act.imageUrl}
                              alt={act.name}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300'; }}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                              {act.category}
                            </span>
                          </div>

                          <div className="space-y-1.5 flex-grow min-w-0 flex flex-col justify-between h-full">
                            <div>
                              <h3 className="font-bold text-base text-white group-hover:text-green-400 transition line-clamp-1">{act.name}</h3>
                              <div className="text-xs text-gray-400 font-medium flex items-center space-x-2 mt-0.5">
                                <span className="flex items-center text-gray-300"><Clock size={12} className="mr-1 text-green-500" /> {act.durationMinutes} mins</span>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mt-1">{act.description}</p>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => setSelectedActivity(act)}
                                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 whitespace-nowrap"
                              >
                                <Plus size={14} />
                                <span>Add to Trip</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Add To Trip Modal Dialog */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white border-b border-[#2d2d2d] pb-2">
              Add "{selectedActivity.name}" to Trip
            </h3>

            {trips.length === 0 ? (
              <div className="text-sm text-gray-400 space-y-3 py-2">
                <p>You haven't created any trips yet. Create a trip first to add this experience!</p>
                <button
                  onClick={() => { setSelectedActivity(null); navigate('/create-trip'); }}
                  className="w-full py-2 bg-green-600 text-white rounded-xl font-bold text-xs uppercase"
                >
                  Create New Trip
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddActivitySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Target Trip</label>
                  <select
                    value={targetTripId}
                    onChange={(e) => setTargetTripId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="">Select a trip...</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.startDate})</option>
                    ))}
                  </select>
                </div>

                {stops.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Select Trip Stop / City</label>
                    <select
                      value={targetStopId}
                      onChange={(e) => {
                        setTargetStopId(e.target.value);
                        const selectedStop = stops.find(s => s.id.toString() === e.target.value);
                        if (selectedStop) setTargetDate(selectedStop.arrivalDate);
                      }}
                      required
                      className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white focus:outline-none focus:border-green-500"
                    >
                      {stops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.destination.name} ({s.arrivalDate} to {s.departureDate})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time</label>
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#2d2d2d]">
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="px-4 py-2 bg-[#252525] text-gray-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    {adding ? 'Adding...' : 'Confirm & Add'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
