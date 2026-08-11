'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { Bell, Check, CheckCheck, Inbox, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
    } catch (err: any) {
      setServerError(err.message || 'Failed to mark all notifications as read.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#17324D] text-white">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-page-title font-semibold text-[#17324D]">
                  Notification Center
                </h1>
                <p className="text-label text-[#5B6673]">
                  FND-09 In-App Operational Events & Alerts
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`rounded px-3 py-1.5 text-xs font-medium border transition-colors ${
                  unreadOnly
                    ? 'border-[#1F4E79] bg-[#1F4E79] text-white'
                    : 'border-[#D7DEE6] bg-white text-[#5B6673] hover:text-[#17202A]'
                }`}
              >
                Unread Only ({unreadCount})
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All Read
              </Button>
            </div>
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded border border-[#D7DEE6] bg-white p-8 text-center text-label text-[#5B6673]">
              Loading inbox notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded border border-[#D7DEE6] bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA] text-[#5B6673]">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-section-title font-semibold text-[#17324D]">
                No Notifications Found
              </h3>
              <p className="mt-1 text-label text-[#5B6673]">
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
                  className={`rounded border p-4 shadow-sm transition-colors ${
                    isUnread
                      ? 'border-[#1F4E79] bg-white border-l-4'
                      : 'border-[#D7DEE6] bg-[#F7F8FA]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="rounded border border-[#D7DEE6] bg-[#F7F8FA] px-2 py-0.5 text-xs font-semibold text-[#1F4E79]">
                          {item.eventType}
                        </span>
                        {isUnread && (
                          <span className="rounded bg-[#1F4E79] px-2 py-0.5 text-xs font-medium text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-body font-medium text-[#17202A]">{item.message}</p>
                      <div className="flex items-center space-x-1 text-xs text-[#5B6673]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="rounded border border-[#D7DEE6] bg-white px-2.5 py-1 text-xs font-medium text-[#1F4E79] hover:bg-[#F7F8FA] flex items-center"
                        title="Mark as read"
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Mark Read
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
  );
}
