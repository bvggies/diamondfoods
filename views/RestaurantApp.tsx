
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
type SortCriteria = 'default' | 'sales';

const RestaurantApp: React.FC<RestaurantAppProps> = ({ restaurant, orders, onUpdateStatus, onToggleMenuItem, onUpdateBanners, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ResTab>('orders');
  const [shopStatus, setShopStatus] = useState<'Open' | 'Busy' | 'Closed'>('Open');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('default');

  const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  
  // Calculate Stats
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = completedOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // Top items for chart
    const topItemsData = [...restaurant.menu]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 12 ? item.name.substring(0, 10) + '..' : item.name,
        sales: item.salesCount || 0,
        fullName: item.name
      }));

    // Mock weekly revenue data for visualization
    const revenueHistory = [
      { day: 'Mon', revenue: totalRevenue * 0.1 },
      { day: 'Tue', revenue: totalRevenue * 0.12 },
      { day: 'Wed', revenue: totalRevenue * 0.08 },
      { day: 'Thu', revenue: totalRevenue * 0.15 },
      { day: 'Fri', revenue: totalRevenue * 0.25 },
      { day: 'Sat', revenue: totalRevenue * 0.2 },
      { day: 'Sun', revenue: totalRevenue * 0.1 },
    ];

    return { totalRevenue, orderCount, avgOrderValue, topItemsData, revenueHistory };
  }, [orders, restaurant.menu]);

  const runAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    const insights = await geminiService.analyzeMenuPerformance(restaurant.menu);
    setAiInsights(insights);
    setIsAiAnalyzing(false);
  };

  const handleAddBanner = () => {
    if (!newBannerUrl.trim()) return;
    const currentBanners = restaurant.promoBanners || [];
    onUpdateBanners([...currentBanners, newBannerUrl]);
    setNewBannerUrl('');
  };

  const handleRemoveBanner = (index: number) => {
    const currentBanners = restaurant.promoBanners || [];
    const updated = currentBanners.filter((_, i) => i !== index);
    onUpdateBanners(updated);
  };

  const sortedMenu = useMemo(() => {
    const menu = [...restaurant.menu];
    if (sortCriteria === 'sales') {
      return menu.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }
    return menu;
  }, [restaurant.menu, sortCriteria]);

  return (
    <MobileShell roleName="Restaurant" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-[#fdfdfd]">
        <header className="bg-white px-6 py-6 border-b border-gray-50 space-y-6">
           <div className="flex justify-between items-center">
              <Logo size="sm" />
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${shopStatus === 'Open' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{shopStatus}</span>
              </div>
           </div>
           <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl">
              {(['Open', 'Busy', 'Closed'] as const).map(s => (
                <button 
                  key={s} 
                  onClick={() => setShopStatus(s)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${shopStatus === s ? 'bg-white shadow-lg text-gray-900 border border-gray-100' : 'text-gray-400'}`}
                >
                  {s}
                </button>
              ))}
           </div>
        </header>

        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
             <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Active Queue</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeOrders.length} Priority tasks</p>
             </div>

             {activeOrders.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-40">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center"><i className="fas fa-receipt text-3xl"></i></div>
                 <p className="font-black text-xs uppercase tracking-widest">Kitchen Quiet...</p>
               </div>
             ) : (
               <div className="space-y-4">
                {activeOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 space-y-6 animate-slide-up">
                      <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">#{order.id.slice(-5)}</p>
                            <h4 className="font-black text-sm text-gray-800">{order.items.length} Items • ${order.total.toFixed(2)}</h4>
                        </div>
                        <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{order.status}</div>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs font-bold text-gray-600">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-[10px] text-gray-300">Prepared</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        {order.status === OrderStatus.PENDING ? (
                          <button onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)} className="flex-1 orange-gradient text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl tracking-widest">Accept Order</button>
                        ) : order.status === OrderStatus.PREPARING ? (
                          <button onClick={() => onUpdateStatus(order.id, OrderStatus.READY)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl tracking-widest">Set as Ready</button>
                        ) : (
                          <div className="flex-1 text-center py-4 bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl">Waiting for Courier</div>
                        )}
                      </div>
                  </div>
                ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
             <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">Vault Management</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu availability and insights</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setSortCriteria('default')}
                    className={`p-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortCriteria === 'default' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                   >
                     <i className="fas fa-list"></i>
                   </button>
                   <button 
                    onClick={() => setSortCriteria('sales')}
                    className={`p-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortCriteria === 'sales' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                   >
                     <i className="fas fa-fire"></i>
                   </button>
                </div>
             </div>

             <div className="space-y-4">
                {sortedMenu.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:border-orange-100 transition relative">
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={item.name} />
                           {item.salesCount && item.salesCount > 50 && (
                             <div className="absolute -top-2 -left-2 bg-orange-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-lg">
                               <i className="fas fa-fire-flame-curved"></i>
                             </div>
                           )}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-gray-800">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] font-black text-orange-600">${item.price}</p>
                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                            <div className="flex items-center gap-1.5 text-gray-400">
                               <i className="fas fa-chart-simple text-[9px]"></i>
                               <span className="text-[9px] font-black uppercase tracking-widest">{item.salesCount || 0} sales</span>
                            </div>
                          </div>
                        </div>
                     </div>
                     <button 
                       onClick={() => onToggleMenuItem(item.id)}
                       className={`w-14 h-8 rounded-full relative transition-all ${item.isAvailable ? 'bg-orange-600' : 'bg-gray-200'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${item.isAvailable ? 'right-1' : 'left-1'}`}></div>
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Promotions Hub</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Banners to Customers</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">New Banner Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="flex-1 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold text-xs"
                    />
                    <button 
                      onClick={handleAddBanner}
                      className="orange-gradient text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-orange-100"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] px-2">Active Banners</h4>
                {restaurant.promoBanners?.length ? (
                  <div className="space-y-4">
                    {restaurant.promoBanners.map((banner, idx) => (
                      <div key={idx} className="relative group rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                        <img src={banner} className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleRemoveBanner(idx)}
                            className="bg-red-500 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition active:scale-95"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-[3rem] text-center space-y-4">
                    <i className="fas fa-images text-gray-200 text-5xl"></i>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Banners Configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
             {/* Key Performance Indicators */}
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-black tracking-tight">${stats.totalRevenue.toFixed(2)}</h3>
                  <i className="fas fa-chart-line absolute -right-3 -bottom-3 text-white/5 text-6xl"></i>
               </div>
               <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Delivered Orders</p>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">{stats.orderCount}</h3>
               </div>
               <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg. Order Value</p>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">${stats.avgOrderValue.toFixed(2)}</h3>
               </div>
               <div className="bg-orange-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Growth Index</p>
                  <h3 className="text-2xl font-black tracking-tight">+12.4%</h3>
               </div>
             </div>

             {/* Revenue Chart */}
             <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue Forecast</h4>
                   <span className="text-[9px] font-bold text-green-500 uppercase">Live Feed</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueHistory}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#9ca3af'}} />
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Top Selling Items Chart */}
             <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Top Performing Assets</h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topItemsData} layout="vertical" margin={{ left: 5, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#374151'}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                      <Bar dataKey="sales" radius={[0, 10, 10, 0]} barSize={20}>
                        {stats.topItemsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fdba74'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* AI Audit Section */}
             <div className="space-y-6 pt-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-gray-800 tracking-tight">AI Audit</h3>
                   <button onClick={runAiAnalysis} disabled={isAiAnalyzing} className="glass px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-gray-200 hover:border-orange-600 transition">
                     {isAiAnalyzing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-sparkles text-orange-600"></i>}
                     Optimization Scan
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-orange-100 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 orange-gradient rounded-xl flex items-center justify-center text-white text-[10px] shadow-lg"><i className="fas fa-magic"></i></div>
                           <h4 className="font-black text-sm text-gray-800">{insight.suggestedName}</h4>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"{insight.suggestion}"</p>
                      </div>
                   )) : (
                     <div className="p-10 border-2 border-dashed border-gray-100 rounded-[3rem] text-center space-y-4">
                        <i className="fas fa-brain text-gray-200 text-5xl"></i>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Run scan for menu pricing tips</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'orders', icon: 'clipboard-list', label: 'Tasks' },
            { id: 'menu', icon: 'shield-halved', label: 'Vault' },
            { id: 'promos', icon: 'rectangle-ad', label: 'Ads' },
            { id: 'stats', icon: 'chart-pie', label: 'Stats' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ResTab)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}>
              <i className={`fas fa-${tab.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </MobileShell>
  );
};

export default RestaurantApp;
