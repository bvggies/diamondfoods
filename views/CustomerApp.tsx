
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Restaurant, Order, MenuItem, OrderStatus, CartItem, Addon, PaymentMethod } from '../types';
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

interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
}

const CANCELLATION_REASONS = [
  'Changed my mind',
  'Accidentally ordered',
  'Restaurant too slow',
  'Delivery issues',
  'Other'
];

const CustomerApp: React.FC<CustomerAppProps> = ({ 
  restaurants, 
  orders, 
  favorites, 
  onToggleFavorite, 
  onPlaceOrder, 
  onCancelOrder,
  onRateOrder, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep | null>(null);
  const [diamondPoints, setDiamondPoints] = useState(1240);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WALLET);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedPriceTier, setSelectedPriceTier] = useState<number | null>(null); // 1, 2, 3
  const [selectedTimeTier, setSelectedTimeTier] = useState<string | null>(null); // 'fast', 'mid'

  // Cancellation State
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Notification state
  const [activeNotification, setActiveNotification] = useState<PushNotification | null>(null);
  const prevOrdersRef = useRef<Order[]>([]);

  // Profile Specific State
  const [addresses] = useState([
    { id: '1', label: 'Home', address: '777 Emerald Blvd, Penthouse A', isDefault: true },
    { id: '2', label: 'Office', address: 'Diamond Tech Plaza, Floor 42', isDefault: false }
  ]);

  // Tracking state for live delivery simulation
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [driverPos, setDriverPos] = useState({ x: 15, y: 15 });
  const [destPos] = useState({ x: 85, y: 85 });
  const [aiETA, setAiETA] = useState<{ minutes: number, reasoning: string, confidence: number } | null>(null);
  const [isPredictingETA, setIsPredictingETA] = useState(false);

  // Predicted waypoints to simulate road turns
  const routeWaypoints = useMemo(() => [
    { x: 15, y: 15 },
    { x: 40, y: 15 },
    { x: 40, y: 50 },
    { x: 75, y: 50 },
    { x: 75, y: 85 },
    { x: 85, y: 85 }
  ], []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const favoriteRestaurants = useMemo(() => {
    return restaurants.filter(r => favorites.includes(r.id));
  }, [restaurants, favorites]);

  // Filtered results logic
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(res => {
      const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           res.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCuisine = !selectedCuisine || res.tags.includes(selectedCuisine);
      let priceTier = 3;
      if (res.deliveryFee < 1) priceTier = 1;
      else if (res.deliveryFee <= 1.5) priceTier = 2;
      const matchesPrice = !selectedPriceTier || priceTier === selectedPriceTier;
      const timeNum = parseInt(res.deliveryTime);
      const isFast = timeNum <= 20;
      const matchesTime = !selectedTimeTier || (selectedTimeTier === 'fast' ? isFast : !isFast);
      return matchesSearch && matchesCuisine && matchesPrice && matchesTime;
    });
  }, [restaurants, searchQuery, selectedCuisine, selectedPriceTier, selectedTimeTier]);

  const allCuisines = useMemo(() => {
    const tags = new Set<string>();
    restaurants.forEach(r => r.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [restaurants]);

  // Push Notification Logic
  useEffect(() => {
    const prevOrders = prevOrdersRef.current;
    orders.forEach(currentOrder => {
      const prevOrder = prevOrders.find(o => o.id === currentOrder.id);
      if (prevOrder && prevOrder.status !== currentOrder.status) {
        const restaurantName = getRestaurantName(currentOrder.restaurantId);
        let title = "Order Update";
        let body = "";
        let icon = "bell";

        switch (currentOrder.status) {
          case OrderStatus.ACCEPTED:
            title = "Order Accepted";
            body = `${restaurantName} is preparing your request.`;
            icon = "check-circle";
            break;
          case OrderStatus.PREPARING:
            title = "Kitchen Active";
            body = "Your meal is being crafted by our elite chefs.";
            icon = "fire-burner";
            break;
          case OrderStatus.READY:
            title = "Order Ready";
            body = "Your order is ready and waiting for a courier.";
            icon = "box";
            break;
          case OrderStatus.OUT_FOR_DELIVERY:
            title = "Out for Delivery";
            body = `Our courier is on the way with your feast!`;
            icon = "motorcycle";
            break;
          case OrderStatus.DELIVERED:
            title = "Order Delivered";
            body = "Enjoy your Diamond meal! Your feedback is appreciated.";
            icon = "house-circle-check";
            break;
          case OrderStatus.CANCELLED:
            title = "Order Cancelled";
            body = "There was an issue with your order. It has been cancelled.";
            icon = "times-circle";
            break;
        }

        if (body) {
          setActiveNotification({ id: Math.random().toString(), title, body, icon });
          setTimeout(() => setActiveNotification(null), 4000);
        }
      }
    });
    prevOrdersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    const active = orders.find(o => o.status === OrderStatus.OUT_FOR_DELIVERY || o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY || o.status === OrderStatus.PENDING);
    if (active && active.status !== OrderStatus.DELIVERED && active.status !== OrderStatus.CANCELLED) {
      setTrackingOrder(active);
    } else {
      setTrackingOrder(null);
    }
  }, [orders]);

  useEffect(() => {
    if (trackingOrder && trackingOrder.status === OrderStatus.OUT_FOR_DELIVERY) {
      const moveInterval = setInterval(() => {
        setDriverPos(prev => ({
          x: prev.x + (destPos.x - prev.x) * 0.015,
          y: prev.y + (destPos.y - prev.y) * 0.015
        }));
      }, 1500);

      const etaInterval = setInterval(async () => {
        setIsPredictingETA(true);
        const resObj = restaurants.find(r => r.id === trackingOrder.restaurantId);
        const historicalAvg = parseInt(resObj?.deliveryTime || "25");
        
        const prediction = await geminiService.predictETA(
          driverPos, 
          destPos, 
          "Moderate Traffic / Rain Protocol", 
          historicalAvg
        );
        
        setAiETA({ 
          minutes: prediction.estimatedMinutes, 
          reasoning: prediction.reasoning,
          confidence: prediction.confidenceScore
        });
        setIsPredictingETA(false);
      }, 15000);

      return () => {
        clearInterval(moveInterval);
        clearInterval(etaInterval);
      };
    }
  }, [trackingOrder?.status, driverPos, destPos, restaurants]);

  useEffect(() => {
    if (selectedRestaurant?.promoBanners?.length) {
      const interval = setInterval(() => {
        setActiveBannerIdx(prev => (prev + 1) % selectedRestaurant.promoBanners!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedRestaurant]);

  const handlePlaceOrder = () => {
    if (!selectedRestaurant) return;
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
    onPlaceOrder(newOrder);
    setDiamondPoints(prev => prev + (newOrder.loyaltyPointsEarned || 0));
    setCart([]);
    setCheckoutStep(null);
    setSelectedRestaurant(null);
    setActiveTab('orders');
    setDriverPos({ x: 15, y: 15 });
  };

  const handleReasonSelect = (reason: string) => {
    if (cancellingOrderId) {
      onCancelOrder(cancellingOrderId, reason);
      setCancellingOrderId(null);
    }
  };

  const getRestaurantName = (id: string) => restaurants.find(r => r.id === id)?.name || 'Premium Restaurant';

  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-amber-400',
    [OrderStatus.ACCEPTED]: 'bg-blue-400',
    [OrderStatus.PREPARING]: 'bg-purple-400',
    [OrderStatus.READY]: 'bg-indigo-400',
    [OrderStatus.OUT_FOR_DELIVERY]: 'bg-emerald-400',
    [OrderStatus.DELIVERED]: 'bg-green-500',
    [OrderStatus.CANCELLED]: 'bg-red-500',
  };

  const groupedOrders = useMemo<Record<string, Order[]>>(() => {
    const groups: Record<string, Order[]> = {};
    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    sortedOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateStr: string;
      if (date.toDateString() === today.toDateString()) {
        dateStr = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = 'Yesterday';
      } else {
        dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(order);
    });
    return groups;
  }, [orders]);

  const renderProfile = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in">
      <div className="flex flex-col items-center pt-10 text-center">
        <div className="relative">
          <img src="https://picsum.photos/seed/customer/200/200" className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-2xl" alt="Profile" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 orange-gradient rounded-full border-4 border-white flex items-center justify-center text-white text-xs">
            <i className="fas fa-pen"></i>
          </div>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mt-6 tracking-tight">Jane Diamond</h3>
        <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Diamond Elite Member</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Points</p>
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-gem text-orange-600"></i>
            <span className="text-xl font-black">{diamondPoints}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Orders</p>
          <div className="flex items-center justify-center gap-2">
            <i className="fas fa-shopping-bag text-orange-600"></i>
            <span className="text-xl font-black">{orders.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] px-2">Account Settings</h4>
        <div className="space-y-3">
          {[
            { icon: 'heart', label: 'My Favorites', val: `${favorites.length} Saved` },
            { icon: 'location-dot', label: 'My Addresses', val: `${addresses.length} Saved` },
            { icon: 'credit-card', label: 'Payment Methods', val: 'Wallet Default' },
            { icon: 'bell', label: 'Notifications', val: 'On' },
            { icon: 'shield-halved', label: 'Security & Privacy' },
            { icon: 'circle-info', label: 'Support & FAQs' }
          ].map((item, i) => (
            <button key={i} className="w-full flex justify-between items-center p-6 bg-white rounded-[2rem] border border-gray-50 hover:border-orange-100 transition shadow-sm group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 group-hover:bg-orange-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition">
                  <i className={`fas fa-${item.icon}`}></i>
                </div>
                <span className="font-bold text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {item.val && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.val}</span>}
                <i className="fas fa-chevron-right text-gray-200 text-xs"></i>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={onLogout} className="w-full py-6 bg-red-50 text-red-500 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition">
        Log out from Portal
      </button>
    </div>
  );

  const renderTracking = () => {
    if (!trackingOrder) return null;

    const trackingSteps = [
      { label: 'Pending', icon: 'clock', status: [OrderStatus.PENDING] },
      { label: 'Accepted', icon: 'check-double', status: [OrderStatus.ACCEPTED] },
      { label: 'Preparing', icon: 'fire-burner', status: [OrderStatus.PREPARING, OrderStatus.READY] },
      { label: 'On Way', icon: 'motorcycle', status: [OrderStatus.OUT_FOR_DELIVERY] },
      { label: 'Arrived', icon: 'house-circle-check', status: [OrderStatus.DELIVERED] },
    ];

    const currentStepIndex = trackingSteps.findIndex(step => 
      step.status.includes(trackingOrder.status)
    );

    const confidenceLevel = aiETA?.confidence || 0;
    const confidenceColor = confidenceLevel > 80 ? 'text-green-500' : confidenceLevel > 50 ? 'text-orange-500' : 'text-red-500';

    return (
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Track Delivery</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Protocol {trackingOrder.id}</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-x-hidden">
          <div className="relative flex justify-between items-center px-2">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-50 -translate-y-1/2 z-0 mx-8"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 orange-gradient -translate-y-1/2 z-0 mx-8 transition-all duration-1000 ease-in-out"
              style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 82}%` }}
            ></div>

            {trackingSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-4 border-white shadow-md ${
                    isActive ? 'orange-gradient text-white scale-110' : 
                    isCompleted ? 'bg-orange-100 text-orange-600' : 
                    'bg-gray-50 text-gray-300'
                  }`}>
                    <i className={`fas fa-${step.icon} text-xs`}></i>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter text-center whitespace-nowrap ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* REFINED MAP VIEW */}
        <div className="relative h-72 bg-[#f8f9fa] rounded-[3rem] overflow-hidden border border-gray-100 shadow-xl group">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
           
           <svg className="absolute inset-0 w-full h-full pointer-events-none">
             {/* Glow Filter */}
             <defs>
               <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="3" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
             </defs>
             
             {/* Full Predicted Path (Dashed) */}
             <polyline
               points={routeWaypoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
               fill="none"
               stroke="#e5e7eb"
               strokeWidth="4"
               strokeLinecap="round"
               strokeLinejoin="round"
             />

             {/* Animated Progress Path */}
             <polyline
               points={routeWaypoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
               fill="none"
               stroke="#ea580c"
               strokeWidth="3"
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeDasharray="10 5"
               className="animate-[dash_20s_linear_infinite]"
               filter="url(#glow)"
               style={{ opacity: 0.6 }}
             />

             {/* Segment from start to current driver pos */}
             <line 
                x1="15%" y1="15%" 
                x2={`${driverPos.x}%`} y2={`${driverPos.y}%`} 
                stroke="#ea580c" 
                strokeWidth="4" 
                strokeLinecap="round"
                filter="url(#glow)"
             />
           </svg>

           {/* Destination Marker */}
           <div className="absolute flex flex-col items-center gap-1 z-20" style={{ left: `${destPos.x}%`, top: `${destPos.y}%`, transform: 'translate(-50%, -50%)' }}>
             <div className="bg-gray-900 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs shadow-2xl border-4 border-white animate-bounce">
               <i className="fas fa-house-chimney"></i>
             </div>
             <div className="bg-gray-900/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <span className="text-[7px] font-black uppercase text-gray-900 tracking-widest whitespace-nowrap">My Suite</span>
             </div>
           </div>

           {/* Driver Marker */}
           <div className="absolute z-30 transition-all duration-1000 ease-linear flex flex-col items-center gap-1" style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%`, transform: 'translate(-50%, -50%)' }}>
             <div className="orange-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shadow-[0_10px_30px_rgba(234,88,12,0.4)] border-4 border-white relative">
               <i className="fas fa-motorcycle"></i>
               {/* Pulsing Signal */}
               <div className="absolute -inset-2 bg-orange-500/20 rounded-full animate-ping"></div>
             </div>
             <div className="bg-orange-600 px-2 py-0.5 rounded-full shadow-lg">
                <span className="text-[7px] font-black uppercase text-white tracking-widest whitespace-nowrap">Courier Active</span>
             </div>
           </div>

           {/* Waypoint markers (small dots) */}
           {routeWaypoints.slice(1, -1).map((wp, i) => (
             <div key={i} className="absolute w-2 h-2 bg-white border-2 border-orange-100 rounded-full z-10" style={{ left: `${wp.x}%`, top: `${wp.y}%`, transform: 'translate(-50%, -50%)' }} />
           ))}
        </div>

        <div className="bg-gray-900 p-8 rounded-[3rem] text-white space-y-6 relative overflow-hidden shadow-2xl">
           <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Estimated Arrival</p>
                 <h3 className={`text-5xl font-black tracking-tighter transition-all duration-500 ${confidenceLevel > 90 ? 'text-orange-500' : 'text-white'}`}>
                   {isPredictingETA ? '...' : (aiETA?.minutes || '12')} <span className="text-sm font-medium text-white/50">mins</span>
                 </h3>
              </div>
              <div className="text-right space-y-2">
                 <div className="inline-flex flex-col items-end">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">AI Confidence</p>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-black ${confidenceColor}`}>{confidenceLevel}%</span>
                       <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${confidenceLevel > 80 ? 'bg-green-500' : 'bg-orange-500'}`} 
                            style={{ width: `${confidenceLevel}%` }}
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Telemetry Status</p>
                 <p className="text-[10px] font-bold text-white">Route Optimized</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-right">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Environmental</p>
                 <p className="text-[10px] font-bold text-orange-500">Live Rain Protocol</p>
              </div>
           </div>

           <div className="relative z-10 p-5 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-start">
              <i className="fas fa-sparkles text-orange-500 mt-1"></i>
              <div className="space-y-1">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Model Analysis</p>
                 <p className="text-[10px] font-medium text-gray-300 leading-relaxed italic">
                   "{aiETA?.reasoning || 'Calibrating neural delivery matrices...'}"
                 </p>
              </div>
           </div>
           <i className="fas fa-brain absolute -right-6 -bottom-6 text-white/5 text-[10rem] rotate-12"></i>
        </div>

        <button onClick={() => setActiveTab('orders')} className="w-full py-6 bg-gray-50 text-gray-400 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition">
          Return to Orders
        </button>
      </div>
    );
  };

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery to</p>
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            The Diamond Towers <i className="fas fa-chevron-down text-orange-600 text-[10px]"></i>
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/50 shadow-sm">
            <i className="fas fa-gem text-orange-600"></i>
            <span className="text-xs font-black">{diamondPoints}</span>
          </div>
        </div>
      </header>

      {favoriteRestaurants.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Your Favorites</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {favoriteRestaurants.map(res => (
              <div key={res.id} onClick={() => { setSelectedRestaurant(res); setActiveBannerIdx(0); }} className="flex-shrink-0 w-24 space-y-2 cursor-pointer group">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300 relative">
                   <img src={res.image} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </div>
                <p className="text-[9px] font-black text-center text-gray-800 uppercase truncate">{res.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="orange-gradient rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-orange-100">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Limited Edition</div>
          <h3 className="text-3xl font-black leading-tight">Elite Dining <br/> Reimagined.</h3>
          <p className="text-xs font-medium text-white/70">Access menus from Michelin-star kitchens.</p>
          <button className="bg-white text-orange-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition">Explore Now</button>
        </div>
        <i className="fas fa-crown absolute -right-6 -bottom-6 text-white/10 text-9xl rotate-12"></i>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-gray-800 tracking-tight">Curation Favorites</h3>
        {restaurants.map(res => (
          <div key={res.id} className="relative group">
            <div onClick={() => { setSelectedRestaurant(res); setActiveBannerIdx(0); }} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all relative cursor-pointer">
              <div className="relative h-48">
                <img src={res.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={res.name} />
                <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <i className="fas fa-star text-orange-500 text-xs"></i>
                  <span className="text-xs font-black">{res.rating}</span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-black text-gray-800">{res.name}</h4>
                <div className="flex items-center gap-4 mt-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">
                  <span>{res.tags[0]}</span>
                  <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                  <span>{res.deliveryTime}</span>
                  <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                  <span>${res.deliveryFee} Fee</span>
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(res.id); }}
              className={`absolute bottom-24 right-6 w-12 h-12 glass rounded-2xl flex items-center justify-center transition-all shadow-xl z-10 ${favorites.includes(res.id) ? 'text-orange-600 scale-110' : 'text-gray-300 hover:text-orange-300'}`}
            >
              <i className={`${favorites.includes(res.id) ? 'fas' : 'far'} fa-heart text-xl`}></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-32 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Advanced Search</h2>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by palette and preference</p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants or cuisines..." 
            className="w-full p-6 pl-14 bg-gray-50 rounded-[2rem] border-none focus:ring-2 focus:ring-orange-500 font-bold transition-all shadow-inner" 
          />
        </div>

        <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuisines</h4>
               {(selectedCuisine || selectedPriceTier || selectedTimeTier || searchQuery) && (
                 <button 
                   onClick={() => {
                     setSelectedCuisine(null);
                     setSelectedPriceTier(null);
                     setSelectedTimeTier(null);
                     setSearchQuery('');
                   }}
                   className="text-[9px] font-black text-orange-600 uppercase tracking-widest"
                 >
                   Clear All
                 </button>
               )}
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {allCuisines.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedCuisine(selectedCuisine === tag ? null : tag)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCuisine === tag ? 'orange-gradient text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-3">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price Tier</h4>
               <div className="flex gap-2">
                 {[1, 2, 3].map(tier => (
                   <button 
                     key={tier}
                     onClick={() => setSelectedPriceTier(selectedPriceTier === tier ? null : tier)}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedPriceTier === tier ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}
                   >
                     {'$'.repeat(tier)}
                   </button>
                 ))}
               </div>
             </div>
             <div className="space-y-3">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Speed</h4>
               <div className="flex gap-2">
                 <button 
                    onClick={() => setSelectedTimeTier(selectedTimeTier === 'fast' ? null : 'fast')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedTimeTier === 'fast' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}
                 >
                    <i className="fas fa-bolt mr-1"></i> Fast
                 </button>
                 <button 
                    onClick={() => setSelectedTimeTier(selectedTimeTier === 'std' ? null : 'std')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedTimeTier === 'std' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}
                 >
                    Mid
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-sm font-black text-gray-800 tracking-tight">Results ({filteredRestaurants.length})</h3>
        </div>
        
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
             {filteredRestaurants.map(res => (
                <div 
                  key={res.id} 
                  onClick={() => setSelectedRestaurant(res)}
                  className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-4 hover:shadow-lg transition-all active:scale-95 cursor-pointer group"
                >
                   <img src={res.image} className="w-24 h-24 rounded-[1.5rem] object-cover" />
                   <div className="flex-1 py-1">
                      <h4 className="font-black text-sm text-gray-800">{res.name}</h4>
                      <div className="flex items-center gap-2 text-[8px] font-black text-orange-600 uppercase tracking-widest mt-1">
                         <i className="fas fa-star"></i> {res.rating} • {res.deliveryTime}
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 line-clamp-1">{res.tags.join(' • ')}</p>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-[10px] font-black text-gray-900">${res.deliveryFee} delivery</span>
                         <i className="fas fa-arrow-right text-[10px] text-gray-200 group-hover:text-orange-600 transition-colors"></i>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 opacity-40">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-3xl mx-auto">
               <i className="fas fa-search-minus"></i>
             </div>
             <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">No restaurants matching filters</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MobileShell roleName="Customer" onLogout={onLogout}>
      <div className="relative flex-1 flex flex-col h-full bg-white">
        <div className={`absolute top-4 left-4 right-4 z-[200] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeNotification ? 'translate-y-6 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4">
             <div className="w-12 h-12 orange-gradient rounded-2xl flex items-center justify-center text-white text-lg shadow-lg">
                <i className={`fas fa-${activeNotification?.icon || 'bell'}`}></i>
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 orange-gradient rounded-[4px] flex items-center justify-center text-white text-[6px]">
                         <i className="fas fa-gem"></i>
                      </div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Diamondfoods</span>
                   </div>
                   <span className="text-[9px] font-bold text-white/30">Now</span>
                </div>
                <p className="text-[11px] font-black text-white truncate">{activeNotification?.title}</p>
                <p className="text-[10px] font-medium text-white/60 leading-tight line-clamp-2">{activeNotification?.body}</p>
             </div>
          </div>
        </div>

        {selectedRestaurant ? (
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col bg-gray-50 h-full relative">
             <div className="relative h-72">
               <img src={selectedRestaurant.image} className="w-full h-full object-cover" />
               <button onClick={() => setSelectedRestaurant(null)} className="absolute top-6 left-6 w-11 h-11 glass rounded-2xl flex items-center justify-center text-gray-900 shadow-xl z-10">
                 <i className="fas fa-chevron-left"></i>
               </button>
               <button onClick={() => onToggleFavorite(selectedRestaurant.id)} className={`absolute top-6 right-6 w-11 h-11 glass rounded-2xl flex items-center justify-center shadow-xl z-10 transition-all ${favorites.includes(selectedRestaurant.id) ? 'text-orange-600 scale-110' : 'text-gray-900'}`}>
                 <i className={`${favorites.includes(selectedRestaurant.id) ? 'fas' : 'far'} fa-heart`}></i>
               </button>
               <div className="absolute -bottom-10 left-6 right-6 z-10">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-50">
                     <h2 className="text-2xl font-black text-gray-800">{selectedRestaurant.name}</h2>
                  </div>
               </div>
             </div>
             
             <div className="mt-16 px-6 space-y-8 pb-40">
                {selectedRestaurant.promoBanners?.length ? (
                  <div className="relative rounded-[2.5rem] overflow-hidden h-32 shadow-lg group">
                    <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${activeBannerIdx * 100}%)` }}>
                      {selectedRestaurant.promoBanners.map((banner, i) => <img key={i} src={banner} className="w-full h-full object-cover flex-shrink-0" />)}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-6">
                  {selectedRestaurant.menu.map(item => (
                    <div key={item.id} onClick={() => item.isAvailable && setSelectedItem(item)} className={`relative flex gap-4 bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-50 active:scale-95 transition cursor-pointer group ${!item.isAvailable ? 'opacity-60' : ''}`}>
                      <img src={item.image} className={`w-24 h-24 rounded-[1.5rem] object-cover ${!item.isAvailable ? 'grayscale' : ''}`} />
                      <div className="flex-1 py-1">
                          <h4 className={`font-black text-sm ${!item.isAvailable ? 'text-gray-400' : 'text-gray-800'}`}>{item.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">{item.description}</p>
                          <p className={`font-black mt-2 ${!item.isAvailable ? 'text-gray-300' : 'text-orange-600'}`}>${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {cart.length > 0 && (
               <button onClick={() => setCheckoutStep('cart')} className="absolute bottom-6 left-6 right-6 glass p-5 rounded-[2.5rem] flex justify-between items-center shadow-2xl z-[80] animate-slide-up">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 orange-gradient rounded-2xl flex items-center justify-center font-black text-white">{cart.length}</div>
                     <p className="font-black text-xl text-gray-800">${cartTotal.toFixed(2)}</p>
                  </div>
                  <span className="orange-gradient text-white px-8 py-4 rounded-2xl text-xs font-black uppercase shadow-xl">Checkout</span>
               </button>
             )}
          </div>
        ) : (
          <>
            {activeTab === 'home' && renderHome()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'search' && renderSearch()}
            {activeTab === 'orders' && (trackingOrder ? renderTracking() : (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-10 pb-32 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-[900] text-gray-900 tracking-tight">Order Vault</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Your digital culinary record</p>
                </div>

                {Object.keys(groupedOrders).length === 0 ? (
                  <div className="py-20 text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-3xl mx-auto">
                      <i className="fas fa-box-open"></i>
                    </div>
                    <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Your vault is currently empty.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {(Object.entries(groupedOrders) as [string, Order[]][]).map(([date, dateOrders]) => (
                      <div key={date} className="space-y-6">
                        <h3 className="text-[11px] font-[900] text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-3 flex justify-between items-center">
                          {date}
                          <span className="bg-gray-50 px-2 py-0.5 rounded-lg text-[9px]">{dateOrders.length} Orders</span>
                        </h3>
                        <div className="space-y-4">
                          {dateOrders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 group cursor-pointer">
                              <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{order.id}</p>
                                  <h4 className="text-sm font-[800] text-gray-800 group-hover:text-orange-600 transition-colors">
                                    {getRestaurantName(order.restaurantId)}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
                                  <div className={`w-2 h-2 rounded-full ${statusColors[order.status]} shadow-sm`}></div>
                                  <span className="text-[9px] font-black uppercase text-gray-600 tracking-tighter">
                                    {order.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-medium">{order.items.length} items • ${order.total.toFixed(2)}</p>
                                  {order.status === OrderStatus.CANCELLED && order.cancellationReason && (
                                    <p className="text-[9px] text-red-400 italic font-bold">Reason: {order.cancellationReason}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {order.status === OrderStatus.PENDING && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setCancellingOrderId(order.id); }}
                                      className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <i className="fas fa-times text-xs"></i>
                                    </button>
                                  )}
                                  <button className="w-9 h-9 glass rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                    <i className="fas fa-repeat text-xs"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <nav className="absolute bottom-6 left-6 right-6 h-20 glass border-white/50 rounded-[2.5rem] shadow-2xl flex justify-around items-center px-4 z-[60]">
          {[
            { id: 'home', icon: 'house', label: 'Home' },
            { id: 'search', icon: 'sparkles', label: 'AI' },
            { id: 'orders', icon: 'bag-shopping', label: 'Orders' },
            { id: 'profile', icon: 'user', label: 'Me' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-orange-600 -translate-y-1 scale-110' : 'text-gray-400'}`}>
              <i className={`fas fa-${tab.icon} text-lg`}></i>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute -top-3 w-1 h-1 bg-orange-600 rounded-full"></div>}
            </button>
          ))}
        </nav>
      </div>

      {selectedItem && (
        <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[3.5rem] p-10 animate-slide-up space-y-8 max-h-[90%] overflow-y-auto hide-scrollbar">
             <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-2"></div>
             <img src={selectedItem.image} className="w-full h-56 object-cover rounded-[2.5rem] shadow-xl" />
             <div>
               <h3 className="text-2xl font-black text-gray-800">{selectedItem.name}</h3>
               <p className="text-sm text-gray-400 font-medium mt-1">{selectedItem.description}</p>
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={() => setSelectedItem(null)} className="flex-1 py-4 text-gray-400 font-black">Cancel</button>
                <button onClick={() => { setCart(prev => [...prev, { ...selectedItem, quantity: 1, price: selectedItem.price }]); setSelectedItem(null); }} className="flex-[2] orange-gradient text-white py-4 rounded-2xl font-black shadow-lg">Add to Cart • ${selectedItem.price}</button>
             </div>
          </div>
        </div>
      )}

      {cancellingOrderId && (
        <div className="absolute inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-end">
          <div className="w-full bg-white rounded-t-[3.5rem] p-10 animate-slide-up space-y-8 shadow-2xl">
             <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-4"></div>
             <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Cancel Order?</h3>
                <p className="text-xs text-gray-400 font-medium">Please let us know why you're cancelling</p>
             </div>
             <div className="space-y-3">
                {CANCELLATION_REASONS.map((reason) => (
                   <button 
                      key={reason}
                      onClick={() => handleReasonSelect(reason)}
                      className="w-full p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-orange-200 transition text-sm font-black text-gray-600 text-left flex justify-between items-center group"
                   >
                      {reason}
                      <i className="fas fa-chevron-right text-gray-200 group-hover:text-orange-600 transition"></i>
                   </button>
                ))}
             </div>
             <button onClick={() => setCancellingOrderId(null)} className="w-full py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Keep My Order</button>
          </div>
        </div>
      )}

      {checkoutStep && (
        <div className="absolute inset-0 z-[120] bg-black/40 backdrop-blur-md flex items-end">
          <div className="w-full bg-white rounded-t-[3.5rem] p-10 animate-slide-up flex flex-col shadow-2xl max-h-[90%]">
             <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-8"></div>
             <h2 className="text-2xl font-black text-gray-800 mb-6">Confirm Elite Order</h2>
             <div className="flex-1 overflow-y-auto space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <span className="font-bold text-gray-700">{item.name}</span>
                    <span className="font-black text-gray-900">${item.price.toFixed(2)}</span>
                  </div>
                ))}
             </div>
             <div className="pt-8 flex gap-4">
                <button onClick={() => setCheckoutStep(null)} className="flex-1 py-5 text-gray-400 font-black uppercase text-xs tracking-widest">Back</button>
                <button onClick={handlePlaceOrder} className="flex-[2] orange-gradient text-white py-5 rounded-2xl font-black text-sm shadow-xl transform active:scale-95 transition">Pay ${(cartTotal + (selectedRestaurant?.deliveryFee || 0)).toFixed(2)}</button>
             </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
};

export default CustomerApp;
