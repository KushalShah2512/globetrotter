import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Grid, SlidersHorizontal, ArrowUpDown, Calendar, Trash2, Edit, Eye, Plane, ChevronDown, X } from 'lucide-react';

const MyTrips = () => {
  const { apiCall } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Group / Filter / Sort state
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'budget' | 'none'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'ongoing' | 'upcoming' | 'completed'
  const [filterVisibility, setFilterVisibility] = useState('all'); // 'all' | 'public' | 'private'
  const [sortField, setSortField] = useState('startDate'); // 'startDate' | 'endDate' | 'name' | 'budget'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState(null); // 'group' | 'filter' | 'sort' | null
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTrips = async () => {
    try {
      const data = await apiCall('/api/trips');
      setTrips(data);
    } catch (err) {
      console.error('Failed to fetch user trips', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip permanently? All stops and activities planned will be lost.')) return;
    try {
      await apiCall(`/api/trips/${id}`, { method: 'DELETE' });
      fetchTrips();
    } catch (err) {
      console.error('Failed to delete trip', err);
    }
  };

  // --- Derived Data ---
  const today = new Date().toISOString().split('T')[0];

  const getStatus = (trip) => {
    if (trip.startDate <= today && trip.endDate >= today) return 'ongoing';
    if (trip.startDate > today) return 'upcoming';
    return 'completed';
  };

  const getBudgetRange = (budget) => {
    if (!budget || budget <= 500) return `Budget: ${formatAmount(0)} – ${formatAmount(500)}`;
    if (budget <= 2000) return `Budget: ${formatAmount(500)} – ${formatAmount(2000)}`;
    if (budget <= 5000) return `Budget: ${formatAmount(2000)} – ${formatAmount(5000)}`;
    return `Budget: ${formatAmount(5000)}+`;
  };

  const processedTrips = useMemo(() => {
    let result = [...trips];

    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }

    // 2. Status filter
    if (filterStatus !== 'all') {
      result = result.filter(t => getStatus(t) === filterStatus);
    }

    // 3. Visibility filter
    if (filterVisibility !== 'all') {
      result = result.filter(t => filterVisibility === 'public' ? t.isPublic : !t.isPublic);
    }

    // 4. Sort
    result.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'budget':
          valA = a.budget || 0;
          valB = b.budget || 0;
          break;
        case 'endDate':
          valA = a.endDate;
          valB = b.endDate;
          break;
        default: // startDate
          valA = a.startDate;
          valB = b.startDate;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trips, searchTerm, filterStatus, filterVisibility, sortField, sortOrder]);

  // 5. Group
  const groupedTrips = useMemo(() => {
    if (groupBy === 'none') {
      return [{ title: 'All Trips', trips: processedTrips }];
    }
    if (groupBy === 'budget') {
      const groups = {};
      processedTrips.forEach(t => {
        const key = getBudgetRange(t.budget);
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      return Object.entries(groups).map(([title, trips]) => ({ title, trips }));
    }
    // Default: group by status
    const ongoing = processedTrips.filter(t => getStatus(t) === 'ongoing');
    const upcoming = processedTrips.filter(t => getStatus(t) === 'upcoming');
    const completed = processedTrips.filter(t => getStatus(t) === 'completed');
    const groups = [];
    if (ongoing.length) groups.push({ title: 'Ongoing', trips: ongoing });
    if (upcoming.length) groups.push({ title: 'Upcoming', trips: upcoming });
    if (completed.length) groups.push({ title: 'Completed', trips: completed });
    return groups;
  }, [processedTrips, groupBy]);

  // Active filter count badge
  const activeFilterCount = [filterStatus !== 'all', filterVisibility !== 'all'].filter(Boolean).length;

  const DropdownOption = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${active ? 'bg-green-600/20 text-green-400 font-semibold' : 'text-gray-300 hover:bg-[#333] hover:text-white'}`}
    >
      {label}
    </button>
  );

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const durationDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="min-h-screen bg-[#121212] py-6 sm:py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Title */}
        <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-4">
          <div className="flex items-center space-x-2.5">
            <Plane size={24} className="text-green-500" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">My Trips</h1>
          </div>
          <button
            onClick={() => navigate('/create-trip')}
            className="px-3.5 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition"
          >
            + Create New Trip
          </button>
        </div>

        {/* Search + Toolbar */}
        <div className="bg-[#1e1e1e] p-3.5 sm:p-4 border border-[#2d2d2d] rounded-2xl flex flex-col md:flex-row items-center gap-3 sm:gap-4 shadow-md" ref={dropdownRef}>
          <div className="relative flex-grow w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Search size={17} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trips by name or description..."
              className="pl-10 pr-4 py-2.5 bg-[#252525] border border-[#3d3d3d] rounded-xl w-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="flex w-full md:w-auto flex-shrink-0 items-center justify-between sm:justify-start gap-2 relative">

            {/* Group By */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'group' ? null : 'group')}
                className={`w-full flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm whitespace-nowrap transition ${openDropdown === 'group' || groupBy !== 'status' ? 'bg-green-600/10 border-green-500/30 text-green-400' : 'bg-[#252525] border-[#3d3d3d] text-gray-300 hover:bg-[#333] hover:text-white'}`}
              >
                <Grid size={14} />
                <span>Group by</span>
                <ChevronDown size={12} />
              </button>
              {openDropdown === 'group' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl p-2 z-50 space-y-0.5">
                  <DropdownOption label="Status (Default)" active={groupBy === 'status'} onClick={() => { setGroupBy('status'); setOpenDropdown(null); }} />
                  <DropdownOption label="Budget Range" active={groupBy === 'budget'} onClick={() => { setGroupBy('budget'); setOpenDropdown(null); }} />
                  <DropdownOption label="No Grouping" active={groupBy === 'none'} onClick={() => { setGroupBy('none'); setOpenDropdown(null); }} />
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                className={`w-full flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm whitespace-nowrap transition ${openDropdown === 'filter' || activeFilterCount > 0 ? 'bg-green-600/10 border-green-500/30 text-green-400' : 'bg-[#252525] border-[#3d3d3d] text-gray-300 hover:bg-[#333] hover:text-white'}`}
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-green-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
                <ChevronDown size={12} />
              </button>
              {openDropdown === 'filter' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl p-3 z-50 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Trip Status</p>
                    <div className="space-y-0.5">
                      <DropdownOption label="All Statuses" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
                      <DropdownOption label="Ongoing" active={filterStatus === 'ongoing'} onClick={() => setFilterStatus('ongoing')} />
                      <DropdownOption label="Upcoming" active={filterStatus === 'upcoming'} onClick={() => setFilterStatus('upcoming')} />
                      <DropdownOption label="Completed" active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} />
                    </div>
                  </div>
                  <hr className="border-[#2d2d2d]" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Visibility</p>
                    <div className="space-y-0.5">
                      <DropdownOption label="All" active={filterVisibility === 'all'} onClick={() => setFilterVisibility('all')} />
                      <DropdownOption label="Public Only" active={filterVisibility === 'public'} onClick={() => setFilterVisibility('public')} />
                      <DropdownOption label="Private Only" active={filterVisibility === 'private'} onClick={() => setFilterVisibility('private')} />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <>
                      <hr className="border-[#2d2d2d]" />
                      <button
                        onClick={() => { setFilterStatus('all'); setFilterVisibility('all'); }}
                        className="w-full flex items-center justify-center space-x-1 text-xs text-red-400 hover:text-red-300 py-1 transition"
                      >
                        <X size={12} />
                        <span>Clear All Filters</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className={`w-full flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm whitespace-nowrap transition ${openDropdown === 'sort' ? 'bg-green-600/10 border-green-500/30 text-green-400' : 'bg-[#252525] border-[#3d3d3d] text-gray-300 hover:bg-[#333] hover:text-white'}`}
              >
                <ArrowUpDown size={14} />
                <span>Sort</span>
                <ChevronDown size={12} />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-[#1e1e1e] border border-[#2d2d2d] rounded-xl shadow-2xl p-3 z-50 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sort By</p>
                    <div className="space-y-0.5">
                      <DropdownOption label="Start Date" active={sortField === 'startDate'} onClick={() => setSortField('startDate')} />
                      <DropdownOption label="End Date" active={sortField === 'endDate'} onClick={() => setSortField('endDate')} />
                      <DropdownOption label="Trip Name" active={sortField === 'name'} onClick={() => setSortField('name')} />
                      <DropdownOption label="Budget" active={sortField === 'budget'} onClick={() => setSortField('budget')} />
                    </div>
                  </div>
                  <hr className="border-[#2d2d2d]" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Order</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${sortOrder === 'asc' ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-[#252525] border-[#3d3d3d] text-gray-400 hover:text-white'}`}
                      >
                        ↑ Ascending
                      </button>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${sortOrder === 'desc' ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-[#252525] border-[#3d3d3d] text-gray-400 hover:text-white'}`}
                      >
                        ↓ Descending
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Active Filters Chips */}
        {(activeFilterCount > 0 || searchTerm.trim()) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Active:</span>
            {searchTerm.trim() && (
              <span className="inline-flex items-center space-x-1 text-xs bg-[#252525] border border-[#3d3d3d] text-gray-300 rounded-full px-3 py-1">
                <span>Search: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white"><X size={11} /></button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center space-x-1 text-xs bg-green-600/10 border border-green-500/20 text-green-400 rounded-full px-3 py-1">
                <span>Status: {filterStatus}</span>
                <button onClick={() => setFilterStatus('all')} className="text-green-600 hover:text-green-300"><X size={11} /></button>
              </span>
            )}
            {filterVisibility !== 'all' && (
              <span className="inline-flex items-center space-x-1 text-xs bg-green-600/10 border border-green-500/20 text-green-400 rounded-full px-3 py-1">
                <span>Visibility: {filterVisibility}</span>
                <button onClick={() => setFilterVisibility('all')} className="text-green-600 hover:text-green-300"><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Trips List */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Loading trips...</div>
        ) : processedTrips.length === 0 ? (
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] border-dashed rounded-2xl p-12 text-center space-y-3">
            <Plane size={40} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-sm">No trips found matching your criteria.</p>
            <button
              onClick={() => navigate('/create-trip')}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition"
            >
              + Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedTrips.map((group, gi) => (
              <div key={gi} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-green-500 uppercase tracking-wider">{group.title}</h3>
                  <span className="text-xs text-gray-500 font-medium">{group.trips.length} trip{group.trips.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="border-b border-[#2d2d2d]" />
                <div className="space-y-4">
                  {group.trips.map((trip) => {
                    const status = getStatus(trip);
                    return (
                      <div
                        key={trip.id}
                        onClick={() => navigate(`/trips/${trip.id}`)}
                        className="bg-[#1e1e1e] border border-[#2d2d2d] hover:border-green-500 rounded-2xl overflow-hidden cursor-pointer shadow-lg p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 items-start md:items-center justify-between transition-all duration-300 group"
                      >
                        {/* Cover Image & Overlay Badges */}
                        <div className="w-full md:w-36 h-36 md:h-24 rounded-xl overflow-hidden relative flex-shrink-0 border border-[#2d2d2d]">
                          <img
                            src={trip.coverPhoto || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'}
                            alt={trip.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                          <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-md border ${
                              status === 'ongoing' ? 'bg-blue-600/80 text-white border-blue-400/30' :
                              status === 'upcoming' ? 'bg-yellow-600/80 text-white border-yellow-400/30' :
                              'bg-green-600/80 text-white border-green-400/30'
                            }`}>
                              {status}
                            </span>
                            {trip.isPublic && (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-black/60 text-green-400 backdrop-blur-md border border-green-500/30 shadow-md">
                                Public
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details Block */}
                        <div className="text-left space-y-1.5 w-full flex-grow">
                          <h4 className="font-bold text-base sm:text-lg text-white leading-tight group-hover:text-green-400 transition">{trip.name}</h4>
                          <div className="text-xs text-gray-400 font-medium flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center space-x-1 text-gray-300">
                              <Calendar size={13} className="text-green-500" />
                              <span>{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
                            </span>
                            <span className="text-gray-600">·</span>
                            <span>{durationDays(trip.startDate, trip.endDate)} days</span>
                            {trip.budget > 0 && (
                              <>
                                <span className="text-gray-600">·</span>
                                <span className="text-[#00ff87] font-semibold">{formatAmount(trip.budget)} budget</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{trip.description || 'No description provided.'}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 md:flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#2d2d2d]">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}`); }}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600 hover:text-white rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/edit`); }}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#252525] border border-[#3d3d3d] text-gray-300 hover:bg-[#333] hover:text-white rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteTrip(e, trip.id)}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyTrips;
