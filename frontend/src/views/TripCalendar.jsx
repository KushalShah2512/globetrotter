import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const TripCalendar = () => {
  const { apiCall } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Default to August 2026 matching system timestamp
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const data = await apiCall('/api/trips');
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips for calendar', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper date logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysGrid = [];
  // Fill preceding empty days
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // Fill actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(new Date(year, month, i));
  }

  // Get trips that overlap with a specific day
  const getTripsForDay = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return trips.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);
  };

  // Unique color assignment for trip bars
  const getTripColor = (tripId) => {
    const colors = [
      'bg-blue-600/80 border-blue-500 text-blue-100',
      'bg-green-600/80 border-green-500 text-green-100',
      'bg-purple-600/80 border-purple-500 text-purple-100',
      'bg-amber-600/80 border-amber-500 text-amber-100',
      'bg-pink-600/80 border-pink-500 text-pink-100',
    ];
    return colors[tripId % colors.length];
  };

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400">Loading calendar view...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-8 px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title */}
        <div className="border-b border-[#2d2d2d] pb-4 flex items-center space-x-2.5">
          <CalendarIcon size={24} className="text-green-500" />
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Trip Calendar</h1>
        </div>

        {/* Calendar Widget Card */}
        <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl shadow-xl overflow-hidden">
          
          {/* Calendar Header with Month/Year Selection */}
          <div className="flex items-center justify-between p-6 bg-[#252525] border-b border-[#2d2d2d]">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#333] transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#333] transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekly Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 border-b border-[#2d2d2d] bg-[#1a1a1a]">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 bg-[#1c1c1c] divide-x divide-y divide-[#2d2d2d] border-[#2d2d2d]">
            {daysGrid.map((day, idx) => {
              const dayTrips = getTripsForDay(day);

              return (
                <div
                  key={idx}
                  className="min-h-16 p-1.5 flex flex-col justify-between hover:bg-[#252525]/30 transition group relative"
                >
                  {/* Day Number */}
                  <span className={`text-xs font-semibold self-end ${day ? 'text-gray-300' : 'text-transparent'}`}>
                    {day ? day.getDate() : ''}
                  </span>

                  {/* Trip Highlight Bars exactly like mockup 11 */}
                  <div className="mt-1 space-y-1 flex-grow flex flex-col justify-end">
                    {day && dayTrips.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/trips/${t.id}`)}
                        className={`text-[9px] font-bold p-1 rounded border leading-none truncate cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-sm ${getTripColor(t.id)}`}
                        title={t.name}
                      >
                        {t.name.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TripCalendar;
