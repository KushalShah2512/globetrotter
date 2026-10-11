import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Calendar, DollarSign, ArrowLeft, ArrowRight, Share2, Clipboard, Search, AlertTriangle, Trash2, Edit2, Check, HelpCircle } from 'lucide-react';

const ItineraryTimeline = () => {
  const { id } = useParams();
  const { apiCall } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sharing states
  const [copied, setCopied] = useState(false);

  // Edit custom activity modal / form
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('activities');
  const [customCost, setCustomCost] = useState('');
  const [customDuration, setCustomDuration] = useState('60');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [customStopId, setCustomStopId] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const tripData = await apiCall(`/api/trips/${id}`);
      setTrip(tripData);

      const stopsData = await apiCall(`/api/trips/${id}/stops`);
      setStops(stopsData);
      if (stopsData.length > 0) {
        setCustomStopId(stopsData[0].id.toString());
        setCustomDate(stopsData[0].arrivalDate);
      }

      const actsData = await apiCall(`/api/trips/${id}/activities`);
      setActivities(actsData);
    } catch (err) {
      console.error('Failed to load trip details', err);
      navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      const updated = await apiCall(`/api/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: trip.name,
          description: trip.description,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.budget,
          coverPhoto: trip.coverPhoto,
          isPublic: !trip.isPublic,
        }),
      });
      setTrip(updated);
    } catch (err) {
      console.error('Failed to toggle public status', err);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/shared/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Remove this activity from your schedule?')) return;
    try {
      await apiCall(`/api/trips/${id}/activities/${activityId}`, {
        method: 'DELETE',
      });
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to delete activity', err);
    }
  };

  const handleAddCustomActivity = async (e) => {
    e.preventDefault();
    if (!customName || !customCost || !customDate) return;

    setAddingActivity(true);
    try {
      await apiCall(`/api/trips/${id}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          stopId: customStopId ? parseInt(customStopId) : null,
          name: customName,
          category: customCategory,
          cost: parseFloat(customCost),
          durationMinutes: parseInt(customDuration),
          activityDate: customDate,
          activityTime: customTime,
          notes: customNotes,
        }),
      });

      // Reset Form
      setCustomName('');
      setCustomCost('');
      setCustomNotes('');
      setShowAddActivity(false);

      // Refresh Data
      fetchTripDetails();
    } catch (err) {
      console.error('Failed to add custom activity', err);
      alert(err.message);
    } finally {
      setAddingActivity(false);
    }
  };

  // Process Budget Analytics
  const totalExpenses = activities.reduce((sum, act) => sum + act.cost, 0);
  const isOverBudget = totalExpenses > (trip?.budget || 0);

  // Group activities by date
  const groupedActivities = {};
  activities.forEach((act) => {
    const dateStr = act.activityDate;
    if (!groupedActivities[dateStr]) {
      groupedActivities[dateStr] = [];
    }
    groupedActivities[dateStr].push(act);
  });

  // Calculate days in trip
  const getDatesBetween = (start, end) => {
    const list = [];
    let curr = new Date(start);
    const last = new Date(end);
    while (curr <= last) {
      list.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  };
  const tripDates = trip ? getDatesBetween(trip.startDate, trip.endDate) : [];

  // Group expenses by category
  const categories = {
    activities: { label: 'Activities', color: '#10B981' },
    stay: { label: 'Accommodation', color: '#3B82F6' },
    meals: { label: 'Meals / Food', color: '#F59E0B' },
    transport: { label: 'Transport', color: '#EC4899' },
  };

  const categoryTotals = { activities: 0, stay: 0, meals: 0, transport: 0 };
  activities.forEach(act => {
    const cat = act.category.toLowerCase();
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += act.cost;
    } else {
      categoryTotals.activities += act.cost; // fallback
    }
  });

  const chartData = Object.keys(categoryTotals)
    .map(key => ({
      name: categories[key].label,
      value: categoryTotals[key],
      color: categories[key].color,
    }))
    .filter(item => item.value > 0);

  // Daily budget calculations to raise alerts for overbudget days
  const dailyBudgets = {};
  const averageDailyBudget = trip ? (trip.budget / (tripDates.length || 1)) : 0;
  
  const overbudgetDays = [];
  tripDates.forEach((dateStr, idx) => {
    const dailyCost = (groupedActivities[dateStr] || []).reduce((sum, a) => sum + a.cost, 0);
    dailyBudgets[dateStr] = dailyCost;
    if (dailyCost > averageDailyBudget && averageDailyBudget > 0) {
      overbudgetDays.push({ dayNumber: idx + 1, date: dateStr, cost: dailyCost });
    }
  });

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">Loading timeline...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6 pb-24 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Sharing Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/trips')}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2d2d2d] transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">{trip?.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{trip?.startDate} to {trip?.endDate}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Make Public toggle */}
            <label className="flex items-center space-x-2 cursor-pointer bg-[#1e1e1e] border border-[#2d2d2d] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                checked={trip?.isPublic}
                onChange={handleTogglePublic}
                className="rounded border-[#3d3d3d] text-green-600 focus:ring-0 focus:ring-offset-0 bg-[#252525]"
              />
              <span>Share Publicly</span>
            </label>

            {/* Copy Share URL */}
            {trip?.isPublic && (
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#252525] border border-[#3d3d3d] rounded-lg text-xs text-gray-300 hover:text-white transition"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                <span>{copied ? 'Copied Link!' : 'Copy Share URL'}</span>
              </button>
            )}

            <button
              onClick={() => navigate(`/trips/${id}/edit`)}
              className="px-4 py-1.5 bg-[#252525] border border-[#3d3d3d] rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition"
            >
              Build Itinerary (Stops)
            </button>
            <button
              onClick={() => setShowAddActivity(true)}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow"
            >
              + Add Custom Item
            </button>
          </div>
        </div>

        {/* Financial Budget Dashboard Screen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Estimated Budget Overview</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-white">{formatAmount(totalExpenses)}</span>
              <span className="text-xs text-gray-500">of Target: {formatAmount(trip?.budget)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-[#252525] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((totalExpenses / (trip?.budget || 1)) * 100, 100)}%` }}
              />
            </div>

            {isOverBudget && (
              <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs flex items-center space-x-2">
                <AlertTriangle size={15} />
                <span>Over budget by {formatAmount(totalExpenses - trip.budget)}!</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-[#2d2d2d] flex justify-between text-xs text-gray-400">
              <span>Avg Cost / Day:</span>
              <span className="font-semibold text-white">{formatAmount(totalExpenses / (tripDates.length || 1))}</span>
            </div>
          </div>

          {/* Recharts Pie Chart Category Breakdown */}
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 shadow-lg flex flex-col justify-between h-48 md:h-auto">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Category Breakdown</h3>
            {chartData.length === 0 ? (
              <div className="text-xs text-gray-500 flex-grow flex items-center justify-center">No expenses added.</div>
            ) : (
              <div className="h-32 flex items-center justify-between">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 text-[10px] space-y-1 pl-4">
                  {chartData.map((d, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-gray-300">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="truncate">{d.name}:</span>
                      <span className="font-bold text-white">{formatAmount(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alerts for Overbudget Days */}
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Alerts for Overbudget Days</h3>
            {overbudgetDays.length === 0 ? (
              <div className="text-xs text-green-400 bg-green-950/20 border border-green-500/20 p-3 rounded-lg flex items-center space-x-2">
                <Check size={16} />
                <span>All days are within daily average budget target!</span>
              </div>
            ) : (
              <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
                {overbudgetDays.map((alert, idx) => (
                  <div key={idx} className="bg-amber-950/25 border border-amber-500/25 p-2 rounded-lg text-[10px] flex items-center justify-between text-amber-300">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span>Day {alert.dayNumber} ({alert.date})</span>
                    </div>
                    <span className="font-bold">{formatAmount(alert.cost)} (Target: {formatAmount(averageDailyBudget)})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Itinerary View Timeline Layout exactly like mockup 9 */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[#2d2d2d] pb-3">
            <h2 className="text-xl font-bold text-white tracking-wide text-center md:text-left">Itinerary for a selected place</h2>
          </div>

          {tripDates.map((dateStr, idx) => {
            const dayActs = groupedActivities[dateStr] || [];
            
            return (
              <div key={dateStr} className="grid grid-cols-12 gap-4 items-start relative pb-6 border-b border-[#2d2d2d]/30 last:border-b-0">
                {/* 1. Left Column: Day Badge exactly like mockup 9 */}
                <div className="col-span-12 md:col-span-2 flex justify-center md:justify-start">
                  <div className="bg-green-600/10 border border-green-500/30 text-green-400 font-bold px-4 py-2 rounded-lg text-sm shadow text-center w-24">
                    Day {idx + 1}
                    <span className="block text-[9px] text-gray-400 font-normal mt-0.5">{dateStr.substring(5)}</span>
                  </div>
                </div>

                {/* 2. Middle & Right Columns: Activity Blocks with Down Arrows & Expense columns exactly like mockup 9 */}
                <div className="col-span-12 md:col-span-10 space-y-4">
                  {dayActs.length === 0 ? (
                    <div className="text-xs text-gray-500 italic py-3 text-center md:text-left">No physical activity scheduled. Search activities or click "+ Add Custom Item" to fill.</div>
                  ) : (
                    <div className="space-y-4">
                      {dayActs.map((act, actIdx) => (
                        <div key={act.id} className="space-y-3">
                          <div className="grid grid-cols-10 gap-3 items-center">
                            
                            {/* Middle Column: Physical Activity exactly like mockup 9 */}
                            <div className="col-span-7 bg-[#252525] border border-[#3d3d3d] hover:border-green-500/30 rounded-xl p-4 shadow flex justify-between items-center relative transition">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded mr-2">
                                  {act.category}
                                </span>
                                {act.activityTime && (
                                  <span className="text-[10px] text-gray-400 font-semibold">{act.activityTime.substring(0, 5)}</span>
                                )}
                                <h4 className="font-bold text-white text-sm mt-1">{act.name}</h4>
                                {act.notes && <p className="text-[10px] text-gray-400 mt-0.5">{act.notes}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="text-gray-500 hover:text-red-500 p-1.5 rounded transition"
                                title="Remove activity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Right Column: Expense Block exactly like mockup 9 */}
                            <div className="col-span-3 bg-[#252525] border border-[#3d3d3d] rounded-xl p-4 shadow flex items-center justify-center text-center font-bold text-green-500 text-sm">
                              {formatAmount(act.cost)}
                            </div>

                          </div>

                          {/* Sequential Timeline Arrow connector exactly like mockup 9 */}
                          {actIdx < dayActs.length - 1 && (
                            <div className="flex justify-center md:justify-start pl-12 md:pl-24 text-green-600/40 py-1">
                              <span className="font-mono text-xl animate-pulse">↓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Add Custom Activity Modal Dialog */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Custom Item to Itinerary</h3>
            
            <form onSubmit={handleAddCustomActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Name / Physical Activity</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Taxi Ride, Eiffel Tower, Dinner"
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                  >
                    <option value="activities">Activities (Sightseeing)</option>
                    <option value="stay">Stay (Hotel/Apt)</option>
                    <option value="meals">Meals (Food/Drink)</option>
                    <option value="transport">Transport (Flight/Cab)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Expense ($)</label>
                  <input
                    type="number"
                    required
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    placeholder="e.g. 45"
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Stop Section</label>
                  <select
                    value={customStopId}
                    onChange={(e) => {
                      setCustomStopId(e.target.value);
                      const selectedStop = stops.find(s => s.id.toString() === e.target.value);
                      if (selectedStop) setCustomDate(selectedStop.arrivalDate);
                    }}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none"
                  >
                    {stops.map(s => (
                      <option key={s.id} value={s.id}>{s.destination.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes / Remarks</label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Additional remarks..."
                  rows="2"
                  className="mt-1 block w-full px-3 py-2 bg-[#252525] border border-[#3d3d3d] rounded-lg text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivity(false)}
                  className="px-4 py-2 bg-[#252525] text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingActivity}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition flex items-center space-x-1"
                >
                  <span>{addingActivity ? 'Adding...' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
