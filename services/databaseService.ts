
import { Order, Restaurant, OrderStatus, UserRole } from '../types';

// In a real production environment, these would be calls to:
// fetch('https://api.diamondfoods.com/v1/...') or firebase.firestore()

export const databaseService = {
  async getRestaurants(): Promise<Restaurant[]> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = localStorage.getItem('df_restaurants');
    return data ? JSON.parse(data) : [];
  },

  async saveRestaurants(restaurants: Restaurant[]) {
    localStorage.setItem('df_restaurants', JSON.stringify(restaurants));
  },

  async getOrders(): Promise<Order[]> {
    const data = localStorage.getItem('df_orders');
    return data ? JSON.parse(data) : [];
  },

  async placeOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    orders.push(order);
    localStorage.setItem('df_orders', JSON.stringify(orders));
    // Trigger real-time notification to Restaurant
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, cancellationReason?: string): Promise<void> {
    const orders = await this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status, cancellationReason } : o);
    localStorage.setItem('df_orders', JSON.stringify(updated));
  },

  async assignDriverToOrder(orderId: string, driverId: string): Promise<void> {
    const orders = await this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, driverId, status: OrderStatus.ACCEPTED } : o);
    localStorage.setItem('df_orders', JSON.stringify(updated));
  },

  async getFavorites(): Promise<string[]> {
    const data = localStorage.getItem('df_favorites');
    return data ? JSON.parse(data) : [];
  },

  async toggleFavorite(restaurantId: string): Promise<string[]> {
    const favorites = await this.getFavorites();
    const index = favorites.indexOf(restaurantId);
    let updated: string[];
    if (index > -1) {
      updated = favorites.filter(id => id !== restaurantId);
    } else {
      updated = [...favorites, restaurantId];
    }
    localStorage.setItem('df_favorites', JSON.stringify(updated));
    return updated;
  }
};
