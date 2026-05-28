"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NotificationCenterItem } from "@/features/dashboard/types";

type MarkMode = {
  persist?: boolean;
};

type NotificationCenterContextValue = {
  notifications: NotificationCenterItem[];
  unreadCount: number;
  selectedNotification: NotificationCenterItem | null;
  openNotification: (notification: NotificationCenterItem) => Promise<void>;
  closeNotification: () => void;
  prependNotification: (notification: NotificationCenterItem) => void;
  markNotificationRead: (notificationId: string, options?: MarkMode) => Promise<void>;
  markAllNotificationsRead: (options?: MarkMode) => Promise<void>;
};

const NotificationCenterContext = createContext<NotificationCenterContextValue | null>(null);

async function persistReadState(ids: string[]) {
  if (!ids.length) {
    return;
  }

  const response = await fetch("/api/account/notifications/read", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Unable to persist notification read state.");
  }
}

export function NotificationCenterProvider({
  children,
  initialNotifications,
}: {
  children: ReactNode;
  initialNotifications: NotificationCenterItem[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<NotificationCenterItem | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markNotificationRead = useCallback(
    async (notificationId: string, options?: MarkMode) => {
      const target = notifications.find((notification) => notification.id === notificationId);

      if (!target || target.read) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      );

      if (options?.persist === false) {
        return;
      }

      try {
        await persistReadState([notificationId]);
      } catch (error) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId ? { ...notification, read: false } : notification,
          ),
        );
        throw error;
      }
    },
    [notifications],
  );

  const markAllNotificationsRead = useCallback(
    async (options?: MarkMode) => {
      const unreadIds = notifications
        .filter((notification) => !notification.read)
        .map((notification) => notification.id);

      if (!unreadIds.length) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );

      if (options?.persist === false) {
        return;
      }

      try {
        await persistReadState(unreadIds);
      } catch (error) {
        setNotifications((current) =>
          current.map((notification) =>
            unreadIds.includes(notification.id) ? { ...notification, read: false } : notification,
          ),
        );
        throw error;
      }
    },
    [notifications],
  );

  const openNotification = useCallback(
    async (notification: NotificationCenterItem) => {
      setSelectedNotification(notification);

      if (!notification.read) {
        await markNotificationRead(notification.id);
      }
    },
    [markNotificationRead],
  );

  const closeNotification = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  const prependNotification = useCallback((notification: NotificationCenterItem) => {
    setNotifications((current) => [
      notification,
      ...current.filter((item) => item.id !== notification.id),
    ]);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      selectedNotification,
      openNotification,
      closeNotification,
      prependNotification,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      notifications,
      unreadCount,
      selectedNotification,
      openNotification,
      closeNotification,
      prependNotification,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);

  if (!context) {
    throw new Error("useNotificationCenter must be used within NotificationCenterProvider.");
  }

  return context;
}
