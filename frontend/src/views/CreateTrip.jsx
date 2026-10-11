import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Save, Plus, ArrowLeft, Image, Compass, Info } from 'lucide-react';

const CreateTrip = () => {
  const { apiCall } = useAuth();
  const { currency, convertToBase, formatAmount } = useCurrency();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');

  // Loaded metadata
  const [destinations, setDestinations] = useState([]);
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch destinations
  useEffect(() => {
    const fetchDests = async () => {
      try {
        const destList = await apiCall('/api/destinations');
        setDestinations(destList);
      } catch (err) {
        console.error('Failed to load destinations', err);
      }
    };
    fetchDests();
  }, []);

  // Fetch suggestions when destination changes
  useEffect(() => {
    if (!destinationId) {
      setSuggestedActivities([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const activitiesList = await apiCall(`/api/activities?destinationId=${destinationId}`);
        setSuggestedActivities(activitiesList);

        // Auto-set cover photo from selected destination
        const selected = destinations.find(d => d.id.toString() === destinationId.toString());
        if (selected) {
          setCoverPhoto(selected.imageUrl);
        }
      } catch (err) {
        console.error('Failed to load suggested activities', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [destinationId, destinations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !destinationId || !startDate || !endDate) {
      alert('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    try {
      // 1. Create the Trip
      const trip = await apiCall('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          startDate,
          endDate,
          budget: budget ? convertToBase(parseFloat(budget)) : 0.0,
          coverPhoto: coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
          isPublic: false,
        }),
      });

      // 2. Automatically add the selected city stop to the trip stops list
      await apiCall(`/api/trips/${trip.id}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          destinationId: parseInt(destinationId),
          arrivalDate: startDate,
          departureDate: endDate,
        }),
      });

      // 3. Redirect to the Itinerary Builder for this trip (Screen 5)
      navigate(`/trips/${trip.id}/edit`);
    } catch (err) {
      console.error('Failed to create trip', err);
      alert('Error creating trip: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2d2d2d] transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">Create a New Trip</h1>
          </div>
        </div>

        {/* Plan a new trip Form exactly like mockup 4 */}
        <div className="w-full">
          <form onSubmit={handleSubmit} className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 space-y-4 shadow-lg w-full">
            <h2 className="text-lg font-bold text-green-500 uppercase tracking-wider mb-2">Plan a new trip</h2>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date (Trip Name / Header)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Vacation, Weekend Getaway"
                className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Select a Place</label>
              <select
                required
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white focus:outline-none focus:border-green-500 transition"
              >
                <option value="">-- Choose Destination --</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name}, {dest.country} ({dest.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Budget ({currency.symbol})</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1500"
                className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Trip Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write something about your trip..."
                rows="3"
                className="mt-1 block w-full px-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold shadow-md active:scale-95 transition"
            >
              <Save size={18} />
              <span>{saving ? 'Creating Trip...' : 'Create and Build Itinerary'}</span>
            </button>
          </form>
        </div>

        {/* Suggestion for Places to Visit/Activities to perform exactly like mockup 4 */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-[#2d2d2d]">
            Suggestion for Places to Visit/Activities to perform
          </h3>

          {!destinationId ? (
            <div className="text-center text-gray-500 py-12 flex flex-col items-center space-y-2">
              <Compass size={36} className="text-gray-600 animate-spin-slow" />
              <p className="text-sm">Please select a destination city above to view popular attractions and activities!</p>
            </div>
          ) : loadingSuggestions ? (
            <div className="text-center text-gray-400 py-12">Loading local attractions...</div>
          ) : suggestedActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No activities seeded for this location yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestedActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-[#252525] border border-[#3d3d3d] rounded-lg overflow-hidden flex flex-col h-44 shadow hover:border-green-500 transition duration-300"
                >
                  <div className="h-24 overflow-hidden relative">
                    <img
                      src={act.imageUrl || 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300'}
                      alt={act.name}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300'; }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-green-400">
                      {act.category}
                    </span>
                  </div>
                  <div className="p-3 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{act.name}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{act.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 pt-1 border-t border-[#3d3d3d]">
                      <span>{act.durationMinutes} mins</span>
                      <span className="font-semibold text-green-500">₹{act.cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateTrip;
