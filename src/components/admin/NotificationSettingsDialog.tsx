"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellRing,
  BellOff,
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationSettingsDialogProps {
  openControlled?: boolean;
  onOpenControlledChange?: (open: boolean) => void;
  hideTriggerButton?: boolean;
}

export function NotificationSettingsDialog({
  openControlled,
  onOpenControlledChange,
  hideTriggerButton = false,
}: NotificationSettingsDialogProps = {}) {
  const { data: session } = useSession();

  const isControlled = openControlled !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? openControlled : internalOpen;
  const setIsOpen = isControlled
    ? onOpenControlledChange || (() => {})
    : setInternalOpen;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  function playNotificationSound() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio playback not allowed:", e);
    }
  }

  useEffect(() => {
    let active = true;
    const checkExistingSubscription = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && active) {
            const sub = await reg.pushManager.getSubscription();
            if (active) setIsSubscribed(!!sub);
            // Re-sync existing browser subscription with the currently logged-in user/role
            if (sub && session?.user) {
              fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscription: sub,
                  userAgent: navigator.userAgent,
                }),
              }).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error("Error checking subscription:", e);
      }
    };

    if (typeof window !== "undefined" && "Notification" in window) {
      void checkExistingSubscription();
    }

    return () => {
      active = false;
    };
  }, [session?.user]);

  const handleSubscribePush = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    setIsRegistering(true);
    try {
      // 1. Request browser permission
      const result = await Notification.requestPermission();

      if (result !== "granted") {
        toast.error(
          "Notification permission denied. Please allow notifications in your browser settings."
        );
        return;
      }

      // 2. Register Service Worker (/push-sw.js in dev to avoid cache conflicts, /sw.js in prod)
      let reg: ServiceWorkerRegistration;
      if (process.env.NODE_ENV !== "production") {
        reg = await navigator.serviceWorker.register("/push-sw.js", {
          scope: "/",
        });
      } else {
        try {
          reg = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
        } catch {
          reg = await navigator.serviceWorker.register("/push-sw.js", {
            scope: "/",
          });
        }
      }
      await navigator.serviceWorker.ready;

      // 3. Convert VAPID Public Key and Subscribe
      const vapidKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BKc8CDjOGVJXcupFb2GIDVaMJ7QstKD-Wb7YlTKt53GcE803xq5f57zboWjBymnLx5TsY9dgE4eETMrcDUpdJiY";

      const convertedKey = urlBase64ToUint8Array(vapidKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // 4. Save to Backend Database
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error("Failed to save push subscription.");

      setIsSubscribed(true);
      playNotificationSound();
      toast.success(
        "Push notifications enabled! You will now receive real-time alerts on this device."
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to enable push notifications.";
      console.error("Subscription error:", err);
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnsubscribePush = async () => {
    setIsUnsubscribing(true);
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
      }
      setIsSubscribed(false);
      toast.success("Push notifications disabled on this device.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to disable push notifications.";
      toast.error(msg);
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    playNotificationSound();
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Test push notification sent successfully!");
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification("🔔 টেস্ট পুশ নোটিফিকেশন", {
              body: "অভিনন্দন! আপনার ডিভাইসে রিয়েল-টাইম নোটিফিকেশন সফলভাবে কাজ করছে।",
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              requireInteraction: true,
            });
          } catch (swErr) {
            console.error("ServiceWorker showNotification error:", swErr);
          }
        }
      } else {
        toast.error(data.error || "Failed to send test push notification.");
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Push notification test failed.";
      toast.error(msg);
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <>
      {!hideTriggerButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="relative rounded-full h-9 w-9 bg-background/80 hover:bg-accent border shadow-sm"
          title="Instant Order Notification Settings"
        >
          {isSubscribed ? (
            <BellRing className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
          {isSubscribed && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Desktop & Mobile Alert Settings
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Receive instant audio alerts and push notifications on mobile
                  and desktop whenever new orders or store events arrive.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Browser / Mobile Web Push */}
            <div className="p-4 rounded-xl border bg-card/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Mobile & Desktop Push Notifications
                  </span>
                </div>
                {isSubscribed ? (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <AlertCircle className="h-3 w-3" /> Inactive
                  </Badge>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Real-time notifications will pop up on your laptop or mobile
                phone even when the browser tab is minimized or running in the
                background.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                {!isSubscribed ? (
                  <Button
                    onClick={handleSubscribePush}
                    disabled={isRegistering}
                    className="w-full text-xs font-semibold h-9"
                    size="sm"
                  >
                    <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                    {isRegistering
                      ? "Enabling..."
                      : "Enable Alerts on this Device"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTestPush}
                      disabled={isTestingPush}
                      className="flex-1 text-xs h-8"
                      size="sm"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {isTestingPush ? "Sending..." : "Send Test Alert"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleUnsubscribePush}
                      disabled={isUnsubscribing}
                      className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      size="sm"
                      title="Disable alerts on this device"
                    >
                      <BellOff className="h-3.5 w-3.5 mr-1" />
                      {isUnsubscribing ? "..." : "Disable"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
