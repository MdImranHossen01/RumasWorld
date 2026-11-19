import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  basePrice?: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  isHydrated: boolean;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  isHydrated: false,
};

export function isMatchingCartItem(
  item: { productId?: string; color?: string; size?: string },
  target: { productId?: string; color?: string; size?: string }
): boolean {
  const itemProdId = String(item.productId || '');
  const targetProdId = String(target.productId || '');
  if (!itemProdId || !targetProdId || itemProdId !== targetProdId) {
    return false;
  }

  const itemColor = (item.color || '').trim().toLowerCase();
  const targetColor = (target.color || '').trim().toLowerCase();
  const itemSize = (item.size || '').trim().toLowerCase();
  const targetSize = (target.size || '').trim().toLowerCase();

  return itemColor === targetColor && itemSize === targetSize;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => isMatchingCartItem(item, newItem));

      // Single-add rule: only add if this product/variant is not already in cart.
      // Quantity adjustments must go through `updateQuantity`.
      if (!existingItem) {
        const qty = newItem.quantity > 0 ? newItem.quantity : 1;
        state.totalQuantity += qty;
        state.totalAmount = Math.round((state.totalAmount + newItem.price * qty) * 100) / 100;
        state.items.push({ ...newItem, quantity: qty });
      }
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; color?: string; size?: string; delta: number }>
    ) {
      const { delta } = action.payload;
      const existingItem = state.items.find((item) => isMatchingCartItem(item, action.payload));

      if (existingItem) {
        const newQty = existingItem.quantity + delta;
        if (newQty <= 0) {
          state.totalQuantity -= existingItem.quantity;
          state.totalAmount = Math.round((state.totalAmount - existingItem.price * existingItem.quantity) * 100) / 100;
          state.items = state.items.filter((item) => item !== existingItem);
        } else {
          state.totalQuantity += delta;
          state.totalAmount = Math.round((state.totalAmount + existingItem.price * delta) * 100) / 100;
          existingItem.quantity = newQty;
        }
      }
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; color?: string; size?: string } | string>) {
      const payload = action.payload;
      const payloadWasString = typeof payload === 'string';

      const target = payloadWasString
        ? { productId: payload }
        : payload;

      const matchingItems = state.items.filter((item) => {
        if (payloadWasString) {
          return String(item.productId) === String(target.productId);
        }
        return isMatchingCartItem(item, target);
      });

      if (matchingItems.length > 0) {
        const removedQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        const removedAmount = matchingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        state.totalQuantity -= removedQuantity;
        state.totalAmount = Math.round((state.totalAmount - removedAmount) * 100) / 100;
        state.items = state.items.filter((item) => {
          if (payloadWasString) {
            return String(item.productId) !== String(target.productId);
          }
          return !isMatchingCartItem(item, target);
        });
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
    hydrateCart(state, action: PayloadAction<CartState>) {
      const items = (action.payload.items || []).map(item => ({
        ...item,
        basePrice: item.basePrice ?? item.price
      }));
      return {
        ...action.payload,
        items,
        isHydrated: true
      };
    },
    syncItems(state, action: PayloadAction<{ productId: string; color?: string; size?: string }[]>) {
      const validKeys = action.payload.map(i => `${i.productId}-${(i.color || '').trim().toLowerCase()}-${(i.size || '').trim().toLowerCase()}`);

      const filteredItems = state.items.filter(item => {
        const key = `${item.productId}-${(item.color || '').trim().toLowerCase()}-${(item.size || '').trim().toLowerCase()}`;
        return validKeys.includes(key);
      });

      if (filteredItems.length !== state.items.length) {
        state.items = filteredItems;
        state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalAmount = Math.round(state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
      }
    },
    setHydrated(state) {
      state.isHydrated = true;
    }
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, hydrateCart, syncItems, setHydrated } = cartSlice.actions;
export default cartSlice.reducer;
