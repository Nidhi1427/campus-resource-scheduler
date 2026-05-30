import React, { useState, useEffect } from 'react';
// 1. Import Recharts components
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    user: '',
    startHour: '09',
    startMin: '00',
    endHour: '10',
    endMin: '00'
  });
  const [formError, setFormError] = useState('');
  
  // Agentic AI Suggestion States
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const timeSlots = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

  const fetchResources = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resources');
      const json = await response.json();
      if (json.success && json.data.length > 0) {
        setResources(json.data);
        setSelectedResource(json.data[0]);
      }
    } catch (error) {
      console.error("❌ Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedResource) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/api/bookings/${selectedResource._id}?date=${today}`);
      const json = await response.json();
      if (json.success) {
        setBookings(json.data);
      }
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedResource]);

  const getGridPlacement = (timeString) => {
    const date = new Date(timeString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutesFromStart = (hours - 9) * 60 + minutes;
    const gridColumn = Math.floor(totalMinutesFromStart / 30) + 1;
    return Math.max(1, Math.min(17, gridColumn));
  };

  // 2. Generate Data Matrix for Recharts Analytics Panel
  const getAnalyticsData = () => {
    // Initialize count structure for each slot
    const counts = timeSlots.reduce((acc, slot) => {
      acc[slot] = 0;
      return acc;
    }, {});

    bookings.forEach(booking => {
      const startHour = new Date(booking.startTime).getHours();
      const endHour = new Date(booking.endTime).getHours();

      timeSlots.forEach(slot => {
        const slotHour = parseInt(slot);
        const systemSlotHour = slot.includes("PM") && slotHour !== 12 ? slotHour + 12 : slotHour;
        
        // If booking spans across this hour tracking node, increment usage counter
        if (systemSlotHour >= startHour && systemSlotHour < endHour) {
          counts[slot]++;
        }
      });
    });

    return Object.keys(counts).map(key => ({
      name: key,
      "Active Sessions": counts[key]
    }));
  };

  const triggerAiOptimizer = async (startTime, endTime) => {
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const response = await fetch('http://localhost:5000/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResource._id,
          startTime,
          endTime,
          capacityRequired: selectedResource.capacity
        })
      });
      const json = await response.json();
      if (json.success) {
        setAiSuggestions(json.suggestions);
      }
    } catch (err) {
      console.error("❌ Failed to pull agent suggestions:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setAiSuggestions([]);

    const todayStr = new Date().toISOString().split('T')[0];
    const startTime = new Date(`${todayStr}T${formData.startHour}:${formData.startMin}:00`);
    const endTime = new Date(`${todayStr}T${formData.endHour}:${formData.endMin}:00`);

    if (startTime >= endTime) {
      setFormError('End time must be strictly after the start time.');
      return;
    }

    const bookingPayload = {
      resourceId: selectedResource._id,
      title: formData.title,
      user: formData.user,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setFormError(json.message || 'Slot allocation conflict detected.');
        triggerAiOptimizer(startTime.toISOString(), endTime.toISOString());
      } else {
        setIsModalOpen(false);
        setFormData({ title: '', user: '', startHour: '09', startMin: '00', endHour: '10', endMin: '00' });
        fetchBookings();
      }
    } catch (error) {
      setFormError('Could not communicate with the reservation engine.');
    }
  };

  const applyAiSuggestion = (suggestion) => {
    const startObj = new Date(suggestion.suggestedStart);
    const endObj = new Date(suggestion.suggestedEnd);

    const sHour = String(startObj.getHours()).padStart(2, '0');
    const sMin = String(startObj.getMinutes()).padStart(2, '0');
    const eHour = String(endObj.getHours()).padStart(2, '0');
    const eMin = String(endObj.getMinutes()).padStart(2, '0');

    setFormData({
      ...formData,
      startHour: sHour,
      startMin: sMin,
      endHour: eHour,
      endMin: eMin
    });
    
    if (suggestion.type === 'ROOM_ALT') {
      setSelectedResource(suggestion.resource);
    }
    
    setAiSuggestions([]);
    setFormError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-slate-100 font-sans relative pb-12">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-slate-950/60 backdrop-blur px-6 py-4 shadow-lg shadow-blue-950/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Campus Nexus Scheduler
          </h1>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-semibold">
            ● System Active
          </span>
        </div>
      </header>

      {/* Main Assembly Grid Layout */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Resource Cards */}
          <section className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400/80 px-1">Operational Hubs</h2>
            
            {loading ? (
              <div className="text-sm text-blue-400 animate-pulse p-4">Syncing grid layouts...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {resources.map((resource) => {
                  const isSelected = selectedResource?._id === resource._id;
                  return (
                    <div 
                      key={resource._id} 
                      onClick={() => setSelectedResource(resource)}
                      className={`border transition-all duration-300 p-5 rounded-2xl shadow-2xl flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-br from-blue-900/40 to-indigo-950/60 border-cyan-400 shadow-cyan-950/40 ring-4 ring-cyan-500/10' 
                          : 'bg-slate-950/50 border-blue-900/20 hover:border-blue-800/50 hover:bg-slate-900/30'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {resource.type}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">Cap: {resource.capacity}</span>
                        </div>
                        <h3 className={`font-bold text-lg tracking-tight ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {resource.name}
                        </h3>
                      </div>
                      <p className="text-xs text-blue-300/60 mt-4 font-medium flex items-center gap-1.5">
                        <span className="text-cyan-400">📍</span> {resource.location}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Interactive Timeline */}
          <section className="lg:col-span-8 bg-slate-950/40 backdrop-blur-md border border-blue-900/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between shadow-blue-950/50">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold tracking-tight text-slate-200">
                  Timeline allocation for <span className="text-cyan-400 font-extrabold">{selectedResource?.name}</span>
                </h2>
                <span className="text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-900/40 px-3 py-1 rounded-lg">Today</span>
              </div>

              <div className="relative border border-blue-900/30 rounded-xl bg-slate-950 p-4 overflow-x-auto shadow-inner">
                <div className="grid grid-cols-8 gap-0 border-b border-blue-900/20 pb-3 mb-4 text-center text-xs font-bold uppercase tracking-wider text-blue-400/50 min-w-[600px]">
                  {timeSlots.map((hour, idx) => (
                    <div key={idx} className="border-l border-blue-900/10 first:border-l-0">{hour}</div>
                  ))}
                </div>

                <div className="relative h-24 bg-blue-950/20 rounded-xl border border-blue-900/20 min-w-[600px]">
                  <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border-r border-blue-900/10 last:border-r-0 h-full"></div>
                    ))}
                  </div>

                  <div className="absolute inset-0 grid grid-cols-16 items-center p-2 gap-1.5">
                    {bookings.length === 0 ? (
                      <div className="col-span-16 text-center text-xs text-blue-400/40 tracking-wide font-medium italic">No active bookings for today.</div>
                    ) : (
                      bookings.map((booking) => {
                        const startCol = getGridPlacement(booking.startTime);
                        const endCol = getGridPlacement(booking.endTime);
                        return (
                          <div
                            key={booking._id}
                            style={{ gridColumnStart: startCol, gridColumnEnd: endCol }}
                            className="h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-xl p-3 flex flex-col justify-center overflow-hidden group hover:border-cyan-400 transition-all shadow-md shadow-cyan-950/50"
                          >
                            <p className="text-xs font-bold text-cyan-300 truncate">{booking.title}</p>
                            <p className="text-[10px] text-blue-300/70 font-semibold truncate">User: {booking.user}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99]"
            >
              + Request New Reservation Slot
            </button>
          </section>
        </div>

        {/* 3. NEW BOTTOM SECTION: LIVE RECHARTS CAPACITY ANALYTICS TRAILER */}
        <section className="bg-slate-950/50 backdrop-blur-md border border-blue-900/30 rounded-2xl p-6 shadow-2xl">
          <div className="mb-4">
            <h3 className="text-md font-bold tracking-tight text-slate-200">
              📊 Real-Time Hub Performance Analytics
            </h3>
            <p className="text-xs text-blue-400/70 font-medium">Monitoring active load metrics across time vectors for: {selectedResource?.name}</p>
          </div>

          <div className="w-full h-64 bg-slate-950 rounded-xl p-4 border border-blue-900/10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getAnalyticsData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e3a8a', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Bar dataKey="Active Sessions" fill="url(#blueGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

      </main>

      {/* POPUP MODAL DIALOG CONTAINER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-900/40 max-w-md w-full rounded-2xl p-6 shadow-2xl relative my-8">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Reserve Slot</h3>
            <p className="text-xs text-blue-400 mb-4 font-medium">Allocating: {selectedResource?.name}</p>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 font-medium">
                ⚠️ {formError}
              </div>
            )}

            {/* AI SUGGESTIONS TRAY */}
            {(isAiLoading || aiSuggestions.length > 0) && (
              <div className="mb-5 bg-slate-950 border border-cyan-500/30 p-4 rounded-xl shadow-inner animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                    ✨ Nexus AI Alternate Suggestions
                  </h4>
                  {isAiLoading && <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></div>}
                </div>

                {aiSuggestions.length === 0 && isAiLoading && (
                  <p className="text-xs text-slate-500 animate-pulse">Running cluster spatial mapping algorithms...</p>
                )}

                <div className="space-y-2">
                  {aiSuggestions.map((sug, index) => {
                    const startLabel = new Date(sug.suggestedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endLabel = new Date(sug.suggestedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div 
                        key={index}
                        onClick={() => applyAiSuggestion(sug)}
                        className="bg-blue-950/40 hover:bg-cyan-950/30 border border-blue-900/40 hover:border-cyan-500/50 p-2.5 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            sug.type === 'ROOM_ALT' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {sug.type === 'ROOM_ALT' ? 'Switch Space' : 'Time Shift'}
                          </span>
                          <span className="text-xs text-cyan-300 font-bold tracking-tight group-hover:text-cyan-200">
                            {startLabel} - {endLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight">
                          <span className="font-semibold text-slate-200">{sug.resource.name}</span>: {sug.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Session Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. AI Dev Sprint / Cryptography Lab"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-blue-900/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Organizer Identifier</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Operator"
                  value={formData.user}
                  onChange={(e) => setFormData({...formData, user: e.target.value})}
                  className="w-full bg-slate-950 border border-blue-900/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Start Time</label>
                  <div className="flex gap-1.5">
                    <select 
                      value={formData.startHour}
                      onChange={(e) => setFormData({...formData, startHour: e.target.value})}
                      className="w-full bg-slate-950 border border-blue-900/30 rounded-xl p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-400"
                    >
                      {Array.from({ length: 8 }).map((_, i) => {
                        const h = String(i + 9).padStart(2, '0');
                        return <option key={h} value={h}>{h}:00</option>;
                      })}
                    </select>
                    <select
                      value={formData.startMin}
                      onChange={(e) => setFormData({...formData, startMin: e.target.value})}
                      className="w-full bg-slate-950 border border-blue-900/30 rounded-xl p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="00">00</option>
                      <option value="30">30</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">End Time</label>
                  <div className="flex gap-1.5">
                    <select 
                      value={formData.endHour}
                      onChange={(e) => setFormData({...formData, endHour: e.target.value})}
                      className="w-full bg-slate-950 border border-blue-900/30 rounded-xl p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-400"
                    >
                      {Array.from({ length: 9 }).map((_, i) => {
                        const h = String(i + 9).padStart(2, '0');
                        return <option key={h} value={h}>{h}:00</option>;
                      })}
                    </select>
                    <select
                      value={formData.endMin}
                      onChange={(e) => setFormData({...formData, endMin: e.target.value})}
                      className="w-full bg-slate-950 border border-blue-900/30 rounded-xl p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="00">00</option>
                      <option value="30">30</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-blue-900/20 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setAiSuggestions([]);
                  }}
                  className="w-full bg-slate-950 border border-blue-900/40 hover:bg-slate-900 text-slate-400 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-sm font-bold py-2.5 rounded-xl shadow-md transition-all"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;