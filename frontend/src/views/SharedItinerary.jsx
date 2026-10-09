import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, DollarSign, Copy, Home, Compass, MapPin, Clock } from 'lucide-react';

const SharedItinerary = () => {
  const { id } = useParams();
  const { apiCall, user } = useAuth();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchPublicTrip();
  }, [id]);

  const fetchPublicTrip = async () => {
    try {
      const data = await apiCall(`/api/trips/public/${id}`);
      setDetails(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'This trip is private or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!user) {
      alert('Please register or log in first to copy this trip!');
      navigate('/login');
      return;
    }

    setCopying(true);
    try {
      const cloned = await apiCall(`/api/trips/public/${id}/copy`, {
        method: 'POST',
      });
      alert('Trip successfully copied! Redirecting to your itinerary editor...');
      navigate(`/trips/${cloned.id}/edit`);
    } catch (err) {
      console.error('Failed to clone trip', err);
      alert('Error copying trip: ' + err.message);
    } finally {
      setCopying(false);
    }
  };

  // Process activities grouped by date
  const groupedActivities = {};
  if (details) {
    details.activities.forEach((act) => {
      const dateStr = act.activityDate;
      if (!groupedActivities[dateStr]) {
        groupedActivities[dateStr] = [];
      }
      groupedActivities[dateStr].push(act);
    });
  }

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
  const tripDates = details ? getDatesBetween(details.trip.startDate, details.trip.endDate) : [];

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">Loading public itinerary...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <p className="text-red-500 font-bold">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
        >
          <Home size={16} />
          <span>Go to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      {/* Cover Banner */}
      <div className="relative h-72 w-full bg-cover bg-center" style={{ backgroundImage: `url('${details.trip.coverPhoto || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600'}')` }}>
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8 max-w-5xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-green-500 overflow-hidden shadow-lg">
              <img src={details.creatorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={details.creatorName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Shared Itinerary by</p>
              <h3 className="font-bold text-white text-sm">{details.creatorName}</h3>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white">{details.trip.name}</h1>
          <p className="text-xs text-gray-300 mt-1 line-clamp-2 max-w-2xl">{details.trip.description || 'Check out my personalized day-by-day travel plan!'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Call to action card */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div>
            <h4 className="font-bold text-white text-sm">Love this itinerary?</h4>
            <p className="text-xs text-gray-400">Copy this personalized day-by-day plan to your own trips, adjust the dates, and customize activities.</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={copying}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition"
          >
            <Copy size={16} />
            <span>{copying ? 'Copying...' : 'Copy Trip'}</span>
          </button>
        </div>

        {/* Date / Budget Meta details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 flex items-center space-x-3">
            <Calendar className="text-green-500" size={20} />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Duration</p>
              <p className="text-xs text-white font-bold">{details.trip.startDate} to {details.trip.endDate}</p>
            </div>
          </div>
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-4 flex items-center space-x-3">
            <DollarSign className="text-green-500" size={20} />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Target Budget</p>
              <p className="text-xs text-white font-bold">${details.trip.budget}</p>
            </div>
          </div>
        </div>

        {/* Vertical Timeline exactly like mockup 9 */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white tracking-wide border-b border-[#2d2d2d] pb-3">Itinerary Timeline (Read-Only)</h2>
          
          {tripDates.map((dateStr, idx) => {
            const dayActs = groupedActivities[dateStr] || [];

            return (
              <div key={dateStr} className="grid grid-cols-12 gap-4 items-start relative pb-6 border-b border-[#2d2d2d]/30 last:border-b-0">
                <div className="col-span-12 md:col-span-2 flex justify-center md:justify-start">
                  <div className="bg-green-600/10 border border-green-500/30 text-green-400 font-bold px-4 py-2 rounded-lg text-sm text-center w-24">
                    Day {idx + 1}
                    <span className="block text-[9px] text-gray-400 font-normal mt-0.5">{dateStr.substring(5)}</span>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-10 space-y-4">
                  {dayActs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-3 text-center md:text-left">No activities scheduled for this day.</p>
                  ) : (
                    <div className="space-y-4">
                      {dayActs.map((act, actIdx) => (
                        <div key={act.id} className="space-y-3">
                          <div className="grid grid-cols-10 gap-3 items-center">
                            
                            {/* Activity Block */}
                            <div className="col-span-7 bg-[#252525] border border-[#3d3d3d] rounded-xl p-4 shadow">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded mr-2">
                                {act.category}
                              </span>
                              {act.activityTime && (
                                <span className="text-[10px] text-gray-400 font-semibold">{act.activityTime.substring(0, 5)}</span>
                              )}
                              <h4 className="font-bold text-white text-sm mt-1">{act.name}</h4>
                              {act.notes && <p className="text-[10px] text-gray-400 mt-0.5">{act.notes}</p>}
                            </div>

                            {/* Cost Block */}
                            <div className="col-span-3 bg-[#252525] border border-[#3d3d3d] rounded-xl p-4 shadow flex items-center justify-center text-center font-bold text-green-500 text-sm">
                              ${act.cost.toFixed(0)}
                            </div>

                          </div>

                          {actIdx < dayActs.length - 1 && (
                            <div className="flex justify-center md:justify-start pl-12 md:pl-24 text-green-600/40 py-1">
                              <span className="font-mono text-xl">↓</span>
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
    </div>
  );
};

export default SharedItinerary;
