import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !['admin', 'super_admin', 'manager'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'top'; // 'top' or 'low'
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

    await connectToDatabase();

    if (view === 'top') {
      const topProducts = await Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            $or: [
              { deletedAt: null },
              { paymentStatus: 'Paid' },
              { status: 'Delivered' }
            ]
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            itemName: { $first: '$items.name' },
            soldQty: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { soldQty: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            itemName: { $ifNull: ['$productDoc.name', '$itemName'] },
            sku: { $ifNull: ['$productDoc.sku', { $concat: ['SKU-', { $substr: [{ $toString: '$_id' }, 18, 6] }] }] },
            stock: '$productDoc.stock',
            soldQty: 1,
            totalRevenue: 1
          }
        }
      ]);

      return NextResponse.json({ view: 'top', items: topProducts });
    } else {
      const soldProductIdsResult = await Order.aggregate([
        {
          $match: {
            status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
            $or: [
              { deletedAt: null },
              { paymentStatus: 'Paid' },
              { status: 'Delivered' }
            ]
          }
        },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } }
      ]);

      const soldMap = new Map();
      soldProductIdsResult.forEach((i: any) => soldMap.set(i._id?.toString(), i.count));

      const allPublishedProducts = await Product.find({ isPublished: true })
        .select('name sku stock price variants')
        .lean();

      const lowSalesItems = allPublishedProducts.map((p: any) => {
        const soldQty = soldMap.get(p._id.toString()) || 0;
        const variantStock = Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
          : (p.stock || 0);
        return {
          _id: p._id,
          itemName: p.name,
          sku: p.sku || `SKU-${p._id.toString().slice(-6)}`,
          stock: variantStock,
          soldQty
        };
      })
        .sort((a: any, b: any) => a.soldQty - b.soldQty)
        .slice(0, limit);

      return NextResponse.json({ view: 'low', items: lowSalesItems });
    }
  } catch (error) {
    console.error('Product Sales API Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
