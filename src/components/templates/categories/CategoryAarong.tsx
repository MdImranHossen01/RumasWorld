'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
}

export default function CategoryAarong({ categories }: CategoryShowcaseProps) {
  // Filter categories to main ones (no parent, or fallback to first few if none matches)
  const displayCategories = categories && categories.length > 0 ? categories : [];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.2em] text-foreground font-playfair">
            Shop by Category
          </h2>
          <div className="h-[2px] w-12 bg-primary mx-auto mt-3" />
        </div>

        {/* Aarong style Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayCategories.map((category) => (
            <Link
              key={category._id}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group block overflow-hidden border border-border/40 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                    No Image
                  </div>
                )}
              </div>

              {/* Title Strip underneath */}
              <div className="bg-background py-4 px-3 text-center border-t border-border/30">
                <h3 className="font-black text-xs sm:text-sm text-foreground uppercase tracking-[0.15em] transition-colors group-hover:text-primary">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        
      </div>
    </section>
  );
}
