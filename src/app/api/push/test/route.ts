import { NextResponse } from 'next/server';
import { sendWebPushNotification } from '@/lib/webpush';
import { auth } from '@/auth';

export async function POST() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    const userId = (session?.user as { id?: string })?.id;

    if (!session || !role || !['admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Ruma's World";

    const result = await sendWebPushNotification(
      {
        title: `🔔 টেস্ট নোটিফিকেশন (${storeName})`,
        body: 'অভিনন্দন! আপনার ডিভাইসে রিয়েল-টাইম পুশ নোটিফিকেশন সফলভাবে চালু হয়েছে।',
        url: '/admin/orders',
        tag: 'rumasworld-test-push',
      },
      userId ? { targetUserId: userId } : { onlyAdmin: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Test push notification sent',
      result,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
