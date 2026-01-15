
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import MobileShell from '../components/MobileShell';
import Logo from '../components/Logo';
import L from 'leaflet';

interface DeliveryAppProps {
  orders: Order[];
  onAcceptOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onLogout: () => void;
}

type DeliveryTab = 'tasks' | 'map' | 'wallet' | 'profile';
type ProfileSubView = 'main' | 'vehicle' | 'zone' | 'support' | 'settings';

const DeliveryApp: React.FC<DeliveryAppProps> = ({ orders, onAcceptOrder, onUpdateStatus, onLogout }) => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('tasks');
  const [profileView, setProfileView] = useState<ProfileSubView>('main');
  const [isOnline, setIsOnline] = useState(true);
  const [isCashingOut, setIsCashingOut] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Simulated real coordinates in San Francisco for the Courier Matrix
  const restaurantCoords: [number, number] = [37.7858, -122.4065];
  const customerCoords: [number, number] = [37.7694, -122.4862];
  const [driverPos, setDriverPos] = useState<[number, number]>(restaurantCoords);

  const pendingJobs = orders.filter(o => o.status === OrderStatus.READY);
  const currentJob = orders.find(o => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.OUT_FOR_DELIVERY);

  // Initialize Map
  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(restaurantCoords, 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      const resIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 bg-white border-2 border-orange-500 rounded-xl flex items-center justify-center text-orange-600 shadow-lg"><i class="fas fa-utensils"></i></div>`,
        iconSize: [32, 32]
      });
      L.marker(restaurantCoords, { icon: resIcon }).addTo(mapRef.current);

      if (currentJob) {
        const custIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-white animate-bounce"><i class="fas fa-location-dot"></i></div>`,
          iconSize: [40, 40]
        });
        L.marker(customerCoords, { icon: custIcon }).addTo(mapRef.current);
        L.polyline([restaurantCoords, customerCoords], { color: '#ea580c', weight: 4, opacity: 0.5, dashArray: '10, 10' }).addTo(mapRef.current);
      }

      const drvIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="orange-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-2xl"><i class="fas fa-motorcycle"></i></div>`,
        iconSize: [48, 48]
      });
      driverMarkerRef.current = L.marker(driverPos, { icon: drvIcon }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        driverMarkerRef.current = null;
      }
    };
  }, [activeTab, currentJob]);

  // Movement Simulation
  useEffect(() => {
    if (currentJob && currentJob.status === OrderStatus.OUT_FOR_DELIVERY && activeTab === 'map') {
      const moveInterval = setInterval(() => {
        setDriverPos(prev => {
          const latDiff = customerCoords[0] - prev[0];
          const lngDiff = customerCoords[1] - prev[1];
          const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          if (dist < 0.0001) return prev;
          const next: [number, number] = [prev[0] + latDiff * 0.05, prev[1] + lngDiff * 0.05];
          if (driverMarkerRef.current) driverMarkerRef.current.setLatLng(next);
          return next;
        });
      }, 2000);
      return () => clearInterval(moveInterval);
    }
  }, [currentJob, activeTab]);

  const handleCashOut = () => {
    setIsCashingOut(true);
    setTimeout(() => setIsCashingOut(false), 3000);
  };

  const renderVehicleAssets = () => (
    <div className="flex-1 animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Vehicle Assets</h3>
      </div>
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 text-left">
        <div className="relative h-48 rounded-[2.5rem] overflow-hidden shadow-inner bg-gray-50">
           <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80" className="w-full h-full object-cover" />
           <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase">Primary</div>
        </div>
        <div>
           <h4 className="text-lg font-black text-gray-800">Diamond Glide X-1</h4>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">E-Motorcycle • ID: DG-7742</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
           <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Battery Status</p>
              <div className="flex items-center gap-2 mt-1">
                 <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[92%]"></div>
                 </div>
                 <span className="text-[10px] font-black text-gray-800">92%</span>
              </div>
           </div>
           <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Range</p>
              <p className="text-sm font-black text-gray-800 mt-1">124 km</p>
           </div>
        </div>
      </div>
      <button className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl">Manage Fleet</button>
    </div>
  );

  const renderOperatingZone = () => (
    <div className="flex-1 animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Operating Zone</h3>
      </div>
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 text-left">
        <div className="h-40 rounded-[2rem] bg-orange-50 flex items-center justify-center relative overflow-hidden border border-orange-100">
           <i className="fas fa-location-dot text-4xl text-orange-200 animate-bounce"></i>
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
        <div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Sector</p>
           <h4 className="text-lg font-black text-gray-800 mt-1">San Francisco • Central District</h4>
        </div>
        <div className="space-y-3">
           <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black text-gray-500 uppercase">Demand Tier</span>
              <span className="text-[10px] font-black text-orange-600 uppercase">Ultra High</span>
           </div>
           <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-[10px] font-black text-gray-500 uppercase">Bonus Multiplier</span>
              <span className="text-[10px] font-black text-green-600 uppercase">1.8x Active</span>
           </div>
        </div>
      </div>
      <button className="w-full py-5 rounded-2xl orange-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl">Update Zone Strategy</button>
    </div>
  );

  const renderSupportMatrix = () => (
    <div className="flex-1 animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Support Matrix</h3>
      </div>
      <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-xl space-y-6 text-left relative overflow-hidden">
         <i className="fas fa-sparkles absolute top-6 right-6 text-orange-500 animate-pulse"></i>
         <div className="space-y-1">
            <h4 className="text-lg font-black uppercase tracking-tight">Gemini Concierge</h4>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI Support Real-time</p>
         </div>
         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-[11px] font-medium leading-relaxed text-white/70">
           "I'm analyzing your current route. Traffic is building on Market St. I suggest taking 4th Ave for a 3-minute saving. How can I assist with your current mission?"
         </div>
         <div className="pt-4 flex gap-2">
            <button className="flex-1 bg-white text-gray-900 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">Live Chat</button>
            <button className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/10">Call Ops</button>
         </div>
         <i className="fas fa-brain absolute -bottom-10 -right-10 text-white/5 text-[10rem]"></i>
      </div>
      <div className="space-y-4">
         <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-widest px-2 text-left">Common Protocol</h4>
         {['Payment Issue', 'Accident Protocol', 'Restaurant Delay', 'Address Missing'].map(item => (
            <button key={item} className="w-full p-6 bg-white rounded-[2rem] border border-gray-50 text-left font-black text-[10px] uppercase tracking-widest flex justify-between items-center shadow-sm">
               {item} <i className="fas fa-chevron-right text-gray-200"></i>
            </button>
         ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Settings</h3>
      </div>
      <div className="space-y-4">
         {[
           { label: 'Push Notifications', active: true, icon: 'bell' },
           { label: 'Night Mode UI', active: false, icon: 'moon' },
           { label: 'Auto-Accept Orders', active: true, icon: 'bolt' },
           { label: 'High Precision GPS', active: true, icon: 'location-crosshairs' },
           { label: 'Biometric Login', active: true, icon: 'fingerprint' }
         ].map((s, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition">
                    <i className={`fas fa-${s.icon}`}></i>
                 </div>
                 <span className="font-black text-xs text-gray-700 uppercase tracking-widest">{s.label}</span>
              </div>
              <button className={`w-12 h-6 rounded-full relative transition-all ${s.active ? 'bg-orange-600' : 'bg-gray-200'}`}>
                 <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${s.active ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
           </div>
         ))}
      </div>
      <button className="w-full py-5 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest">Delete Courier Account</button>
    </div>
  );

  return (
    <MobileShell roleName="Courier" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-[#fafafa]">
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in text-left">
             <div className="flex justify-between items-center">
                <div className="space-y-1 text-left">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight text-left">Courier Portal</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Protocol Active</p>
                </div>
                <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${isOnline ? 'bg-orange-600 text-white shadow-xl shadow-orange-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                >
                  <i className={`fas fa-${isOnline ? 'wifi' : 'power-off'} text-lg`}></i>
                  <span className="text-[8px] font-black uppercase mt-1">{isOnline ? 'ON' : 'OFF'}</span>
                </button>
             </div>

             {currentJob ? (
               <div className="space-y-6 animate-slide-up text-left">
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-50 space-y-8 relative overflow-hidden text-left">
                     <div className="flex justify-between items-center relative z-10 text-left">
                        <h3 className="font-black text-lg text-gray-800 text-left">Mission Active</h3>
                        <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Fee: $12.40</div>
                     </div>
                     <div className="relative pl-10 space-y-12 text-left">
                        <div className="absolute left-4 top-2 bottom-2 w-[1px] border-l-2 border-dashed border-gray-100"></div>
                        <div className="relative text-left">
                           <div className="absolute -left-[2.2rem] w-8 h-8 orange-gradient rounded-xl flex items-center justify-center text-white text-xs border-4 border-white shadow-lg"><i className="fas fa-store"></i></div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Pick Up At</p>
                           <h4 className="font-black text-sm text-gray-800 text-left">Diamond Grill House</h4>
                        </div>
                        <div className="relative text-left">
                           <div className="absolute -left-[2.2rem] w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs border-4 border-white shadow-lg"><i className="fas fa-location-arrow"></i></div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Deliver To</p>
                           <h4 className="font-black text-sm text-gray-800 text-left">{currentJob.deliveryAddress}</h4>
                        </div>
                     </div>
                     <div className="flex gap-4 relative z-10 pt-4 text-left">
                        {currentJob.status === OrderStatus.ACCEPTED ? (
                          <button onClick={() => onUpdateStatus(currentJob.id, OrderStatus.OUT_FOR_DELIVERY)} className="flex-1 orange-gradient text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Complete Pick Up</button>
                        ) : (
                          <button onClick={() => onUpdateStatus(currentJob.id, OrderStatus.DELIVERED)} className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Hand Over & Finish</button>
                        )}
                        <button onClick={() => setActiveTab('map')} className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition shadow-inner">
                          <i className="fas fa-map-marked-alt text-xl"></i>
                        </button>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center px-2 text-left">
                    <h3 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] text-left">Available Missions</h3>
                    {isOnline && <span className="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Scan</span>}
                  </div>
                  {isOnline ? (
                    pendingJobs.length > 0 ? pendingJobs.map(job => (
                      <div key={job.id} onClick={() => onAcceptOrder(job.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-95 transition-all cursor-pointer hover:border-orange-100 text-left">
                         <div className="space-y-1 text-left">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-left">Task ID #{job.id.slice(-4)}</p>
                            <h4 className="font-black text-sm text-gray-800 tracking-tight text-left">Diamond Hub • 1.8km Away</h4>
                            <p className="text-orange-600 font-black text-2xl tracking-tighter text-left">$14.50</p>
                         </div>
                         <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-50 group-hover:rotate-6 transition">
                           <i className="fas fa-chevron-right"></i>
                         </div>
                      </div>
                    )) : (
                      <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 text-3xl animate-pulse"><i className="fas fa-radar"></i></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Optimizing Dispatch...</p>
                      </div>
                    )
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-40">
                       <i className="fas fa-power-off text-6xl text-gray-200"></i>
                       <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">Portal Offline</p>
                    </div>
                  )}
               </div>
             )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col h-full bg-white animate-fade-in relative text-left">
            <div className="p-6 space-y-1 text-left">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight text-left text-left">Live Matrix</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left text-left">
                {currentJob ? `Destination: ${currentJob.deliveryAddress}` : 'Standby for Dispatch'}
              </p>
            </div>
            <div ref={mapContainerRef} className="flex-1 z-0" />
            {currentJob && (
              <div className="absolute bottom-10 left-6 right-6 z-[40] animate-slide-up text-left">
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50 flex justify-between items-center text-left">
                  <div className="flex gap-4 items-center text-left">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white"><i className="fas fa-compass animate-spin-slow"></i></div>
                    <div className="text-left">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Est. Completion</p>
                      <p className="font-black text-sm text-gray-900 text-left">8.2 Minutes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Profit</p>
                    <p className="font-black text-xl text-gray-900">+$12.40</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in text-left">
             <div className="space-y-2 text-left">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight text-left">Matrix Wallet</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Real-time settlement</p>
             </div>
             <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-left">
                <div className="relative z-10 text-left">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 text-left">Total Balance</p>
                   <h3 className="text-6xl font-[900] tracking-tighter mt-2 text-left">$2,845</h3>
                   <button 
                     onClick={handleCashOut}
                     disabled={isCashingOut}
                     className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] mt-10 shadow-xl active:scale-95 transition ${isCashingOut ? 'bg-emerald-500 text-white' : 'bg-orange-600 text-white'}`}
                   >
                     {isCashingOut ? 'Settlement Processing...' : 'Instant Transfer'}
                   </button>
                </div>
                <i className="fas fa-wallet absolute -right-6 -bottom-6 text-white/5 text-[12rem] rotate-12"></i>
             </div>
             <div className="space-y-4 text-left">
                <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] px-2 text-left">History</h4>
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm text-left">
                    <div className="space-y-1 text-left">
                      <p className="font-black text-sm text-gray-800 tracking-tight text-left">Task Completion #{i}482</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-left">Settled Today • 12:45 PM</p>
                    </div>
                    <span className="text-emerald-600 font-black text-lg">+$14.50</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32 animate-fade-in flex flex-col text-left">
             {profileView === 'main' ? (
               <div className="space-y-10 text-left">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative pt-10">
                       <img src="https://picsum.photos/seed/driver/200/200" className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-2xl" alt="Driver" />
                       <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center text-white text-xs shadow-lg">
                          <i className="fas fa-check"></i>
                       </div>
                    </div>
                    <div className="text-center space-y-2 mt-6">
                       <h3 className="text-2xl font-black text-gray-900 tracking-tight">Alex "Nitro" Diamond</h3>
                       <div className="flex items-center gap-2 justify-center text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                          <i className="fas fa-star"></i> 5.0 Rating • Platinum Courier
                       </div>
                    </div>
                  </div>
                  <div className="w-full space-y-3 text-left">
                     {[
                       { id: 'vehicle', icon: 'motorcycle', label: 'Vehicle Assets' },
                       { id: 'zone', icon: 'map-location-dot', label: 'Operating Zone' },
                       { id: 'support', icon: 'sparkles', label: 'Support Matrix' },
                       { id: 'settings', icon: 'gear', label: 'Settings' }
                     ].map((item) => (
                        <button 
                          key={item.id} 
                          onClick={() => setProfileView(item.id as ProfileSubView)}
                          className="w-full flex justify-between items-center p-6 bg-white rounded-[2rem] border border-gray-50 hover:border-orange-100 transition shadow-sm group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition">
                                 <i className={`fas fa-${item.icon}`}></i>
                              </div>
                              <span className="font-black text-xs text-gray-600 uppercase tracking-widest">{item.label}</span>
                           </div>
                           <i className="fas fa-chevron-right text-gray-200 text-xs group-hover:text-orange-600 transition"></i>
                        </button>
                     ))}
                     <button onClick={onLogout} className="w-full py-6 text-red-500 font-black text-[11px] uppercase tracking-[0.3em] mt-10 active:scale-95 transition">Close Courier Link</button>
                  </div>
               </div>
             ) : (
               <>
                 {profileView === 'vehicle' && renderVehicleAssets()}
                 {profileView === 'zone' && renderOperatingZone()}
                 {profileView === 'support' && renderSupportMatrix()}
                 {profileView === 'settings' && renderSettings()}
               </>
             )}
          </div>
        )}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'tasks', icon: 'route', label: 'Route' },
            { id: 'map', icon: 'map-location-dot', label: 'Matrix' },
            { id: 'wallet', icon: 'wallet', label: 'Vault' },
            { id: 'profile', icon: 'circle-user', label: 'Link' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as DeliveryTab); setProfileView('main'); }} 
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}
            >
              <i className={`fas fa-${tab.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </MobileShell>
  );
};

export default DeliveryApp;
