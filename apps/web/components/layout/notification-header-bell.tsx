'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { Bell, Check, CheckCheck, Clock, Inbox, ArrowRight } from 'lucide-react';

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

export const NotificationHeaderBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/notifications?unreadOnly=false');
      if (res && res.data) {
        setNotifications(res.data);
      } else if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch {
      // Non-blocking catch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1-minute light refresh
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch {
      // Non-blocking
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      // Non-blocking
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors cursor-pointer"
        title="Notification Center"
        aria-label="Notification Center"
      >
        <Bell className="h-5 w-5 text-[#475569]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d49b38] text-[9px] font-bold text-[#151c2e] shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E8F0] bg-white shadow-xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#0F172A]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#d49b38]/15 text-[#d49b38] border border-[#d49b38]/30 px-2 py-0.5 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-[#d49b38] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-[#94a3b8]">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="h-8 w-8 text-[#cbd5e1] mx-auto" />
                <p className="font-semibold text-[#0F172A]">You&apos;re all caught up!</p>
                <p className="text-[11px] text-[#64748B]">No notifications at this time.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => {
                const isUnread = !item.readAt;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors flex items-start space-x-3 ${
                      isUnread ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        isUnread ? 'bg-[#d49b38]' : 'bg-transparent'
                      }`}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase text-[#64748B] tracking-wider">
                          {item.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-snug ${isUnread ? 'font-semibold text-[#0F172A]' : 'text-[#475569]'}`}>
                        {item.message}
                      </p>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="p-1 text-[#94a3b8] hover:text-[#d49b38] shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0F172A] hover:text-[#d49b38] transition-colors"
            >
              <span>View All Notifications</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#d49b38]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
