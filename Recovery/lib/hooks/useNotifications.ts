"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface NotificationPreferences {
  morningEnabled: boolean;
  eveningEnabled: boolean;
  morningTime: string;
  eveningTime: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    morningEnabled: true,
    eveningEnabled: true,
    morningTime: "08:00",
    eveningTime: "20:00",
  });

  const supabase = createClient();

  // Check current state on mount
  useEffect(() => {
    async function checkStatus() {
      // Check browser permission
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }

      // Check if we have a subscription in the DB
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setIsSubscribed(true);
        setPreferences({
          morningEnabled: data.morning_enabled,
          eveningEnabled: data.evening_enabled,
          morningTime: data.morning_time?.slice(0, 5) || "08:00",
          eveningTime: data.evening_time?.slice(0, 5) || "20:00",
        });
      }

      setIsLoading(false);
    }

    checkStatus();
  }, [supabase]);

  const subscribe = useCallback(async () => {
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const vapidKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.buffer as ArrayBuffer,
      });

      // Save to our API (which saves to Supabase)
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences,
        }),
      });

      if (!response.ok) throw new Error("Failed to save subscription");

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Failed to subscribe:", err);
      return false;
    }
  }, [preferences]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from API
      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
      });

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      return false;
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPrefs: Partial<NotificationPreferences>) => {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);

      if (!isSubscribed) return;

      await fetch("/api/notifications/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updated }),
      });
    },
    [preferences, isSubscribed]
  );

  return {
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}
