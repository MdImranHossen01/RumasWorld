import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import GlobalSettings from '@/models/GlobalSettings';
import { SteadfastProvider } from '@/lib/shipping/providers/steadfast';
import { PathaoProvider } from '@/lib/shipping/providers/pathao';
import { RedXProvider } from '@/lib/shipping/providers/redx';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';

async function releaseBookingLock(id: string) {
  await Order.updateOne(
    { _id: id, 'shippingDetails.courierStatus': 'BOOKING_IN_PROGRESS' },
    { $unset: { 'shippingDetails.courierStatus': '' } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || !role || !['admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    await connectToDatabase();

    const exists = await Order.findById(id);
    if (!exists) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Atomically claim the order to prevent concurrent booking requests
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        $and: [
          {
            $or: [
              { 'shippingDetails.trackingId': { $exists: false } },
              { 'shippingDetails.trackingId': null },
              { 'shippingDetails.trackingId': '' },
            ],
          },
          {
            $or: [
              { 'shippingDetails.consignmentId': { $exists: false } },
              { 'shippingDetails.consignmentId': null },
              { 'shippingDetails.consignmentId': '' },
            ],
          },
          {
            $or: [
              { 'shippingDetails.courierStatus': { $exists: false } },
              { 'shippingDetails.courierStatus': null },
              { 'shippingDetails.courierStatus': { $ne: 'BOOKING_IN_PROGRESS' } },
            ],
          },
        ],
      },
      {
        $set: {
          'shippingDetails.courierStatus': 'BOOKING_IN_PROGRESS',
        },
      },
      { new: true }
    ).populate('user');

    if (!order) {
      return NextResponse.json(
        { message: 'Courier already booked or booking in progress for this order' },
        { status: 409 }
      );
    }

    const settings = await GlobalSettings.findOne();
    if (!settings || !settings.courierConfig) {
      await releaseBookingLock(id);
      return NextResponse.json(
        { message: 'Courier service not configured in Settings.' },
        { status: 400 }
      );
    }

    const { activeProvider, steadfast, pathao, redx } = settings.courierConfig;
    const requestedProvider =
      body.provider ||
      body.courier ||
      (activeProvider && activeProvider !== 'none'
        ? activeProvider
        : steadfast?.apiKey
          ? 'steadfast'
          : pathao?.clientId
            ? 'pathao'
            : redx?.apiKey
              ? 'redx'
              : 'none');

    const addr = order.shippingAddress || ({} as Record<string, string>);
    if (!addr.phone || addr.phone.trim() === '') {
      await releaseBookingLock(id);
      return NextResponse.json(
        { message: 'Recipient phone number is required for courier booking' },
        { status: 400 }
      );
    }

    const addressParts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
    if (addressParts.length === 0) {
      await releaseBookingLock(id);
      return NextResponse.json(
        { message: 'At least one address part (street, city, or zip) is required' },
        { status: 400 }
      );
    }

    const itemsSummary = (order.items || [])
      .map((i: { name: string; quantity: number }) => `${i.name} (${i.quantity}x)`)
      .join(', ');

    const shippingData = {
      invoice: order.shortId || order._id.toString().slice(-8).toUpperCase(),
      recipient_name: addr.fullName || 'Customer',
      recipient_phone: addr.phone.replace(/\D/g, '').slice(-11),
      recipient_address: addressParts.join(', '),
      cod_amount: order.paymentStatus === 'Paid' ? 0 : order.totalAmount || 0,
      note: (
        body.note ||
        `Order #${order.shortId || order._id.toString().slice(-8).toUpperCase()} - ${order.paymentMethod || 'N/A'}`
      ).slice(0, 160),
      store_id: body.store_id || pathao?.storeId,
      city_id: body.city_id || 1,
      zone_id: body.zone_id || 1,
      area_id: body.area_id,
      item_weight: body.weight || 0.5,
      item_quantity:
        (order.items || []).reduce(
          (acc: number, i: { quantity?: number }) => acc + (i.quantity || 1),
          0
        ) || 1,
      item_description: itemsSummary.slice(0, 100) || 'Parcel',
    };

    let provider = null;
    let courierName = '';

    if (requestedProvider === 'steadfast') {
      if (!steadfast?.apiKey || !steadfast?.secretKey) {
        await releaseBookingLock(id);
        return NextResponse.json(
          { message: 'Steadfast API credentials are missing in Marketing & Courier Settings.' },
          { status: 400 }
        );
      }
      provider = new SteadfastProvider(steadfast.apiKey, steadfast.secretKey);
      courierName = 'Steadfast';
    } else if (requestedProvider === 'pathao') {
      if (!pathao?.clientId || !pathao?.clientSecret) {
        await releaseBookingLock(id);
        return NextResponse.json(
          { message: 'Pathao API credentials are missing in Marketing & Courier Settings.' },
          { status: 400 }
        );
      }
      provider = new PathaoProvider({
        clientId: pathao.clientId,
        clientSecret: pathao.clientSecret,
        storeId: body.store_id || pathao.storeId,
        username: pathao.username,
        password: pathao.password,
        isSandbox: pathao.isSandbox,
      });
      courierName = 'Pathao';
    } else if (requestedProvider === 'redx') {
      if (!redx?.apiKey) {
        await releaseBookingLock(id);
        return NextResponse.json(
          { message: 'RedX API Key is missing in Marketing & Courier Settings.' },
          { status: 400 }
        );
      }
      provider = new RedXProvider({
        apiKey: redx.apiKey,
        isSandbox: redx.isSandbox,
      });
      courierName = 'RedX';
    } else {
      await releaseBookingLock(id);
      return NextResponse.json(
        { message: 'No valid courier provider selected or configured.' },
        { status: 400 }
      );
    }

    const result = await provider.createOrder(shippingData);

    if (result.success) {
      order.shippingDetails = {
        courierName,
        trackingId: result.tracking_code,
        consignmentId: result.consignment_id,
        trackingUrl: result.tracking_url,
        courierStatus: result.status,
      };
      order.status = 'Ready for Delivery';
      await order.save();

      return NextResponse.json({
        message: `${courierName} booked successfully`,
        trackingCode: result.tracking_code,
        consignmentId: result.consignment_id,
      });
    } else {
      await releaseBookingLock(id);
      return NextResponse.json(
        {
          message: result.message || 'Courier booking failed',
          details: result,
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Courier Booking Exception:', error);
    try {
      await releaseBookingLock(id);
    } catch (e) {
      console.error('Failed to release booking claim:', e);
    }
    return NextResponse.json(
      {
        message: 'Internal server error during courier booking',
        debug: errMsg,
      },
      { status: 500 }
    );
  }
}
