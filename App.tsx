
import React, { useState, useEffect } from 'react';
import { UserRole, Restaurant, Order, OrderStatus } from './types';
import LandingPage from './views/LandingPage';
import CustomerApp from './views/CustomerApp';
import RestaurantApp from './views/RestaurantApp';
import DeliveryApp from './views/DeliveryApp';
import AdminDashboard from './views/AdminDashboard';
import { databaseService } from './services/databaseService';

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Diamond Grill House',
    rating: 4.8,
    deliveryTime: '20-30 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    tags: ['Steak', 'Premium', 'American'],
    isOpen: true,
    deliveryFee: 1.5,
    minOrder: 15,
    promoText: 'Buy 1 Get 1',
    promoBanners: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&q=80'
    ],
    menu: [
      { id: 'm1', name: 'Signature Diamond Steak', description: 'Wagyu beef with truffle butter', price: 45, image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80', category: 'Main', isAvailable: true, salesCount: 124 },
      { id: 'm2', name: 'Gilded Wings', description: 'Honey glazed gold-dusted wings', price: 18, image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80', category: 'Starters', isAvailable: true, salesCount: 342 }
    ]
  },
  {
    id: 'r2',
    name: 'Zen Sushi Hub',
    rating: 4.6,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    tags: ['Japanese', 'Sushi', 'Healthy'],
    isOpen: true,
    deliveryFee: 0.99,
    minOrder: 10,
    menu: [
      { id: 'm3', name: 'Rainbow Roll', description: 'Fresh salmon, tuna and avocado', price: 22, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80', category: 'Sushi', isAvailable: true, salesCount: 567 },
      { id: 'm4', name: 'Miso Soul Soup', description: 'Traditional miso with organic tofu', price: 8, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', category: 'Sides', isAvailable: true, salesCount: 890 }
    ]
  }
];

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial Load from "Database"
  useEffect(() => {
    const init = async () => {
      setIsSyncing(true);
      const res = await databaseService.getRestaurants();
      if (res.length === 0) {
        await databaseService.saveRestaurants(MOCK_RESTAURANTS);
        setRestaurants(MOCK_RESTAURANTS);
      } else {
        setRestaurants(res);
      }
      const ords = await databaseService.getOrders();
      setOrders(ords);

      const favs = await databaseService.getFavorites();
      setFavorites(favs);

      setIsSyncing(false);
    };
    init();

    const interval = setInterval(async () => {
      const ords = await databaseService.getOrders();
      setOrders(ords);
      const res = await databaseService.getRestaurants();
      setRestaurants(res);
      const favs = await databaseService.getFavorites();
      setFavorites(favs);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePlaceOrder = async (order: Order) => {
    setIsSyncing(true);
    await databaseService.placeOrder(order);
    const ords = await databaseService.getOrders();
    setOrders(ords);
    setIsSyncing(false);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    setIsSyncing(true);
    await databaseService.updateOrderStatus(orderId, status, reason);
    const ords = await databaseService.getOrders();
    setOrders(ords);
    setIsSyncing(false);
  };

  const handleAssignDriver = async (orderId: string) => {
    setIsSyncing(true);
    await databaseService.assignDriverToOrder(orderId, 'driver-1');
    const ords = await databaseService.getOrders();
    setOrders(ords);
    setIsSyncing(false);
  };

  const handleToggleMenuItem = async (restaurantId: string, itemId: string) => {
    setIsSyncing(true);
    const updatedRestaurants = restaurants.map(r => {
      if (r.id === restaurantId) {
        return {
          ...r,
          menu: r.menu.map(m => m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m)
        };
      }
      return r;
    });
    setRestaurants(updatedRestaurants);
    await databaseService.saveRestaurants(updatedRestaurants);
    setIsSyncing(false);
  };

  const handleUpdateBanners = async (restaurantId: string, banners: string[]) => {
    setIsSyncing(true);
    const updatedRestaurants = restaurants.map(r => 
      r.id === restaurantId ? { ...r, promoBanners: banners } : r
    );
    setRestaurants(updatedRestaurants);
    await databaseService.saveRestaurants(updatedRestaurants);
    setIsSyncing(false);
  };

  const handleToggleFavorite = async (restaurantId: string) => {
    const updated = await databaseService.toggleFavorite(restaurantId);
    setFavorites(updated);
  };

  const renderView = () => {
    switch (currentRole) {
      case UserRole.CUSTOMER:
        return (
          <CustomerApp 
            restaurants={restaurants} 
            orders={orders} 
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onPlaceOrder={handlePlaceOrder} 
            onCancelOrder={(id, reason) => handleUpdateStatus(id, OrderStatus.CANCELLED, reason)}
            onRateOrder={() => {}} 
            onLogout={() => setCurrentRole(null)} 
          />
        );
      case UserRole.RESTAURANT:
        const myRes = restaurants[0]; // Logic assumes first restaurant for demo
        return (
          <RestaurantApp 
            restaurant={myRes} 
            orders={orders.filter(o => o.restaurantId === myRes.id)} 
            onUpdateStatus={handleUpdateStatus} 
            onToggleMenuItem={(itemId) => handleToggleMenuItem(myRes.id, itemId)}
            onUpdateBanners={(banners) => handleUpdateBanners(myRes.id, banners)}
            onLogout={() => setCurrentRole(null)} 
          />
        );
      case UserRole.DRIVER:
        return <DeliveryApp orders={orders} onAcceptOrder={handleAssignDriver} onUpdateStatus={handleUpdateStatus} onLogout={() => setCurrentRole(null)} />;
      case UserRole.ADMIN:
        return <AdminDashboard restaurants={restaurants} orders={orders} onLogout={() => setCurrentRole(null)} />;
      default:
        return <LandingPage onSelectRole={setCurrentRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-orange-100 selection:text-orange-900">
      {renderView()}
      
      {currentRole && (
        <div className="fixed bottom-10 left-10 z-[100] flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'} shadow-lg`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-gray-100">
            {isSyncing ? 'Syncing with Server...' : 'Diamond Live Link'}
          </span>
        </div>
      )}

      {currentRole && (
        <div className="fixed bottom-10 right-10 z-[100]">
          <button 
            onClick={() => setCurrentRole(null)}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition active:scale-95 border border-white/10"
          >
            <i className="fas fa-power-off mr-2"></i> Exit Portal
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
