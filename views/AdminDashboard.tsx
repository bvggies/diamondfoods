
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant, Order, OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import L from 'leaflet';

interface AdminDashboardProps {
  restaurants: Restaurant[];
  orders: Order[];
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ restaurants, orders, onLogout }) => {
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'analytics' | 'merchants' | 'users'>('overview');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const center: [number, number] = [37.7749, -122.4194];

  useEffect(() => {
    if (activeView === 'map' && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { attributionControl: false }).setView(center, 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(mapRef.current);
      restaurants.forEach((res, idx) => {
        const offset = idx * 0.02;
        const resIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="orange-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xl border-2 border-white relative"><i class="fas fa-utensils text-xs"></i></div>`,
          iconSize: [40, 40]
        });
        L.marker([center[0] + offset, center[1] + offset], { icon: resIcon }).addTo(mapRef.current!).bindPopup(`<b>${res.name}</b>`);
      });
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [activeView, restaurants]);

  const statsData = [
    { name: 'Mon', vol: 1200 }, { name: 'Tue', vol: 1900 }, { name: 'Wed', vol: 1500 },
    { name: 'Thu', vol: 2500 }, { name: 'Fri', vol: 3200 }, { name: 'Sat', vol: 4100 }, { name: 'Sun', vol: 3800 },
  ];

  const renderMerchants = () => (
    <div className="animate-fade-in space-y-10 text-left">
       <div className="flex justify-between items-end">
          <div className="space-y-1">
             <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Partner Management</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overseeing {restaurants.length} Global Hubs</p>
          </div>
          <button className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">+ Onboard Merchant</button>
       </div>
       <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-50">
                <tr>
                   <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Merchant</th>
                   <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                   <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                   <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales</th>
                   <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {restaurants.map(res => (
                   <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-8 flex items-center gap-4">
                         <img src={res.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                         <span className="font-black text-gray-800">{res.name}</span>
                      </td>
                      <td className="p-8"><span className="text-[10px] font-black text-gray-400 uppercase">{res.tags.join(' • ')}</span></td>
                      <td className="p-8">
                         <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase">Approved</span>
                      </td>
                      <td className="p-8 font-black text-gray-800">${(Math.random() * 50000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="p-8">
                         <div className="flex gap-2">
                            <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition"><i className="fas fa-eye text-xs"></i></button>
                            <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition"><i className="fas fa-ban text-xs"></i></button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderUsers = () => (
    <div className="animate-fade-in space-y-10 text-left">
       <div className="space-y-1">
          <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">User Experience Registry</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monitoring 1,248 Active Diamond Foodies</p>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-orange-100 transition-all">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} className="w-16 h-16 rounded-[1.5rem] shadow-md" />
                <div className="text-left">
                   <h4 className="font-black text-gray-800">User_{i} Diamond</h4>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active since 2024</p>
                   <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg uppercase">Elite Tier</span>
                      <span className="text-[8px] font-black bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg uppercase">#VIP-{i}02</span>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden text-left">
      <aside className="w-80 bg-gray-900 flex flex-col relative z-20">
         <div className="p-10 flex items-center gap-4 text-left">
            <div className="w-12 h-12 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-xl"><i className="fas fa-gem text-xl"></i></div>
            <div>
               <h1 className="text-xl font-black text-white tracking-tight">Diamond<span className="text-orange-500">foods</span></h1>
               <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">Architecture v3.0</p>
            </div>
         </div>
         <nav className="flex-1 px-6 space-y-3 mt-10">
            {[
              { id: 'overview', icon: 'grid-horizontal', label: 'Platform Hub' },
              { id: 'map', icon: 'earth-americas', label: 'Live Operations' },
              { id: 'merchants', icon: 'store', label: 'Merchant Hub' },
              { id: 'users', icon: 'users', label: 'User Experience' }
            ].map(item => (
              <button 
                key={item.id} onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 ${activeView === item.id ? 'bg-orange-600 text-white shadow-2xl' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                 <i className={`fas fa-${item.icon} text-lg`}></i>
                 <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
         </nav>
         <div className="p-10">
            <button onClick={onLogout} className="w-full py-4 rounded-2xl border border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500 transition-all font-black text-[10px] uppercase tracking-widest"><i className="fas fa-sign-out-alt mr-2"></i> Terminate Session</button>
         </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#fdfdfd]">
         <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center px-12 z-10 sticky top-0">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{activeView} Control</h2>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Platform health: Optimal <span className="text-green-500 ml-2 animate-pulse">●</span></p>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-12 space-y-12">
            {activeView === 'overview' && (
              <div className="animate-fade-in space-y-12 text-left">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: 'Platform Revenue', val: `$2.4M`, trend: '+18.2%', icon: 'dollar-sign', col: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Active Hubs', val: restaurants.length, trend: '+2 new', icon: 'utensils', col: 'bg-orange-50 text-orange-600' },
                      { label: 'Fleet Sync', val: '482', trend: '98% Eff.', icon: 'motorcycle', col: 'bg-green-50 text-green-600' },
                      { label: 'NPS Score', val: '4.92', trend: 'High', icon: 'heart', col: 'bg-red-50 text-red-600' }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 space-y-4">
                         <div className={`w-12 h-12 ${kpi.col} rounded-2xl flex items-center justify-center text-xl shadow-inner`}><i className={`fas fa-${kpi.icon}`}></i></div>
                         <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-800">{kpi.val}</h3></div>
                      </div>
                    ))}
                 </div>
                 <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-8 h-80">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Platform Velocity</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={statsData}>
                          <Area type="monotone" dataKey="vol" stroke="#4f46e5" fill="#f5f3ff" strokeWidth={4} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            )}
            {activeView === 'map' && <div className="h-full rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-sm relative"><div ref={mapContainerRef} className="h-full z-0" /></div>}
            {activeView === 'merchants' && renderMerchants()}
            {activeView === 'users' && renderUsers()}
         </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
