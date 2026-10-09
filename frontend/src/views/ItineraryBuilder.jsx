import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Plus, Trash2, Calendar, IndianRupee, ArrowLeft, ArrowRight, Eye, MoveUp, MoveDown, Compass, Search, Coins } from 'lucide-react';

const ItineraryBuilder = () => {
  const { id } = useParams();
  const { apiCall } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New stop states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Stop details / local section budgets (stored in localStorage or simulated)
  const [stopBudgets, setStopBudgets] = useState({});

  useEffect(() => {
    fetchTripDetails();
    fetchDestinations();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const tripData = await apiCall(`/api/trips/${id}`);
      setTrip(tripData);

      const stopsData = await apiCall(`/api/trips/${id}/stops`);
      setStops(stopsData);

      // Initialize stop budgets map
      const budgets = {};
      stopsData.forEach(s => {
        // Read from localStorage or assign default (split of total budget divided by stop count)
        const saved = localStorage.getItem(`gt_stop_budget_${s.id}`);
        budgets[s.id] = saved ? parseFloat(saved) : (tripData.budget / (stopsData.length || 1)).toFixed(0);
      });
      setStopBudgets(budgets);
    } catch (err) {
      console.error('Failed to fetch trip details', err);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const destList = await apiCall('/api/destinations');
      setDestinations(destList);
    } catch (err) {
      console.error('Failed to load destinations', err);
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!selectedDestId || !arrivalDate || !departureDate) return;

    try {
      await apiCall(`/api/trips/${id}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          destinationId: parseInt(selectedDestId),
          arrivalDate,
          departureDate,
        }),
      });

      // Clear form
      setSelectedDestId('');
      setArrivalDate('');
      setDepartureDate('');
      setShowAddForm(false);
      
      // Refresh stops
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to add stop', err);
      alert(err.message);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Are you sure you want to remove this section/stop? This will also remove any activities planned in this section.')) return;
    try {
      await apiCall(`/api/trips/${id}/stops/${stopId}`, {
        method: 'DELETE',
      });
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to delete stop', err);
    }
  };

  const handleUpdateStopBudget = (stopId, val) => {
    setStopBudgets(prev => ({
      ...prev,
      [stopId]: val,
    }));
    localStorage.setItem(`gt_stop_budget_${stopId}`, val);
  };

  const moveStop = async (index, direction) => {
    const newStops = [...stops];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    // Swap sequence orders
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    const stopIds = newStops.map(s => s.id);
    try {
      await apiCall(`/api/trips/${id}/stops/reorder`, {
        method: 'PUT',
        body: JSON.stringify(stopIds),
      });
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to reorder stops', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">Loading builder...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/trips')}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2d2d2d] transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">Build Itinerary</h1>
              <p className="text-xs text-gray-400 mt-0.5">Configure stops and section budgets for: <span className="text-green-500 font-bold">{trip?.name}</span></p>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/trips/${id}`)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
          >
            <Eye size={16} />
            <span>View Timeline</span>
          </button>
        </div>

        {/* Section Cards exactly like mockup 5 */}
        <div className="space-y-6">
          {stops.map((stop, idx) => (
            <div
              key={stop.id}
              className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 relative group shadow-lg space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Section {idx + 1}: {stop.destination.name}</h3>
                  <p className="text-xs text-gray-400">{stop.destination.country}</p>
                </div>
                
                {/* Actions: Reorder, Search, Delete */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveStop(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#252525]"
                    title="Move Section Up"
                  >
                    <MoveUp size={16} />
                  </button>
                  <button
                    onClick={() => moveStop(idx, 1)}
                    disabled={idx === stops.length - 1}
                    className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#252525]"
                    title="Move Section Down"
                  >
                    <MoveDown size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/search?destinationId=${stop.destination.id}&tripId=${id}`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#252525] border border-[#3d3d3d] rounded text-xs text-gray-300 hover:text-white hover:border-green-500 transition"
                  >
                    <Search size={12} />
                    <span>Search Activities</span>
                  </button>
                  <button
                    onClick={() => handleDeleteStop(stop.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-950/20"
                    title="Delete Section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Section Description / Info exactly like mockup 5 */}
              <p className="text-sm text-gray-400 leading-relaxed italic">
                All the necessary information about this section. This can be anything like travel section, hotel or any other activity at {stop.destination.name}, {stop.destination.country}.
              </p>

              {/* Date Range & Budget inputs exactly like mockup 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#252525] border border-[#3d3d3d] rounded-lg p-3 flex items-center space-x-3">
                  <Calendar className="text-green-500 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Date Range</p>
                    <p className="text-sm text-white font-medium">{stop.arrivalDate} to {stop.departureDate}</p>
                  </div>
                </div>
                
                <div className="bg-[#252525] border border-[#3d3d3d] rounded-lg p-3 flex items-center space-x-3">
                  <IndianRupee className="text-green-500 flex-shrink-0" size={18} />
                  <div className="flex-grow">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Budget of this section ({currency.symbol})</p>
                    <input
                      type="number"
                      value={stopBudgets[stop.id] || ''}
                      onChange={(e) => handleUpdateStopBudget(stop.id, e.target.value)}
                      placeholder="e.g. 500"
                      className="bg-transparent border-b border-transparent focus:border-green-500 focus:outline-none text-sm text-white font-medium w-full py-0.5"
                    />
                  </div>
                </div>
              </div>

            </div>
          ))}

          {stops.length === 0 && (
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] border-dashed rounded-xl p-12 text-center text-gray-500">
              No sections created. Add your first section/stop below!
            </div>
          )}
        </div>

        {/* Add Another Section form and button exactly like mockup 5 */}
        <div className="space-y-4 pt-4">
          {showAddForm ? (
            <form onSubmit={handleAddStop} className="bg-[#1e1e1e] border border-green-500/50 rounded-xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">New Stop Section Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Choose City</label>
                  <select
                    required
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="">-- Choose City --</option>
                    {destinations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}, {d.country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrival Date</label>
                  <input
                    type="date"
                    required
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#252525] text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Confirm Section
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-[#1e1e1e] border-2 border-dashed border-[#2d2d2d] hover:border-green-500 rounded-xl text-sm font-bold text-gray-400 hover:text-green-500 transition shadow-md"
            >
              <Plus size={18} />
              <span>Add another Section</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ItineraryBuilder;
