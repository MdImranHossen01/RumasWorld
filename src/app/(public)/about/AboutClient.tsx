'use client';

import Link from 'next/link';
import {
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Building2,
  Users,
  Layers,
  ShoppingBag,
  Scissors,
  Eye,
  Target,
  Crown,
  Star,
  Shirt,
  Baby,
  Smile,
  ShieldCheck,
  Truck,
  Sparkle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutClient({ settings }: { settings: any }) {
  const { t } = useLanguage();
  const brandName = settings?.brandName || process.env.NEXT_PUBLIC_STORE_NAME || 'Store';

  const fashionCategories = [
    {
      name: t('about.cat.women.name') as string || "Women's Collection",
      desc: t('about.cat.women.desc') as string || 'Graceful Sarees (Jamdani, Silk, Cotton), designer Salwar Kameez, Kurtis, Western Co-ords, and festive party wear.',
      badge: 'Bestseller',
      icon: Crown,
    },
    {
      name: t('about.cat.men.name') as string || "Men's Collection",
      desc: t('about.cat.men.desc') as string || 'Premium festive & casual Panjabis, formal & casual shirts, comfortable polos, trousers, and ethnic Kabli sets.',
      badge: 'Signature',
      icon: Shirt,
    },
    {
      name: t('about.cat.kids.name') as string || "Kids & Teens",
      desc: t('about.cat.kids.desc') as string || 'Adorable mini-Panjabis, cute frocks, festive outfits, and soft cotton everyday wear for boys, girls & newborns.',
      badge: 'Pure Comfort',
      icon: Baby,
    },
    {
      name: t('about.cat.accessories.name') as string || "Accessories & Lifestyle",
      desc: t('about.cat.accessories.desc') as string || 'Handcrafted jewelry, designer bags, dupattas, shawls, and aesthetic home lifestyle accents.',
      badge: 'Artisanal',
      icon: Sparkles,
    },
  ];

  const fabricHighlights = [
    { name: 'Pure Handloom Cotton', desc: 'Breathable, ultra-comfortable, and spun by skilled local weavers for all-day elegance.', tag: '100% Breathable' },
    { name: 'Heritage Silk & Jamdani', desc: 'Royal weaves and intricate artisanal motifs designed for weddings, Eid, and grand celebrations.', tag: 'Luxury Weaves' },
    { name: 'Fine Georgette & Organza', desc: 'Flowy, lightweight fabrics with delicate embroidery and modern silhouettes.', tag: 'Festive Wear' },
    { name: 'Linen & Soft Viscose', desc: 'Premium blend offering effortless drape, minimal wrinkles, and timeless everyday charm.', tag: 'Modern Fusion' },
  ];

  const corePillars = [
    {
      icon: Scissors,
      title: t('about.values.craft.title') as string || 'Artisanal Craftsmanship',
      desc: t('about.values.craft.desc') as string || 'Every piece reflects hand-embroidery, detailed block prints, and meticulous tailoring inspired by Bangladeshi cultural heritage.',
    },
    {
      icon: ShieldCheck,
      title: t('about.values.quality.title') as string || 'Guaranteed Fabric Quality',
      desc: t('about.values.quality.desc') as string || 'We handpick the purest threads and dyes, ensuring shrink-resistant, color-fast, and skin-friendly textiles.',
    },
    {
      icon: HeartHandshake,
      title: t('about.values.ethical.title') as string || 'Inclusive & Trendsetting',
      desc: t('about.values.ethical.desc') as string || 'Designed for all body types, ages, and occasions — bringing affordable luxury to the modern Bangladeshi family.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-transparent py-20 md:py-32 border-b border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> {t('about.hero.badge') as string || "Bangladesh's Premier Lifestyle & Fashion House"}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-6">
            {t('about.hero.title_start') as string || 'The Story of'} <span className="text-primary">{brandName}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            {t('about.hero.desc_start') as string || 'Celebrating rich heritage, timeless weaves, and modern elegance — '}{' '}
            <strong className="text-primary">{brandName}</strong> {t('about.hero.desc_end') as string || 'is your one-stop destination for authentic Men’s, Women’s, and Kids’ fashion.'}
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-card/30 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '50K+', label: t('about.stats.happy_customers') as string || 'Happy Customers' },
              { value: '1,500+', label: t('about.stats.designs') as string || 'Curated Designs' },
              { value: '64', label: t('about.stats.districts') as string || 'Districts Delivery' },
              { value: '100%', label: t('about.stats.authentic') as string || 'Authentic Fabrics' },
            ].map((s) => (
              <div key={s.label} className="p-4 space-y-1">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story & Mission ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {t('about.story.title1') as string || 'Rooted in Tradition.'} <br />
                <span className="text-primary">{t('about.story.title2') as string || 'Designed for Tomorrow.'}</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                <strong>{brandName}</strong> {t('about.story.p1') as string || 'was founded with a passionate vision: to make authentic, artisan-inspired Bangladeshi fashion accessible, stylish, and comfortable for every family. From traditional handloom weaves to contemporary silhouettes, we embrace the beauty of self-expression.'}
              </p>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('about.story.p2') as string || 'Whether you are seeking a regal Saree for weddings, a classic Panjabi for festive celebrations, smart everyday casuals, or delightful outfits for your little ones, our collections are meticulously tailored with attention to every thread, motif, and button.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{t('about.mission.title') as string || 'Our Mission'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('about.mission.desc') as string || 'To empower individuals and families with high-quality, ethically made fashion that blends cultural pride with modern trends.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{t('about.vision.title') as string || 'Our Vision'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('about.vision.desc') as string || 'To be Bangladesh’s most cherished lifestyle brand, synonymous with authenticity, elegance, and customer delight.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote panel */}
            <div className="relative aspect-square md:aspect-video lg:aspect-square max-w-md mx-auto w-full rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary-foreground/30 p-1 shadow-2xl">
              <div className="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden relative flex flex-col justify-end p-8 text-white">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_10%,transparent_10.1%)] bg-[length:20px_20px]" />
                <div className="relative z-20 space-y-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md self-start inline-block">
                    {t('about.promise.badge') as string || 'Our Brand Philosophy'}
                  </span>
                  <blockquote className="text-lg md:text-xl font-bold leading-relaxed italic">
                    &quot;{t('about.promise.quote') as string || 'Fashion is not just what you wear — it is a celebration of who you are and where you come from.'}&quot;
                  </blockquote>
                  <p className="text-xs text-slate-300 font-medium">— {t('about.promise.team') as string || 'The'} {brandName} {t('about.promise.team2') as string || 'Family'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="py-16 md:py-24 bg-primary/5 border-t border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">{t('about.values.title') as string || `Why You'll Love ${brandName}`}</h2>
            <p className="text-muted-foreground text-sm">
              {t('about.values.desc') as string || `We promise uncompromising quality, honest pricing, and timeless designs in every garment.`}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {corePillars.map((v) => (
              <div
                key={v.title}
                className="bg-background p-8 rounded-2xl border shadow-sm space-y-4 text-center flex flex-col items-center hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{v.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <ShoppingBag className="h-3.5 w-3.5" /> {t('about.collections.badge') as string || 'Our World'}
            </span>
            <h2 className="text-3xl font-bold tracking-tight">{t('about.collections.title') as string || 'Fashion for Everyone'}</h2>
            <p className="text-muted-foreground text-sm">
              {t('about.collections.desc') as string || 'Explore our thoughtfully curated collections designed to accompany every chapter of your life.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fashionCategories.map((c) => (
              <div
                key={c.name}
                className="relative rounded-2xl border bg-card p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {c.badge}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fabric & Weaving Excellence ── */}
      <section className="py-16 md:py-20 bg-muted/30 border-t border-b">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Layers className="h-3.5 w-3.5" /> {t('about.fabrics.badge') as string || 'Material Mastery'}
            </span>
            <h2 className="text-3xl font-bold tracking-tight">{t('about.fabrics.title') as string || 'Pure Fabrics, Lasting Comfort'}</h2>
            <p className="text-muted-foreground text-sm">
              {t('about.fabrics.desc') as string || 'We select only the finest natural and blended fibers for maximum breathability and all-day comfort.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fabricHighlights.map((f) => (
              <div
                key={f.name}
                className="bg-background rounded-2xl border p-6 space-y-3 hover:shadow-md hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{f.tag}</span>
                <h3 className="font-bold text-base text-foreground leading-tight">{f.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nationwide Delivery & Support ── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="rounded-2xl border bg-card p-8 space-y-4 text-center flex flex-col items-center hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{t('about.shipping.title') as string || 'Fast Nationwide Delivery'}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('about.shipping.desc') as string || 'We deliver across all 64 districts in Bangladesh with reliable cash-on-delivery and easy return policies.'}
              </p>
              <Link href="/track-order" passHref>
                <Button variant="outline" size="sm" className="rounded-full mt-2">
                  {t('about.shipping.btn') as string || 'Track Your Order'}
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl border bg-card p-8 space-y-4 text-center flex flex-col items-center hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{t('about.support.title') as string || 'Customer Care & Styling'}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('about.support.desc') as string || 'Need help choosing the right size or outfit? Our customer styling team is available to assist you online and on call.'}
              </p>
              <Link href="/contact" passHref>
                <Button variant="outline" size="sm" className="rounded-full mt-2">
                  {t('about.support.btn') as string || 'Contact Stylist'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 text-center relative overflow-hidden bg-primary/5 border-t border-primary/10">
        <div className="container mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            {t('about.cta.title_start') as string || 'Elevate Your Wardrobe with'} <span className="text-primary">{brandName}</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            {t('about.cta.desc') as string || 'Discover the newest arrivals in Men’s, Women’s, and Kids’ fashion today.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/shop" passHref>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('about.cta.browse') as string || 'Explore Collection'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact" passHref>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 font-bold text-sm transition-all hover:bg-muted/50"
              >
                {t('about.cta.contact') as string || 'Contact Us'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
