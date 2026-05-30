import React, { useState, useEffect } from 'react';

function App() {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

  useEffect(() => {
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
    fetchResources();
  }, []);

  useEffect(() => {
    if (!selectedResource) return;

    const fetchBookings = async () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-slate-100 font-sans">
      {/* Navbar Header */}
      <header className="border-b border-blue-900/30 bg-slate-950/60 backdrop-blur px-6 py-4 shadow-lg shadow-blue-950/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Campus Nexus Scheduler
          </h1>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-semibold shadow-inner">
            ● Backend Connected
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: The Bento Resource Cards */}
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
                      <h3 className={`font-bold text-lg tracking-tight transition-colors duration-300 ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
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

        {/* RIGHT COLUMN: The Blue Interactive Timeline */}
        <section className="lg:col-span-8 bg-slate-950/40 backdrop-blur-md border border-blue-900/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between shadow-blue-950/50">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold tracking-tight text-slate-200">
                Timeline allocation for <span className="text-cyan-400 font-extrabold">{selectedResource?.name}</span>
              </h2>
              <span className="text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-900/40 px-3 py-1 rounded-lg">Today</span>
            </div>

            {/* Timeline Matrix */}
            <div className="relative border border-blue-900/30 rounded-xl bg-slate-950 p-4 overflow-x-auto shadow-inner">
              
              {/* Hours Grid Header */}
              <div className="grid grid-cols-8 gap-0 border-b border-blue-900/20 pb-3 mb-4 text-center text-xs font-bold uppercase tracking-wider text-blue-400/50 min-w-[600px]">
                {timeSlots.map((hour, idx) => (
                  <div key={idx} className="border-l border-blue-900/10 first:border-l-0">{hour}</div>
                ))}
              </div>

              {/* Booking Track Grid */}
              <div className="relative h-24 bg-blue-950/20 rounded-xl border border-blue-900/20 min-w-[600px]">
                {/* Horizontal Guide Matrix */}
                <div className="absolute inset-0 grid grid-cols-16 pointer-events-none">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="border-r border-blue-900/10 last:border-r-0 h-full"></div>
                  ))}
                </div>

                {/* Render Dynamic Bookings */}
                <div className="absolute inset-0 grid grid-cols-16 items-center p-2 gap-1.5">
                  {bookings.length === 0 ? (
                    <div className="col-span-16 text-center text-xs text-blue-400/40 tracking-wide font-medium italic">No interactive allocations initialized for today.</div>
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

          {/* Action Call Button */}
          <button className="mt-6 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all transform active:scale-[0.99]">
            + Request New Reservation Slot
          </button>
        </section>

      </main>
    </div>
  );
}

export default App;