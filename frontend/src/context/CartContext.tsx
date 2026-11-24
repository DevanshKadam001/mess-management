import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartSummary | null;
  itemsCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!user || (user.role !== 'STUDENT' && user.role !== 'FACULTY')) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'STUDENT' || user.role === 'FACULTY')) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const res = await api.addToCart(productId, quantity);
      if (res.success) {
        setCart(res.data);
        setIsOpen(true); // Open cart preview drawer on add
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await api.updateCartItem(itemId, quantity);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update item quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await api.removeCartItem(itemId);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.clearCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemsCount: cart?.itemsCount || 0,
        isOpen,
        setIsOpen,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
