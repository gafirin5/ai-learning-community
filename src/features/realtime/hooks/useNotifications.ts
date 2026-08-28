/**
 * Realtime Notifications - Use Notifications Hook
 * 
 * Owner: Lane I (API & Persistence)
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToUserNotifications } from '../lib/realtime-provider';

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  created_at: Date;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Add notification to state
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    toast.innerHTML = `
      <div class="font-semibold">${notification.title}</div>
      <div class="text-sm opacity-90 mt-1">${notification.body}</div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Subscribe on mount
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    console.log('Subscribing to notifications for userId:', userId);
    window.currentUserId = userId; // Set global for realtime provider
    
    const subscription = subscribeToUserNotifications(userId);

    // Listen for custom events
    const handleNotificationReceived = (event: CustomEvent<Notification>) => {
      addNotification(event.detail);
    };

    window.addEventListener('notification-received', handleNotificationReceived as any);
    
    setIsConnected(true);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(
        'notification-received',
        handleNotificationReceived as any
      );
    };
  }, [userId, addNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
  };
}
