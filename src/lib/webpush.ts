import webpush from 'web-push';
import connectToDatabase from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import mongoose from 'mongoose';

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BKc8CDjOGVJXcupFb2GIDVaMJ7QstKD-Wb7YlTKt53GcE803xq5f57zboWjBymnLx5TsY9dgE4eETMrcDUpdJiY';

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY ||
  'GCP1PwN937Ec6JoHh1UwMZpIsAqmnkEV_-Styo4pxWQ';

const vapidSubject =
  process.env.VAPID_SUBJECT || 'mailto:imranshuvo101@gmail.com';

// Configure web-push with VAPID details
try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.error('[WebPush] Configuration error:', err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface PushTargetScope {
  onlyAdmin?: boolean;
  targetUserId?: string;
}

export async function sendWebPushNotification(
  payload: PushNotificationPayload,
  scope?: PushTargetScope
) {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Ruma's World";

  try {
    await connectToDatabase();

    let query: Record<string, unknown> = {};

    if (scope?.targetUserId) {
      if (!mongoose.Types.ObjectId.isValid(scope.targetUserId)) {
        return { total: 0, sent: 0, failed: 0 };
      }
      query = { userId: new mongoose.Types.ObjectId(scope.targetUserId) };
    } else {
      // Default & onlyAdmin: strictly verified Admin/Manager devices
      query = {
        role: { $in: ['admin', 'super_admin', 'manager'] },
      };
    }

    const subscriptions = await PushSubscription.find(query).lean();

    if (!subscriptions || subscriptions.length === 0) {
      return { total: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const expiredIds: mongoose.Types.ObjectId[] = [];

    const payloadString = JSON.stringify({
      title: payload.title || `নতুন অর্ডার এসেছে! (${storeName})`,
      body: payload.body || 'একটি নতুন অর্ডার প্লেস করা হয়েছে।',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      url: payload.url || '/admin/orders',
      tag: payload.tag || 'rumasworld-notification',
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payloadString
          );
          sent++;
        } catch (error: unknown) {
          failed++;
          const statusCode = (error as { statusCode?: number })?.statusCode;
          // 404 or 410 means the subscription has expired or user revoked permission
          if (statusCode === 404 || statusCode === 410) {
            expiredIds.push(sub._id as mongoose.Types.ObjectId);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: expiredIds } });
    }

    return { total: subscriptions.length, sent, failed };
  } catch (err) {
    console.error('[WebPush] Error sending push notification:', err);
    return { total: 0, sent: 0, failed: 0, error: err };
  }
}
