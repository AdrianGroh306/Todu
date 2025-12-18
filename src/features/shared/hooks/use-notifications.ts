import { useCallback, useEffect, useMemo, useState } from "react";

const getIsSupported = () => typeof window !== "undefined" && "Notification" in window;

const toNotificationPermission = (value: PermissionState | NotificationPermission): NotificationPermission => {
  if (value === "prompt") {
    return "default";
  }
  return value as NotificationPermission;
};

export const useNotifications = () => {
  const [isSupported] = useState(getIsSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!getIsSupported()) {
      return "default";
    }
    return Notification.permission;
  });

  useEffect(() => {
    if (!isSupported || !("permissions" in navigator)) {
      return;
    }

    let mounted = true;
    let status: PermissionStatus | null = null;

    const handleChange = () => {
      if (!mounted || !status) return;
      setPermission(toNotificationPermission(status.state));
    };

    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((permissionStatus) => {
        if (!mounted) return;
        status = permissionStatus;
        setPermission(toNotificationPermission(status.state));
        status.addEventListener("change", handleChange);
      })
      .catch(() => {
        // Some browsers (notably iOS Safari) don't support permissions API for notifications.
        // We'll fall back to using Notification.permission only.
      });

    return () => {
      mounted = false;
      if (status) {
        status.removeEventListener("change", handleChange);
      }
    };
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermission("denied");
      return "denied";
    }
    if (permission === "granted") {
      return "granted";
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Notification permission request failed", error);
      setPermission("denied");
      return "denied";
    }
  }, [isSupported, permission]);

  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        return false;
      }

      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
        return true;
      } catch (error) {
        console.error("Failed to show notification via service worker", error);
        try {
          new Notification(title, options);
          return true;
        } catch (notificationError) {
          console.error("Notification API failed", notificationError);
          return false;
        }
      }
    },
    [isSupported, permission],
  );

  const canNotify = useMemo(() => isSupported && permission === "granted", [isSupported, permission]);

  return {
    isSupported,
    permission,
    canNotify,
    requestPermission,
    sendNotification,
  };
};
