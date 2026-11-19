import connectToDatabase from '@/lib/db';
import Notification, { NotificationType } from '@/models/Notification';
import { sendWebPushNotification, PushTargetScope } from '@/lib/webpush';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId?: string | mongoose.Types.ObjectId;
  forAdmin?: boolean;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  sendPush?: boolean;
}

/**
 * Creates and logs a notification for an admin or user.
 * Also triggers browser/mobile web push if sendPush is true (default: true).
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectToDatabase();
    const doc: Record<string, unknown> = {
      title: params.title,
      message: params.message,
      type: params.type || 'system',
      link: params.link,
      read: false,
      forAdmin: Boolean(params.forAdmin),
    };

    if (params.userId) {
      doc.userId = new mongoose.Types.ObjectId(params.userId.toString());
    }

    const notification = await Notification.create(doc);

    // Optionally trigger Web Push
    if (params.sendPush !== false) {
      const scope: PushTargetScope = {};
      if (params.forAdmin) {
        scope.onlyAdmin = true;
      } else if (params.userId) {
        scope.targetUserId = params.userId.toString();
      }

      await sendWebPushNotification(
        {
          title: params.title,
          body: params.message,
          url: params.link,
          tag: `rumasworld-${params.type || 'system'}`,
        },
        scope
      ).catch((err) => console.error('[Notification Push Trigger Error]', err));
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Helper to dispatch an admin-targeted notification
 */
export async function createAdminNotification(
  params: Omit<CreateNotificationParams, 'forAdmin'>
) {
  return createNotification({
    ...params,
    forAdmin: true,
  });
}
