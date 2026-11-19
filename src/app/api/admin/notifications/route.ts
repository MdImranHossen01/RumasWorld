import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import Order from '@/models/Order';
import Product from '@/models/Product';
import AbandonedCart from '@/models/AbandonedCart';
import Review from '@/models/Review';

async function verifyAdminAuth() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !role || !['admin', 'super_admin', 'manager'].includes(role)) {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminAuth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const type = searchParams.get('type');

    // 1. Live single-tenant queue counts relevant to Ruma's World
    const [
      pendingOrdersCount,
      abandonedCartsCount,
      lowStockCount,
      outOfStockCount,
      pendingReviewsCount,
    ] = await Promise.all([
      Order.countDocuments({
        status: 'Order Placed',
        deletedAt: null,
      }),
      AbandonedCart.countDocuments({}),
      Product.countDocuments({ stock: { $gt: 0, $lt: 5 } }),
      Product.countDocuments({ stock: { $lte: 0 } }),
      Review.countDocuments({ status: 'pending' }),
    ]);

    const totalQueueActions =
      pendingOrdersCount +
      abandonedCartsCount +
      lowStockCount +
      outOfStockCount;

    // 2. Fetch logged admin notifications
    const filter: Record<string, unknown> = { forAdmin: true };
    if (type && type !== 'all') {
      filter.type = type;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ forAdmin: true, read: false }),
    ]);

    return NextResponse.json({
      queues: {
        pendingOrders: pendingOrdersCount,
        abandonedCarts: abandonedCartsCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingReviews: pendingReviewsCount,
        totalQueueActions,
      },
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin notifications', error: errMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyAdminAuth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { forAdmin: true, read: false },
        { $set: { read: true } }
      );
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (id) {
      await Notification.updateOne(
        { _id: id, forAdmin: true },
        { $set: { read: true } }
      );
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }

    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating admin notification:', error);
    return NextResponse.json(
      { message: 'Failed to update notification', error: errMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminAuth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearRead = searchParams.get('clearRead') === 'true';

    if (clearRead) {
      await Notification.deleteMany({ forAdmin: true, read: true });
      return NextResponse.json({
        success: true,
        message: 'Read notifications cleared',
      });
    }

    if (!id) {
      return NextResponse.json(
        { message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await Notification.deleteOne({ _id: id, forAdmin: true });
    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting admin notification:', error);
    return NextResponse.json(
      { message: 'Failed to delete notification', error: errMsg },
      { status: 500 }
    );
  }
}
