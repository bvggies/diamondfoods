
import React, { useState, useEffect, useMemo } from 'react';
import { Restaurant, Order, MenuItem, OrderStatus, CartItem, PaymentMethod } from '../types';
import { geminiService } from '../services/geminiService';
import MobileShell from '../components/MobileShell';
import Logo from '../components/Logo';

interface CustomerAppProps {
  restaurants: Restaurant[];
  orders: Order[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlaceOrder: (order: Order) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onRateOrder: (orderId: string, rating: number) => void;
  onLogout: () => void;
}

type Tab = 'home' | 'search' | 'orders' | 'profile';
type CheckoutStep = 'cart' | 'details' | 'payment' | 'done';
type ProfileSubView = 'main' | 'addresses' | 'wallet' | 'favorites';

const CustomerApp: React.FC<CustomerAppProps> = ({ 
  restaurants, 
  orders, 
  favorites, 
  onToggleFavorite, 
  onPlaceOrder, 
  onCancelOrder,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profileView, setProfileView] = useState<ProfileSubView>('main');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);
  const [diamondPoints, setDiamondPoints] = useState(1240);
  const [walletBalance, setWalletBalance] = useState(250.00);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WALLET);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  
  // AI Recommendation State
  const [aiMood, setAiMood] = useState('hungry');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [addresses] = useState([
    { id: '1', label: 'Home', address: '777 Emerald Blvd, Penthouse A', isDefault: true },
    { id: '2', label: 'Office', address: 'Diamond Tech Plaza, Floor 42', isDefault: false }
  ]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(res => {
      const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           res.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCuisine = !selectedCuisine || res.tags.includes(selectedCuisine);
      return matchesSearch && matchesCuisine;
    });
  }, [restaurants, searchQuery, selectedCuisine]);

  const activeTrackingOrder = useMemo(() => {
    return orders.find(o => [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(o.status));
  }, [orders]);

  const handleGetAiRecommendations = async () => {
    setIsAiLoading(true);
    const recs = await geminiService.getFoodRecommendations(aiMood, "No nuts, high protein");
    setAiRecommendations(recs);
    setIsAiLoading(false);
  };

  const handlePlaceOrder = () => {
    if (!selectedRestaurant) return;
    if (paymentMethod === PaymentMethod.WALLET && walletBalance < cartTotal) {
      alert("Insufficient Diamond Wallet funds.");
      return;
    }

    const newOrder: Order = {
      id: `DIAMOND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      customerId: 'user-1',
      restaurantId: selectedRestaurant.id,
      items: [...cart],
      total: cartTotal + selectedRestaurant.deliveryFee,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      deliveryAddress: addresses.find(a => a.isDefault)?.address || 'The Diamond Towers',
      paymentMethod,
      loyaltyPointsEarned: Math.floor(cartTotal * 0.1)
    };
    
    if (paymentMethod === PaymentMethod.WALLET) {
      setWalletBalance(prev => prev - (cartTotal + selectedRestaurant.deliveryFee));
    }

    onPlaceOrder(newOrder);
    setDiamondPoints(prev => prev + (newOrder.loyaltyPointsEarned || 0));
    setCart([]);
    setCheckoutStep(null);
    setSelectedRestaurant(null);
    setActiveTab('orders');
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    setCart(prev => [...prev, { ...selectedItem, quantity: 1, price: selectedItem.price }]);
    setSelectedItem(null);
  };

  const renderWallet = () => (
    <div className="flex-1 animate-fade-in space-y-8 p-6 text-left">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm"><i className="fas fa-chevron-left"></i></button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Diamond Wallet</h3>
      </div>
      <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-left">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Available Balance</p>
        <h3 className="text-5xl font-black tracking-tighter mt-2">${walletBalance.toFixed(2)}</h3>
        <div className="flex gap-3 mt-8">
           <button className="flex-1 py-4 bg-orange-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Add Funds</button>
           <button className="flex-1 py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10">Vouchers</button>
        </div>
        <i className="fas fa-wallet absolute -right-6 -bottom-6 text-white/5 text-[10rem] rotate-12"></i>
      </div>
      <div className="space-y-4">
         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Recent Transactions</h4>
         {orders.slice(0, 3).map((o, i) => (
           <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-50 flex justify-between items-center shadow-sm">
             <div>
                <p className="font-black text-sm text-gray-800">Order Ref #{o.id.slice(-6)}</p>
                <p className="text-[9px] font-bold text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
             </div>
             <span className="text-red-500 font-black text-xs">-${o.total.toFixed(2)}</span>
           </div>
         ))}
      </div>
    </div>
  );

  const renderAddresses = () => (
    <div className="flex-1 animate-fade-in space-y-8 p-6 text-left">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm"><i className="fas fa-chevron-left"></i></button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Delivery Vault</h3>
      </div>
      <div className="space-y-4">
        {addresses.map(addr => (
          <div key={addr.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 ${addr.isDefault ? 'bg-orange-50 text-orange-600' : 'bg-gray-50'}`}>
                <i className={`fas fa-${addr.label === 'Home' ? 'house' : 'building'}`}></i>
              </div>
              <div>
                <h4 className="font-black text-sm text-gray-800">{addr.label}</h4>
                <p className="text-[10px] text-gray-400 font-medium truncate w-40">{addr.address}</p>
              </div>
            </div>
            {addr.isDefault && <span className="bg-orange-600 text-white text-[7px] font-black px-2 py-1 rounded-full uppercase">Default</span>}
          </div>
        ))}
      </div>
      <button className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl">+ Add New Location</button>
    </div>
  );

  const renderFavorites = () => (
    <div className="flex-1 animate-fade-in space-y-8 p-6 text-left">
      <div className="flex items-center gap-4">
        <button onClick={() => setProfileView('main')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-900 shadow-sm"><i className="fas fa-chevron-left"></i></button>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Saved Kitchens</h3>
      </div>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {restaurants.filter(r => favorites.includes(r.id)).map(res => (
            <div key={res.id} onClick={() => setSelectedRestaurant(res)} className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-4">
              <img src={res.image} className="w-20 h-20 rounded-2xl object-cover" />
              <div>
                <h4 className="font-black text-sm text-gray-800">{res.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">{res.tags[0]}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(res.id); }} className="text-red-500 text-xs"><i className="fas fa-heart"></i> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center opacity-30">
          <i className="fas fa-heart-crack text-5xl mb-4"></i>
          <p className="font-black text-xs uppercase tracking-widest">No favorites yet</p>
        </div>
      )}
    </div>
  );

  // Added missing renderProfileMain function to fix compilation error.
  const renderProfileMain = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in text-left">
      <div className="flex flex-col items-center text-center pt-10">
        <div className="relative">
          <img src="https://picsum.photos/seed/customer/200/200" className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-2xl" alt="User" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-xl border-4 border-white flex items-center justify-center text-white text-xs shadow-lg">
            <i className="fas fa-crown"></i>
          </div>
        </div>
        <div className="text-center space-y-2 mt-6">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">VIP Member</h3>
          <div className="flex items-center gap-2 justify-center text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
            <i className="fas fa-gem"></i> {diamondPoints} Diamond Points
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { id: 'wallet', icon: 'wallet', label: 'Diamond Wallet', sub: `$${walletBalance.toFixed(2)} Available` },
          { id: 'addresses', icon: 'map-location-dot', label: 'Delivery Vault', sub: `${addresses.length} Locations Saved` },
          { id: 'favorites', icon: 'heart', label: 'Saved Kitchens', sub: `${favorites.length} Restaurants` }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setProfileView(item.id as ProfileSubView)}
            className="w-full flex justify-between items-center p-6 bg-white rounded-[2rem] border border-gray-50 hover:border-orange-100 transition shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition">
                <i className={`fas fa-${item.icon} text-lg`}></i>
              </div>
              <div className="text-left">
                <span className="font-black text-xs text-gray-800 uppercase tracking-widest block">{item.label}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-200 text-xs group-hover:text-orange-600 transition"></i>
          </button>
        ))}
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-6 text-red-500 font-black text-[11px] uppercase tracking-[0.3em] mt-10 active:scale-95 transition"
      >
        Close Diamond Link
      </button>
    </div>
  );

  const renderSearch = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in text-left">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Explore</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Powered by Gemini Logic</p>
      </div>

      <div className="relative">
        <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"></i>
        <input 
          type="text" 
          placeholder="Cravings, restaurants, or flavors..." 
          className="w-full p-6 pl-14 bg-gray-50 rounded-[2.5rem] border-none focus:ring-2 focus:ring-orange-500 font-bold shadow-inner"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* AI MOOD SECTION */}
      <div className="bg-gray-900 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">AI Concierge</p>
          <h3 className="text-xl font-black">How are you feeling today?</h3>
        </div>
        <div className="flex gap-2 relative z-10 flex-wrap">
          {['Hungry', 'Adventurous', 'Tired', 'Healthy', 'Celebratory'].map(mood => (
            <button 
              key={mood}
              onClick={() => setAiMood(mood.toLowerCase())}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${aiMood === mood.toLowerCase() ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              {mood}
            </button>
          ))}
        </div>
        <button 
          onClick={handleGetAiRecommendations}
          disabled={isAiLoading}
          className="w-full py-4 orange-gradient rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] relative z-10 shadow-xl disabled:opacity-50"
        >
          {isAiLoading ? 'Analyzing Patterns...' : 'Consult Gemini'}
        </button>
        <i className="fas fa-sparkles absolute -right-6 -bottom-6 text-white/5 text-9xl"></i>
      </div>

      {aiRecommendations.length > 0 && (
        <div className="space-y-4 animate-slide-up">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Smart Suggestions</h4>
           <div className="grid grid-cols-1 gap-4">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-start gap-4">
                   <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white text-xs"><i className="fas fa-brain"></i></div>
                   <div>
                      <h4 className="font-black text-sm text-gray-800">{rec.foodType}</h4>
                      <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1">{rec.reason}</p>
                      <span className="inline-block mt-2 bg-gray-50 px-2 py-0.5 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-widest">{rec.vibe} Vibe</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-black text-gray-800 tracking-tight">Search Results</h3>
        {filteredRestaurants.map(res => (
          <div key={res.id} onClick={() => setSelectedRestaurant(res)} className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group cursor-pointer active:scale-95 transition">
            <img src={res.image} className="w-24 h-24 rounded-[2rem] object-cover" />
            <div className="flex-1">
              <h4 className="font-black text-gray-800">{res.name}</h4>
              <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{res.tags.join(' • ')}</p>
              <div className="mt-3 flex items-center gap-4">
                 <span className="text-[10px] font-black text-orange-600 tracking-widest uppercase">{res.deliveryTime}</span>
                 <span className="text-[10px] font-black text-gray-900 tracking-widest uppercase">${res.deliveryFee} Fee</span>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-200 mr-4 group-hover:text-orange-600 transition"></i>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in text-left">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Vault</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">History & Real-time tracking</p>
      </div>

      {activeTrackingOrder && (
        <div className="bg-gray-900 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
             <div className="space-y-1">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active Dispatch</p>
                <h3 className="text-lg font-black">{restaurants.find(r => r.id === activeTrackingOrder.restaurantId)?.name}</h3>
             </div>
             <div className="bg-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg animate-pulse">On Way</div>
          </div>
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden z-10">
             <div className="absolute left-0 top-0 bottom-0 bg-orange-600 w-2/3"></div>
          </div>
          <p className="text-[10px] font-medium text-white/60 z-10">Courier Diamond #77 is approaching your location.</p>
          <i className="fas fa-motorcycle absolute -right-6 -bottom-6 text-white/5 text-9xl"></i>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-widest px-2">Past Missions</h4>
        {orders.length > 0 ? (
          orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 group hover:border-orange-100 transition-all">
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-black text-gray-800 group-hover:text-orange-600 transition">{restaurants.find(r => r.id === order.restaurantId)?.name || 'Merchant'}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter ${order.status === OrderStatus.DELIVERED ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {order.status}
                 </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <p className="text-[10px] font-bold text-gray-500">{order.items.length} items • ${order.total.toFixed(2)}</p>
                 <button className="text-[9px] font-black text-orange-600 uppercase tracking-widest border border-orange-100 px-4 py-2 rounded-xl hover:bg-orange-600 hover:text-white transition">Re-order</button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-30">
            <i className="fas fa-box-open text-5xl mb-4"></i>
            <p className="font-black text-xs uppercase tracking-widest">No previous orders</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MobileShell roleName="Customer" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-white">
        {activeTab === 'home' && (
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in text-left">
             <header className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Elite Delivery to</p>
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">Penthouse A <i className="fas fa-chevron-down text-orange-600 text-[10px]"></i></h2>
                </div>
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-orange-600 shadow-sm"><i className="fas fa-gem"></i></div>
             </header>
             <div className="orange-gradient rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <h3 className="text-3xl font-black leading-tight">Diamond <br/> Exclusive.</h3>
                <p className="text-xs font-medium text-white/70 mt-4">Michelin-star selections daily.</p>
                <i className="fas fa-crown absolute -right-6 -bottom-6 text-white/10 text-[10rem] rotate-12"></i>
             </div>
             <div className="space-y-6">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Top Selections</h3>
                {restaurants.map(res => (
                  <div key={res.id} onClick={() => setSelectedRestaurant(res)} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                    <img src={res.image} className="h-48 w-full object-cover group-hover:scale-105 transition duration-700" />
                    <div className="p-6 text-left">
                       <h4 className="text-lg font-black text-gray-800">{res.name}</h4>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{res.tags[0]} • {res.deliveryTime}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <>
            {profileView === 'main' && renderProfileMain()}
            {profileView === 'wallet' && renderWallet()}
            {profileView === 'addresses' && renderAddresses()}
            {profileView === 'favorites' && renderFavorites()}
          </>
        )}

        {activeTab === 'search' && renderSearch()}
        {activeTab === 'orders' && renderOrders()}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'home', icon: 'house', label: 'Home' },
            { id: 'search', icon: 'sparkles', label: 'AI' },
            { id: 'orders', icon: 'bag-shopping', label: 'Orders' },
            { id: 'profile', icon: 'user', label: 'Me' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as Tab); setProfileView('main'); }} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}>
              <i className={`fas fa-${tab.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </nav>

        {selectedRestaurant && (
          <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-fade-in">
             <div className="relative h-64">
                <img src={selectedRestaurant.image} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedRestaurant(null)} className="absolute top-8 left-8 w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-xl"><i className="fas fa-chevron-left"></i></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-8 text-left">
                <h2 className="text-3xl font-black text-gray-900">{selectedRestaurant.name}</h2>
                <div className="space-y-4 pb-40">
                   {selectedRestaurant.menu.map(item => (
                     <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-gray-50 p-5 rounded-[2.5rem] flex gap-4 active:scale-95 transition cursor-pointer text-left">
                        <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" />
                        <div>
                           <h4 className="font-black text-sm text-gray-800">{item.name}</h4>
                           <p className="text-[10px] text-gray-400 mt-1">{item.description}</p>
                           <p className="font-black text-orange-600 mt-2">${item.price}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             {cart.length > 0 && (
               <button onClick={() => setCheckoutStep('cart')} className="absolute bottom-8 left-8 right-8 orange-gradient text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl z-[110]">
                  <span className="font-black text-lg">${cartTotal.toFixed(2)}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Checkout Now</span>
               </button>
             )}
          </div>
        )}

        {selectedItem && (
          <div className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end">
             <div className="w-full bg-white rounded-t-[3rem] p-10 animate-slide-up space-y-6 text-center">
                <img src={selectedItem.image} className="w-full h-48 object-cover rounded-[2rem] shadow-xl" />
                <h3 className="text-2xl font-black text-gray-900">{selectedItem.name}</h3>
                <button onClick={handleAddToCart} className="w-full orange-gradient text-white py-5 rounded-2xl font-black shadow-xl">Add to Basket • ${selectedItem.price}</button>
                <button onClick={() => setSelectedItem(null)} className="w-full py-2 text-gray-400 font-black text-[10px] uppercase">Cancel</button>
             </div>
          </div>
        )}

        {checkoutStep && (
          <div className="absolute inset-0 z-[200] bg-white flex flex-col animate-slide-up text-left">
             <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black text-gray-900">Checkout</h2>
                   <button onClick={() => setCheckoutStep(null)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
                <div className="space-y-4">
                   <div className="p-6 bg-gray-50 rounded-[2rem] space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery To</p>
                      <p className="font-black text-sm text-gray-800">{addresses.find(a => a.isDefault)?.address}</p>
                   </div>
                   <div className="p-6 bg-gray-50 rounded-[2rem] space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Payment via</p>
                      <p className="font-black text-sm text-gray-800">Diamond Wallet (${walletBalance.toFixed(2)})</p>
                   </div>
                </div>
                <div className="border-t border-gray-100 pt-8 space-y-2">
                   <div className="flex justify-between text-gray-400 font-bold text-sm"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-gray-900 font-black text-xl pt-4 border-t border-gray-50"><span>Total</span><span>${(cartTotal + (selectedRestaurant?.deliveryFee || 0)).toFixed(2)}</span></div>
                </div>
             </div>
             <div className="mt-auto p-8">
                <button onClick={handlePlaceOrder} className="w-full orange-gradient text-white py-6 rounded-2xl font-black text-lg shadow-xl">Complete Order</button>
             </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default CustomerApp;
