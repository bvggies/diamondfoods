
import React, { useState, useMemo } from 'react';
import { Restaurant, Order, OrderStatus, MenuItem } from '../types';
import { geminiService } from '../services/geminiService';
import MobileShell from '../components/MobileShell';
import Logo from '../components/Logo';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface RestaurantAppProps {
  restaurant: Restaurant;
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onToggleMenuItem: (itemId: string) => void;
  onUpdateBanners: (banners: string[]) => void;
  onLogout: () => void;
}

type ResTab = 'orders' | 'menu' | 'stats' | 'promos';

const RestaurantApp: React.FC<RestaurantAppProps> = ({ restaurant, orders, onUpdateStatus, onToggleMenuItem, onUpdateBanners, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ResTab>('orders');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', desc: '', category: 'Main' });

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

  const stats = useMemo(() => ({
    revenueHistory: [
      { day: 'Mon', revenue: 420 }, { day: 'Tue', revenue: 380 }, { day: 'Wed', revenue: 520 },
      { day: 'Thu', revenue: 490 }, { day: 'Fri', revenue: 780 }, { day: 'Sat', revenue: 920 }, { day: 'Sun', revenue: 840 }
    ],
    totalRevenue: orders.reduce((s, o) => s + o.total, 0)
  }), [orders]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would dispatch to the server
    setShowAddItem(false);
    setNewItem({ name: '', price: '', desc: '', category: 'Main' });
  };

  return (
    <MobileShell roleName="Restaurant" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-white">
        <header className="px-6 py-8 border-b border-gray-50 flex justify-between items-center">
           <Logo size="sm" />
           <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Open
           </div>
        </header>

        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 animate-fade-in text-left">
             <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Active Queue</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeOrders.length} Pending Actions</p>
             </div>
             <div className="space-y-4">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase">#{order.id.slice(-6)}</p>
                           <h4 className="font-black text-gray-800">{order.items.length} Items • ${order.total.toFixed(2)}</h4>
                        </div>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase">{order.status}</span>
                     </div>
                     <div className="flex gap-2">
                        {order.status === OrderStatus.PENDING ? (
                          <button onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)} className="flex-1 orange-gradient text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Accept Task</button>
                        ) : (
                          <button onClick={() => onUpdateStatus(order.id, OrderStatus.READY)} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Mark Ready</button>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 animate-fade-in text-left">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Vault Inventory</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{restaurant.menu.length} Unique Assets</p>
                </div>
                <button onClick={() => setShowAddItem(true)} className="w-12 h-12 orange-gradient rounded-2xl text-white shadow-xl flex items-center justify-center"><i className="fas fa-plus"></i></button>
             </div>
             <div className="space-y-4">
                {restaurant.menu.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                           <h4 className="font-black text-sm text-gray-800">{item.name}</h4>
                           <p className="text-orange-600 font-black text-xs">${item.price}</p>
                        </div>
                     </div>
                     <button onClick={() => onToggleMenuItem(item.id)} className={`w-12 h-7 rounded-full relative transition-all ${item.isAvailable ? 'bg-orange-600' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${item.isAvailable ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 animate-fade-in text-left">
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Performance Matrix</h3>
             <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Revenue</p>
                <h3 className="text-5xl font-black mt-2 tracking-tighter">${stats.totalRevenue.toFixed(2)}</h3>
                <i className="fas fa-chart-line absolute -right-6 -bottom-6 text-white/5 text-[10rem] rotate-12"></i>
             </div>
             <div className="h-64 bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">Revenue Trend</p>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.revenueHistory}>
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#fff7ed" strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 animate-fade-in text-left">
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ads & Banners</h3>
             <div className="space-y-4">
                {restaurant.promoBanners?.map((b, i) => (
                  <div key={i} className="relative rounded-[2.5rem] overflow-hidden group shadow-lg">
                     <img src={b} className="w-full h-40 object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-red-500 text-white w-12 h-12 rounded-2xl shadow-xl"><i className="fas fa-trash"></i></button>
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full py-5 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest">+ Upload New Creative</button>
          </div>
        )}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'orders', icon: 'clipboard-list', label: 'Queue' },
            { id: 'menu', icon: 'shield-halved', label: 'Vault' },
            { id: 'promos', icon: 'rectangle-ad', label: 'Market' },
            { id: 'stats', icon: 'chart-pie', label: 'Stats' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ResTab)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}>
              <i className={`fas fa-${tab.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </nav>

        {showAddItem && (
          <div className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end">
             <div className="w-full bg-white rounded-t-[3rem] p-10 animate-slide-up space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-gray-900">New Vault Asset</h3>
                   <button onClick={() => setShowAddItem(false)}><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleAddItem} className="space-y-4">
                   <input 
                      type="text" placeholder="Item Name" required 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                      value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                   />
                   <input 
                      type="number" placeholder="Price ($)" required 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" 
                      value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})}
                   />
                   <textarea 
                      placeholder="Description" 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold h-32"
                      value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})}
                   ></textarea>
                   <button type="submit" className="w-full orange-gradient text-white py-5 rounded-2xl font-black shadow-xl">Add to Menu</button>
                </form>
             </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default RestaurantApp;
