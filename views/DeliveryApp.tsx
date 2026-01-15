
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import MobileShell from '../components/MobileShell';
import Logo from '../components/Logo';

interface DeliveryAppProps {
  orders: Order[];
  onAcceptOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onLogout: () => void;
}

type DeliveryTab = 'tasks' | 'map' | 'wallet' | 'profile';

const DeliveryApp: React.FC<DeliveryAppProps> = ({ orders, onAcceptOrder, onUpdateStatus, onLogout }) => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('tasks');
  const [isOnline, setIsOnline] = useState(true);

  const pendingJobs = orders.filter(o => o.status === OrderStatus.READY);
  const currentJob = orders.find(o => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.OUT_FOR_DELIVERY);

  return (
    <MobileShell roleName="Courier" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-[#fafafa]">
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in">
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Courier Portal</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Active</p>
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
               <div className="space-y-6 animate-slide-up">
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-50 space-y-8 relative overflow-hidden">
                     <div className="flex justify-between items-center relative z-10">
                        <h3 className="font-black text-lg text-gray-800">Mission Active</h3>
                        <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Fee: $12.40</div>
                     </div>

                     <div className="relative pl-10 space-y-12">
                        <div className="absolute left-4 top-2 bottom-2 w-[1px] border-l-2 border-dashed border-gray-100"></div>
                        <div className="relative">
                           <div className="absolute -left-[2.2rem] w-8 h-8 orange-gradient rounded-xl flex items-center justify-center text-white text-xs border-4 border-white shadow-lg"><i className="fas fa-store"></i></div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick Up At</p>
                           <p className="font-black text-sm text-gray-800">Diamond Grill • Bay 4</p>
                        </div>
                        <div className="relative">
                           <div className="absolute -left-[2.2rem] w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs border-4 border-white shadow-lg"><i className="fas fa-location-arrow"></i></div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver To</p>
                           <p className="font-black text-sm text-gray-800">{currentJob.deliveryAddress}</p>
                        </div>
                     </div>

                     <div className="flex gap-4 relative z-10 pt-4">
                        {currentJob.status === OrderStatus.ACCEPTED ? (
                          <button onClick={() => onUpdateStatus(currentJob.id, OrderStatus.OUT_FOR_DELIVERY)} className="flex-1 orange-gradient text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Complete Pick Up</button>
                        ) : (
                          <button onClick={() => onUpdateStatus(currentJob.id, OrderStatus.DELIVERED)} className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Hand Over & Finish</button>
                        )}
                     </div>
                     <i className="fas fa-gem absolute -right-6 -bottom-6 text-orange-500/5 text-9xl"></i>
                  </div>
               </div>
             ) : (
               <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em]">Available Missions</h3>
                    {isOnline && <span className="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Scan</span>}
                  </div>
                  
                  {isOnline ? (
                    pendingJobs.length > 0 ? pendingJobs.map(job => (
                      <div key={job.id} onClick={() => onAcceptOrder(job.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between group active:scale-95 transition-all cursor-pointer hover:border-orange-100">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Task ID #{job.id.slice(-4)}</p>
                            <h4 className="font-black text-sm text-gray-800 tracking-tight">Grill House • 1.8km Away</h4>
                            <p className="text-orange-600 font-black text-2xl tracking-tighter">$14.50</p>
                         </div>
                         <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-50 group-hover:rotate-6 transition">
                           <i className="fas fa-chevron-right"></i>
                         </div>
                      </div>
                    )) : (
                      <div className="py-20 flex flex-col items-center justify-center space-y-6">
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

        {activeTab === 'wallet' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Matrix Wallet</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time settlement</p>
             </div>
             <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Total Balance</p>
                   <h3 className="text-6xl font-[900] tracking-tighter mt-2">$2,845</h3>
                   <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] mt-10 shadow-xl shadow-black/40 active:scale-95 transition">Instant Transfer</button>
                </div>
                <i className="fas fa-wallet absolute -right-6 -bottom-6 text-white/5 text-[12rem] rotate-12"></i>
             </div>
             <div className="space-y-4">
                <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] px-2">History</h4>
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm">
                    <div className="space-y-1">
                      <p className="font-black text-sm text-gray-800 tracking-tight">Batch Payout #{i}482</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Processed Today</p>
                    </div>
                    <span className="text-emerald-600 font-black text-lg">+$142.00</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-32 animate-fade-in flex flex-col items-center">
             <div className="relative pt-10">
                <img src="https://picsum.photos/seed/driver/200/200" className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-2xl" alt="Driver" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center text-white text-xs shadow-lg">
                   <i className="fas fa-check"></i>
                </div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Alex "Nitro" Diamond</h3>
                <div className="flex items-center gap-2 justify-center text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                   <i className="fas fa-star"></i> 5.0 Rating • Platinum Courier
                </div>
             </div>
             <div className="w-full space-y-3">
                {['Vehicle Assets', 'Operating Zone', 'Support Matrix', 'Settings'].map((item, i) => (
                   <button key={i} className="w-full flex justify-between items-center p-6 bg-white rounded-[2rem] border border-gray-50 hover:border-orange-100 transition shadow-sm group">
                      <span className="font-black text-xs text-gray-600 uppercase tracking-widest">{item}</span>
                      <i className="fas fa-chevron-right text-gray-200 text-xs group-hover:text-orange-600 transition"></i>
                   </button>
                ))}
                <button onClick={onLogout} className="w-full py-6 text-red-500 font-black text-[11px] uppercase tracking-[0.3em] mt-10 active:scale-95 transition">Close Courier Link</button>
             </div>
          </div>
        )}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'tasks', icon: 'route', label: 'Route' },
            { id: 'map', icon: 'map-location-dot', label: 'Matrix' },
            { id: 'wallet', icon: 'wallet', label: 'Vault' },
            { id: 'profile', icon: 'circle-user', label: 'Link' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as DeliveryTab)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}>
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
