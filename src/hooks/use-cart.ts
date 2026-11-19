import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, updateQuantity, removeFromCart, clearCart, isMatchingCartItem } from '@/store/slices/cartSlice';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const itemsCount = useAppSelector((state) => state.cart.totalQuantity);
  const totalAmount = useAppSelector((state) => state.cart.totalAmount);

  const isInCart = (productId: string, color?: string, size?: string) => {
    return items.some((item) => isMatchingCartItem(item, { productId, color, size }));
  };

  const addItem = (item: any) => {
    dispatch(addToCart(item));
  };

  const updateItemQuantity = (productId: string, delta: number, color?: string, size?: string) => {
    dispatch(updateQuantity({ productId, color, size, delta }));
  };

  const removeItem = (productId: string, color?: string, size?: string) => {
    dispatch(removeFromCart({ productId, color, size }));
  };

  const clear = () => {
    dispatch(clearCart());
  };

  return {
    items,
    itemsCount,
    totalAmount,
    isInCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clear,
  };
};

