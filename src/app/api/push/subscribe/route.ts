import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { message: 'Invalid push subscription object' },
        { status: 400 }
      );
    }

    const session = await auth();
    let userId: string | undefined = undefined;
    let role = 'guest';

    if (session?.user) {
      userId = (session.user as { id?: string }).id;
      role = (session.user as { role?: string }).role || 'user';
    }

    // Upsert subscription based on unique endpoint
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userId: userId || undefined,
        role,
        userAgent: userAgent || req.headers.get('user-agent') || '',
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { message: 'Failed to register subscription', error: errMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { message: 'Endpoint is required' },
        { status: 400 }
      );
    }

    await PushSubscription.deleteOne({ endpoint });
    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { message: 'Failed to unsubscribe', error: errMsg },
      { status: 500 }
    );
  }
}
