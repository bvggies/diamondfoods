
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  addons?: Addon[];
  isAvailable: boolean;
  salesCount?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  image: string;
  tags: string[];
  menu: MenuItem[];
  isOpen: boolean;
  promoText?: string;
  promoBanners?: string[];
  deliveryFee: number;
  minOrder: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedAddons?: Addon[];
}

export enum PaymentMethod {
  CARD = 'CARD',
  WALLET = 'WALLET',
  APPLE_PAY = 'APPLE_PAY',
  CASH = 'CASH'
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  driverId?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress: string;
  driverRating?: number;
  deliveryInstructions?: string;
  paymentMethod?: PaymentMethod;
  loyaltyPointsEarned?: number;
  cancellationReason?: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  favorites: string[];
  diamondPoints: number;
}
