'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Bell, Check, CheckCheck, Inbox, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { PublicShell } from '@/components/layout/public-shell';

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

export default function Fnd09NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await apiRequest(`/notifications?unreadOnly=${unreadOnly}`);
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

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

  return (
    <PublicShell>
      <div className="min-h-[calc(100vh-128px)] bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Notification Center</h1>
                  <p className="text-xs text-[#64748B]">In-App Operational Events &amp; System Alerts</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    unreadOnly
                      ? 'bg-[#151c2e] text-white shadow-sm'
                      : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Unread Only ({unreadCount})
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="border-[#E2E8F0] text-[#0F172A]"
                >
                  <CheckCheck className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Mark All Read
                </Button>
              </div>
            </div>
          </div>

          {serverError && <Alert variant="error">{serverError}</Alert>}

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center text-xs text-[#64748B]">
                Loading inbox notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#d49b38] border border-[#E2E8F0]">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">No Notifications Found</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  {unreadOnly
                    ? 'You have no unread notifications.'
                    : 'Notifications will appear here as operational events occur.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.readAt;
                const formattedDate = new Date(item.createdAt).toLocaleString();
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 shadow-sm transition-colors ${
                      isUnread ? 'border-[#d49b38] bg-white border-l-4' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="rounded-full bg-[#151c2e] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                            {item.eventType}
                          </span>
                          {isUnread && (
                            <span className="rounded-full bg-[#d49b38] px-2 py-0.5 text-[10px] font-bold text-[#151c2e]">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#0F172A]">{item.message}</p>
                        <div className="flex items-center space-x-1 text-xs text-[#64748B]">
                          <Clock className="h-3.5 w-3.5 text-[#d49b38]" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(item.id)}
                          className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#d49b38] flex items-center transition-colors"
                          title="Mark as read"
                        >
                          <Check className="mr-1 h-3.5 w-3.5 text-[#d49b38]" /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
