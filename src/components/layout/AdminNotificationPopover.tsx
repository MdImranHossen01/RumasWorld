'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ShoppingBag,
  ShoppingCart,
  Package,
  AlertTriangle,
  RotateCcw,
  Star,
  CheckCheck,
  Settings,
  Info,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationSettingsDialog } from '@/components/admin/NotificationSettingsDialog';
import { toast } from 'sonner';

interface QueueStats {
  pendingOrders: number;
  abandonedCarts: number;
  lowStock: number;
  outOfStock: number;
  pendingReviews: number;
  totalQueueActions: number;
}

interface AdminNotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const DEFAULT_QUEUES: QueueStats = {
  pendingOrders: 0,
  abandonedCarts: 0,
  lowStock: 0,
  outOfStock: 0,
  pendingReviews: 0,
  totalQueueActions: 0,
};

export default function AdminNotificationPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [queues, setQueues] = useState<QueueStats>(DEFAULT_QUEUES);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setQueues(data.queues || DEFAULT_QUEUES);
        setNotifications(data.notifications || []);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        setNowTs(Date.now());
      }
    } catch {
      // silent background fetch
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/notifications?limit=10');
        if (res.ok && active) {
          const data = await res.json();
          setQueues(data.queues || DEFAULT_QUEUES);
          setNotifications(data.notifications || []);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
          setNowTs(Date.now());
        }
      } catch {
        // silent background fetch
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void fetchData();
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notif: AdminNotificationItem) => {
    if (!notif.read) {
      try {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        await fetch('/api/admin/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif._id }),
        });
      } catch {
        // silent
      }
    }

    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-primary" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-destructive" />;
      case 'product':
        return <Package className="h-4 w-4 text-primary" />;
      case 'review':
        return <Star className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Math.max(0, nowTs - date.getTime());
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const bellBadgeCount = unreadCount > 0 ? unreadCount : 0;

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          nativeButton={true}
          render={
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full h-9 w-9 bg-background/80 hover:bg-accent border shadow-sm"
              title="Action Center & Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {bellBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm animate-pulse">
                  {bellBadgeCount > 99 ? '99+' : bellBadgeCount}
                </span>
              )}
            </Button>
          }
        />

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[340px] sm:w-[420px] p-0 shadow-2xl rounded-2xl overflow-hidden border border-border"
        >
          {/* Header */}
          <div className="p-3.5 bg-card border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Action Center</h3>
              {queues.totalQueueActions > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full text-[10px] px-2 py-0 bg-destructive/10 text-destructive font-semibold border border-destructive/20"
                >
                  {queues.totalQueueActions} Pending
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>

          {/* Live Queue Shortcuts */}
          <div className="p-3 bg-muted/30 border-b">
            <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Queues Requiring Action
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin/orders"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-primary/[0.06] border border-border/60 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" /> Pending Orders
                </span>
                <Badge
                  variant={queues.pendingOrders > 0 ? 'default' : 'secondary'}
                  className="text-[10px] h-5 px-1.5 shrink-0"
                >
                  {queues.pendingOrders}
                </Badge>
              </Link>

              <Link
                href="/admin/abandoned-carts"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-primary/[0.06] border border-border/60 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <ShoppingCart className="h-3.5 w-3.5 text-primary shrink-0" /> Abandoned Carts
                </span>
                <Badge
                  variant={queues.abandonedCarts > 0 ? 'default' : 'secondary'}
                  className="text-[10px] h-5 px-1.5 shrink-0"
                >
                  {queues.abandonedCarts}
                </Badge>
              </Link>

              <Link
                href="/admin/low-stock"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-primary/[0.06] border border-border/60 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0" /> Low Stock
                </span>
                <Badge
                  variant={queues.lowStock > 0 ? 'default' : 'secondary'}
                  className="text-[10px] h-5 px-1.5 shrink-0"
                >
                  {queues.lowStock}
                </Badge>
              </Link>

              <Link
                href="/admin/low-stock"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-primary/[0.06] border border-border/60 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <Package className="h-3.5 w-3.5 text-destructive shrink-0" /> Out of Stock
                </span>
                <Badge
                  variant={queues.outOfStock > 0 ? 'destructive' : 'secondary'}
                  className="text-[10px] h-5 px-1.5 shrink-0"
                >
                  {queues.outOfStock}
                </Badge>
              </Link>
            </div>
          </div>

          {/* Recent Alerts List */}
          <div className="max-h-[260px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent notifications logged.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer ${
                    !notif.read
                      ? 'bg-primary/[0.04] hover:bg-primary/[0.08]'
                      : 'bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !notif.read
                            ? 'font-bold text-foreground'
                            : 'font-medium text-foreground/80'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-muted/40 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setIsSettingsOpen(true);
              }}
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5 text-primary" />
              Alert Settings
            </Button>

            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline pr-1"
            >
              <span>View All Alerts & Logs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Settings Dialog when triggered from Popover Footer */}
      <NotificationSettingsDialog
        openControlled={isSettingsOpen}
        onOpenControlledChange={setIsSettingsOpen}
        hideTriggerButton={true}
      />
    </>
  );
}
