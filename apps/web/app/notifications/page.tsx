'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import {
  Bell,
  Check,
  CheckCheck,
  Inbox,
  Clock,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItem {
  id: string;
  recipientUserId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  PROJECT_ASSIGNED: 'bg-emerald-100 text-emerald-800',
  PROJECT_RELEASED: 'bg-red-100 text-red-800',
  LEAVE_APPROVED: 'bg-green-100 text-green-800',
  LEAVE_REJECTED: 'bg-red-100 text-red-800',
  LEAVE_REQUESTED: 'bg-blue-100 text-blue-800',
  TASK_ASSIGNED: 'bg-purple-100 text-purple-800',
  TASK_COMPLETED: 'bg-teal-100 text-teal-800',
  DEFAULT: 'bg-[#151c2e] text-white',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setServerError(null);
      try {
        const res = await apiRequest(`/notifications?unreadOnly=${unreadOnly}`);
        if (res && res.data) {
          setNotifications(res.data);
        } else if (Array.isArray(res)) {
          setNotifications(res);
        }
      } catch (err: any) {
        setServerError(err.message || 'Failed to load notifications.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (err: any) {
      setServerError(err.message || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch (err: any) {
      setServerError(err.message || 'Failed to mark all notifications as read.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const getEventBadgeClass = (eventType: string) =>
    EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.DEFAULT;

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Notification Center</h1>
              <p className="text-xs text-[#64748B]">In-App Operational Events &amp; System Alerts</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                unreadOnly
                  ? 'bg-[#151c2e] text-white shadow-sm'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:border-[#d49b38]'
              }`}
            >
              Unread Only ({unreadCount})
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadNotifications(true)}
              disabled={refreshing}
              className="border-[#E2E8F0] text-[#64748B] hover:text-[#d49b38]"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="border-[#E2E8F0] text-[#0F172A] hover:border-[#d49b38]"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#E2E8F0] pt-4">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="h-2 w-2 rounded-full bg-[#d49b38] animate-pulse" />
            <span className="font-semibold text-[#0F172A]">{unreadCount}</span> unread
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Check className="h-3.5 w-3.5 text-[#10B981]" />
            <span className="font-semibold text-[#0F172A]">{notifications.length - unreadCount}</span> read
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Bell className="h-3.5 w-3.5 text-[#64748B]" />
            <span className="font-semibold text-[#0F172A]">{notifications.length}</span> total
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">Failed to load notifications</p>
            <p className="text-xs text-red-600 mt-0.5">{serverError}</p>
          </div>
          <button
            onClick={() => loadNotifications()}
            className="text-xs font-semibold text-red-700 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Notifications List ── */}
      <div className="space-y-2.5">
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#E2E8F0] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-[#E2E8F0]" />
                    <div className="h-3 w-full rounded bg-[#E2E8F0]" />
                    <div className="h-2.5 w-20 rounded bg-[#E2E8F0]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#d49b38] border border-[#E2E8F0]">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">
              {unreadOnly ? 'No Unread Notifications' : 'Inbox is Empty'}
            </h3>
            <p className="mt-1.5 text-xs text-[#64748B] max-w-xs mx-auto">
              {unreadOnly
                ? 'You have no unread notifications. Toggle the filter to see all.'
                : 'Notifications appear here when project assignments, task updates, leave requests, or other operational events occur.'}
            </p>
            {unreadOnly && (
              <button
                onClick={() => setUnreadOnly(false)}
                className="mt-4 text-xs font-semibold text-[#d49b38] hover:underline"
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 shadow-sm transition-all ${
                  isUnread
                    ? 'border-l-4 border-l-[#d49b38] border-[#E2E8F0] bg-white'
                    : 'border-[#E2E8F0] bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Icon indicator */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        isUnread
                          ? 'bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e]'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getEventBadgeClass(item.eventType)}`}
                        >
                          {item.eventType.replace(/_/g, ' ')}
                        </span>
                        {isUnread && (
                          <span className="rounded-full bg-[#d49b38] px-2 py-0.5 text-[10px] font-bold text-[#151c2e]">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed ${isUnread ? 'font-semibold text-[#0F172A]' : 'text-[#334155]'}`}>
                        {item.message}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
                        <Clock className="h-3 w-3 text-[#d49b38] shrink-0" />
                        <span title={new Date(item.createdAt).toLocaleString()}>
                          {formatRelativeTime(item.createdAt)}
                        </span>
                        {!isUnread && item.readAt && (
                          <>
                            <span>·</span>
                            <Check className="h-3 w-3 text-[#10B981]" />
                            <span className="text-[#10B981]">Read {formatRelativeTime(item.readAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mark Read button — only for unread */}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#d49b38] hover:border-[#d49b38] flex items-center gap-1 transition-all"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Info Banner ── */}
      {!loading && notifications.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Showing the latest {notifications.length} notifications. Older notifications are automatically archived after 90 days.</span>
        </div>
      )}
    </div>
  );
}
