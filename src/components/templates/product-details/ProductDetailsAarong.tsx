/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProductDetailsAarongClient from './ProductDetailsAarongClient';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';

const sanitizeForScript = (json: any) => {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
};

export default async function ProductDetailsAarong({ product }: { product: any }) {
  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/shop">
          <Button variant="link" className="mt-4">
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const productSchema = await generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', item: '/' },
    { name: 'Shop', item: '/shop' },
    { name: product.name || 'Product', item: `/product/${product.slug || 'unknown-product'}` }
  ]);

  return (
    <div className="w-full px-4 lg:px-8 mx-auto py-4 md:py-6">
      {productSchema && (
        <script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeForScript(breadcrumbSchema) }}
        />
      )}

      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground/80 px-1 lg:px-2">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </div>

      <div className="p-0">
        <ProductDetailsAarongClient product={product} />
      </div>
    </div>
  );
}
