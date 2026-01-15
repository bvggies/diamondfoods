
import React, { useState } from 'react';
import { Restaurant, Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdminDashboardProps {
  restaurants: Restaurant[];
  orders: Order[];
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ restaurants, orders, onLogout }) => {
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'analytics'>('overview');
  const totalVolume = orders.reduce((s, o) => s + o.total, 0);

  const data = [
    { name: 'Mon', vol: 1200 },
    { name: 'Tue', vol: 1900 },
    { name: 'Wed', vol: 1500 },
    { name: 'Thu', vol: 2500 },
    { name: 'Fri', vol: 3200 },
    { name: 'Sat', vol: 4100 },
    { name: 'Sun', vol: 3800 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Premium Sidebar */}
      <aside className="w-80 bg-gray-900 flex flex-col relative z-20">
         <div className="p-10 flex items-center gap-4">
            <div className="w-12 h-12 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-xl">
               <i className="fas fa-gem text-xl"></i>
            </div>
            <div>
               <h1 className="text-xl font-black text-white tracking-tight">Diamond<span className="text-orange-500">foods</span></h1>
               <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">Architecture v3.0</p>
            </div>
         </div>

         <nav className="flex-1 px-6 space-y-3 mt-10">
            {[
              { id: 'overview', icon: 'grid-horizontal', label: 'Platform Hub' },
              { id: 'map', icon: 'earth-americas', label: 'Live Ops Map' },
              { id: 'analytics', icon: 'brain-circuit', label: 'Gemini Analytics' },
              { id: 'merchants', icon: 'store', label: 'Partner Management' },
              { id: 'users', icon: 'users', label: 'User Experience' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 ${activeView === item.id ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                 <i className={`fas fa-${item.icon} text-lg`}></i>
                 <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
         </nav>

         <div className="p-10">
            <button 
              onClick={onLogout}
              className="w-full py-4 rounded-2xl border border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-500 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
            >
               <i className="fas fa-sign-out-alt"></i> Terminate Session
            </button>
         </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col relative">
         <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center px-12 z-10 sticky top-0">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{activeView} Overview</h2>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Platform health: Optimal <span className="text-green-500 ml-2 animate-pulse">●</span></p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex -space-x-3">
                  {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/seed/admin${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />)}
               </div>
               <div className="w-px h-10 bg-gray-100"></div>
               <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition shadow-sm"><i className="fas fa-cog"></i></button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-12 space-y-12">
            {activeView === 'overview' && (
              <div className="space-y-12 animate-fade-in">
                 {/* Top Level KPIs */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: 'Gross Volume', val: `$${totalVolume.toLocaleString()}`, trend: '+18.2%', icon: 'dollar-sign', col: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Active Partners', val: restaurants.length, trend: '+2 new', icon: 'utensils', col: 'bg-orange-50 text-orange-600' },
                      { label: 'Fleet Density', val: '482', trend: '98% Cap.', icon: 'motorcycle', col: 'bg-green-50 text-green-600' },
                      { label: 'Cust. Rating', val: '4.92', trend: 'High', icon: 'heart', col: 'bg-red-50 text-red-600' }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 space-y-4">
                         <div className={`w-12 h-12 ${kpi.col} rounded-2xl flex items-center justify-center text-xl shadow-inner`}><i className={`fas fa-${kpi.icon}`}></i></div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-800">{kpi.val}</h3>
                         </div>
                         <p className="text-[10px] font-black text-green-500 tracking-widest">{kpi.trend} Growth</p>
                      </div>
                    ))}
                 </div>

                 {/* Central Chart & Recent Events */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-8">
                       <div className="flex justify-between items-center">
                          <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Revenue Momentum</h3>
                          <div className="flex gap-2">
                             {['Week', 'Month', 'Year'].map(t => <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${t === 'Week' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-400'}`}>{t}</button>)}
                          </div>
                       </div>
                       <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={data}>
                                <defs>
                                   <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#9ca3af'}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                                <Area type="monotone" dataKey="vol" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorVol)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white space-y-8 relative overflow-hidden">
                       <h3 className="text-lg font-black uppercase tracking-widest relative z-10">AI Alerts</h3>
                       <div className="space-y-6 relative z-10">
                          {[
                            { icon: 'bolt', text: 'Demand spike in Zone A predicted for 7PM.', col: 'text-orange-500' },
                            { icon: 'shield-check', text: 'Courier density optimized in Downtown.', col: 'text-green-500' },
                            { icon: 'triangle-exclamation', text: '3 restaurants reporting inventory lag.', col: 'text-yellow-500' }
                          ].map((alert, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                               <i className={`fas fa-${alert.icon} ${alert.col} mt-1`}></i>
                               <p className="text-xs font-medium text-gray-300 leading-relaxed">{alert.text}</p>
                            </div>
                          ))}
                       </div>
                       <i className="fas fa-brain absolute -right-6 -bottom-6 text-white/5 text-[10rem] rotate-12"></i>
                       <button className="w-full py-5 rounded-2xl bg-white text-gray-900 font-black text-[10px] uppercase tracking-widest relative z-10 mt-10 shadow-xl active:scale-95 transition">Full Analytics Report</button>
                    </div>
                 </div>
              </div>
            )}

            {activeView === 'map' && (
              <div className="h-full bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden relative animate-fade-in">
                 <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/adminmap/1600/1200')] bg-cover opacity-70 grayscale"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                       <div className="w-40 h-40 bg-orange-600/10 rounded-full animate-ping flex items-center justify-center">
                          <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center">
                             <div className="w-6 h-6 bg-orange-600 rounded-full border-4 border-white shadow-2xl"></div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="absolute bottom-10 left-10 glass p-10 rounded-[3rem] border border-white shadow-2xl space-y-6">
                    <h4 className="font-black text-gray-800 tracking-widest uppercase text-xs">Platform Real-time</h4>
                    <div className="flex gap-10">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Active Orders</p>
                          <p className="text-2xl font-black text-orange-600">842</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Live Couriers</p>
                          <p className="text-2xl font-black text-blue-600">156</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
