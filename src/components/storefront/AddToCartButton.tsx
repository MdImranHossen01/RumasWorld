'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  product: any;
  className?: string;
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const { addItem, isInCart } = useCart();
  const productId = product._id || product.id;
  const alreadyAdded = isInCart(productId);

  const handleAddToCart = () => {
    if (alreadyAdded) {
      toast.info('Already in cart! You can adjust quantity from the cart.');
      return;
    }
    addItem({
      productId,
      name: product.name,
      price: product.salePrice ?? product.price,
      quantity: 1,
      image: product.images?.[0],
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Button 
      onClick={handleAddToCart} 
      className={className}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {alreadyAdded ? 'Already in Cart' : 'Add to Cart'}
    </Button>
  );
}

