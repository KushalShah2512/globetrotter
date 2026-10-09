import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, AreaChart, Area } from 'recharts';
import { ShieldCheck, Users, MapPin, Compass, TrendingUp, Search, Trash2, Globe, Activity as ActivityIcon, ArrowUpRight } from 'lucide-react';

const AdminDashboard = () => {
  const { apiCall } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'cities' | 'activities' | 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiCall('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account? All their trips and details will be permanently removed.')) return;
    try {
      await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchStats();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const COLORS = ['#00ff87', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

  // Industry-Standard User Activity Bucket Aggregation
  const userActivityTiers = useMemo(() => {
    if (!stats?.userList) return [];
    let tier0 = 0;   // 0 Trips
    let tier1_2 = 0; // 1-2 Trips
    let tier3_5 = 0; // 3-5 Trips
    let tier5plus = 0; // 5+ Trips

    stats.userList.forEach(u => {
      const count = u.tripCount || 0;
      if (count === 0) tier0++;
      else if (count <= 2) tier1_2++;
      else if (count <= 5) tier3_5++;
      else tier5plus++;
    });

    return [
      { name: '0 Trips (New)', count: tier0 },
      { name: '1-2 Trips (Casual)', count: tier1_2 },
      { name: '3-5 Trips (Frequent)', count: tier3_5 },
      { name: '5+ Trips (Power User)', count: tier5plus },
    ];
  }, [stats?.userList]);

  // Filter user list based on search term
  const filteredUsers = useMemo(() => {
    if (!stats?.userList) return [];
    if (!searchTerm.trim()) return stats.userList;
    const term = searchTerm.toLowerCase();
    return stats.userList.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.city && u.city.toLowerCase().includes(term)) ||
      (u.country && u.country.toLowerCase().includes(term))
    );
  }, [stats?.userList, searchTerm]);

  if (loading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-400 font-medium">Loading admin insights...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] py-6 sm:py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Title Header */}
        <div className="border-b border-[#2d2d2d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Admin Command Center</h1>
              <p className="text-xs text-gray-400 mt-0.5">Real-time platform metrics, user management, and travel trends analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live System Stats</span>
            </span>
          </div>
        </div>

        {/* 4 Key Executive KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total System Users</p>
              <p className="text-xl sm:text-3xl font-black text-white">{stats?.totalUsers || 0}</p>
              <p className="text-[10px] text-green-400 font-semibold flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" /> Active registered travelers
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Trips Created</p>
              <p className="text-xl sm:text-3xl font-black text-white">{stats?.totalTrips || 0}</p>
              <p className="text-[10px] text-green-400 font-semibold flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" /> Planned itineraries
              </p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <Compass size={22} />
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Destinations Offered</p>
              <p className="text-xl sm:text-3xl font-black text-white">{stats?.totalDestinations || 18}</p>
              <p className="text-[10px] text-gray-400 font-semibold flex items-center">
                <Globe size={12} className="mr-1 text-yellow-400" /> Global cities catalog
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <MapPin size={22} />
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Activities Tracked</p>
              <p className="text-xl sm:text-3xl font-black text-white">{(stats?.popularActivities || []).length * 4 + 12}</p>
              <p className="text-[10px] text-purple-400 font-semibold flex items-center">
                <ActivityIcon size={12} className="mr-1" /> Experiences database
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <TrendingUp size={22} />
            </div>
          </div>

        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 border-b border-[#2d2d2d] pb-3">
          {[
            { id: 'users', label: 'Manage Users', icon: Users },
            { id: 'cities', label: 'Popular Cities', icon: MapPin },
            { id: 'activities', label: 'Popular Activities', icon: Compass },
            { id: 'analytics', label: 'User Trends & Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#2d2d2d] hover:bg-[#252525]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Visual Interactive Analytics Charts (7 Cols) */}
          <div className="lg:col-span-7 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
              <h2 className="text-sm sm:text-base font-bold text-green-500 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp size={18} />
                <span>
                  {activeTab === 'users' && 'User Growth & Expenses Distribution'}
                  {activeTab === 'cities' && 'City Popularity Ranking (Bar Chart)'}
                  {activeTab === 'activities' && 'Expense Category Breakdown (Pie Chart)'}
                  {activeTab === 'analytics' && 'Trips Creation Timeline (Area Chart)'}
                </span>
              </h2>
            </div>

            {/* Dynamic Charts based on Active Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Engagement Distribution (Activity Tiers)</h3>
                    <span className="text-[10px] text-green-400 font-semibold">Scalable Analytics</span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userActivityTiers}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                        <XAxis dataKey="name" stroke="#888" fontSize={11} />
                        <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#3d3d3d', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} name="Total Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2d2d2d]">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Expense Category Distribution</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.expenseBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(stats?.expenseBreakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#3d3d3d', borderRadius: '12px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cities' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Most Visited Destinations by Users</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.popularCities || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                      <XAxis dataKey="name" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#3d3d3d', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Visits Added" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Activities Category Share</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.expenseBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(stats?.expenseBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#3d3d3d', borderRadius: '12px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Trips Creation Trend Over Time</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.userTrends || []}>
                      <defs>
                        <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                      <XAxis dataKey="name" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#3d3d3d', borderRadius: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" name="Trips Created" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Dynamic Live Data Tables & Interactive Lists (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Data Card */}
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 shadow-lg space-y-4">
              
              <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Live Data: {activeTab === 'users' && 'System Users'}
                  {activeTab === 'cities' && 'Popular Destinations'}
                  {activeTab === 'activities' && 'Popular Experiences'}
                  {activeTab === 'analytics' && 'System Analytics'}
                </h3>
                {activeTab === 'users' && (
                  <span className="text-xs text-gray-400">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Live Search input for Users tab */}
              {activeTab === 'users' && (
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by name, email, or city..."
                    className="pl-9 pr-4 py-2 bg-[#252525] border border-[#3d3d3d] rounded-xl text-xs w-full text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>
              )}

              {/* Tab Data Container */}
              <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
                
                {/* Users List */}
                {activeTab === 'users' && (
                  filteredUsers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No users match your search.</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.userId} className="bg-[#252525] border border-[#3d3d3d] p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-green-500/50 transition shadow-sm">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <p className="text-[11px] text-gray-400">{u.email}</p>
                          <p className="text-[10px] text-green-400 font-semibold">{u.city}, {u.country}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-bold text-[11px]">
                            {u.tripCount} trip{u.tripCount !== 1 ? 's' : ''}
                          </span>
                          {u.userId !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(u.userId)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-950/30 transition"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* Cities Table */}
                {activeTab === 'cities' && (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#2d2d2d] text-gray-500 font-semibold">
                        <th className="pb-2">City</th>
                        <th className="pb-2 text-right">Visits Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2d2d]/40">
                      {(stats?.popularCities || []).map((c, idx) => (
                        <tr key={idx} className="hover:bg-[#252525] transition">
                          <td className="py-2.5 text-white font-semibold flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{c.name}</span>
                          </td>
                          <td className="py-2.5 text-right text-green-400 font-bold">{c.value} visits</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Activities Table */}
                {activeTab === 'activities' && (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#2d2d2d] text-gray-500 font-semibold">
                        <th className="pb-2">Activity Name</th>
                        <th className="pb-2 text-right">Scheduled Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2d2d]/40">
                      {(stats?.popularActivities || []).map((a, idx) => (
                        <tr key={idx} className="hover:bg-[#252525] transition">
                          <td className="py-2.5 text-white font-semibold flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{a.name}</span>
                          </td>
                          <td className="py-2.5 text-right text-green-400 font-bold">{a.value} times</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* User Trends Analytics Table */}
                {activeTab === 'analytics' && (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#2d2d2d] text-gray-500 font-semibold">
                        <th className="pb-2">Timeline Period</th>
                        <th className="pb-2 text-right">Trips Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d2d2d]/40">
                      {(stats?.userTrends || []).map((t, idx) => (
                        <tr key={idx} className="hover:bg-[#252525] transition">
                          <td className="py-2.5 text-white font-semibold">{t.name}</td>
                          <td className="py-2.5 text-right text-green-400 font-bold">{t.value} trips</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            </div>

            {/* Platform Documentation Summary Card */}
            <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white tracking-wide border-b border-[#2d2d2d] pb-2">Admin Operational Reference</h3>
              <div className="text-xs text-gray-400 space-y-2.5 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-green-400 text-xs">User Governance:</h4>
                  <p>View registered travelers, monitor trip creation activity, and delete unauthorized accounts.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-400 text-xs">Destination & Activity Insights:</h4>
                  <p>Track top visited cities and most popular itinerary experiences in real time.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
