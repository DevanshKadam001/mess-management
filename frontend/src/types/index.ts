export type Role = 'STUDENT' | 'FACULTY' | 'VENDOR' | 'ADMIN';

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  department?: string | null;
  roomNumber?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  vendorId?: string;
  vendorProfile?: Vendor;
  ordersCount?: number;
  unreadNotificationsCount?: number;
}

export interface Vendor {
  id: string;
  userId: string;
  stallName: string;
  description?: string | null;
  location?: string | null;
  isOpen: boolean;
  phone?: string | null;
  bannerImage?: string | null;
  productsCount?: number;
  ordersCount?: number;
  totalRevenue?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  displayOrder: number;
  productsCount?: number;
}

export interface Ingredient {
  id: string;
  vendorId: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  lastRestocked?: string | null;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  productsCount?: number;
  products?: { productId: string; productName: string; quantityRequired: number }[];
}

export interface ProductIngredient {
  id?: string;
  productId?: string;
  ingredientId: string;
  quantityRequired: number;
  ingredient?: Ingredient;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number;
  calories?: number | null;
  badge?: string | null;
  category?: Category;
  vendor?: {
    id: string;
    stallName: string;
    location?: string | null;
    isOpen: boolean;
  };
  ingredients?: ProductIngredient[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isAvailable: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    isVeg: boolean;
    isAvailable: boolean;
    vendorId: string;
    vendorName: string;
    vendorIsOpen: boolean;
  };
}

export interface CartSummary {
  id: string;
  userId: string;
  items: CartItem[];
  itemsCount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: string;
  finalAmount: number;
  hasUnavailableItems: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  vendorId: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'UPI';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  pickupOtp: string;
  notes?: string | null;
  estimatedPrepMinutes: number;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  vendor: {
    id: string;
    stallName: string;
    location?: string | null;
    phone?: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    department?: string | null;
    roomNumber?: string | null;
  };
  payment?: {
    method: 'CASH' | 'UPI';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    transactionId?: string | null;
    amount: number;
    paidAt?: string | null;
  };
}

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  orderId?: string | null;
  type: 'RESTOCK' | 'ORDER_CONSUMPTION' | 'MANUAL_ADJUSTMENT' | 'WASTAGE';
  quantity: number;
  previousStock: number;
  newStock: number;
  note?: string | null;
  createdAt: string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  } | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_STATUS' | 'LOW_STOCK' | 'PAYMENT' | 'SYSTEM';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
