"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function SettingsPage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [recoveryStartDate, setRecoveryStartDate] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);

  const {
    permission,
    isSubscribed,
    isLoading: notifLoading,
    preferences: notifPrefs,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = useNotifications();

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setRecoveryStartDate(data.recovery_start_date || "");
      setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("users").update({
      display_name: displayName || null,
      recovery_start_date: recoveryStartDate || null,
      timezone,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // Calculate days sober
  let daysSober: number | null = null;
  if (recoveryStartDate) {
    const start = new Date(recoveryStartDate + "T00:00:00");
    const now = new Date();
    daysSober = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recovery start date
              </label>
              <input
                type="date"
                value={recoveryStartDate}
                onChange={(e) => setRecoveryStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
              />
              {daysSober !== null && daysSober >= 0 && (
                <p className="text-sm text-emerald-600 mt-2 font-medium">
                  {daysSober} days in recovery
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
              >
                {Intl.supportedValuesOf("timeZone").map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Push Notifications
          </h2>

          {!("Notification" in globalThis) ? (
            <p className="text-sm text-gray-500">
              Push notifications are not supported in this browser.
            </p>
          ) : permission === "denied" ? (
            <p className="text-sm text-red-500">
              Notifications are blocked. Please enable them in your browser
              settings to receive reminders.
            </p>
          ) : !isSubscribed ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Get morning and evening reminders for your recovery check-ins.
              </p>
              <button
                onClick={subscribe}
                disabled={notifLoading}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {notifLoading ? "Loading..." : "Enable notifications"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Morning check-in reminder
                  </p>
                  <p className="text-xs text-gray-500">
                    Start your day with gratitude
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={notifPrefs.morningTime}
                    onChange={(e) =>
                      updatePreferences({ morningTime: e.target.value })
                    }
                    disabled={!notifPrefs.morningEnabled}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 disabled:opacity-40"
                  />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.morningEnabled}
                      onChange={(e) =>
                        updatePreferences({
                          morningEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Evening reflection reminder
                  </p>
                  <p className="text-xs text-gray-500">
                    Reflect on your day
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={notifPrefs.eveningTime}
                    onChange={(e) =>
                      updatePreferences({ eveningTime: e.target.value })
                    }
                    disabled={!notifPrefs.eveningEnabled}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 disabled:opacity-40"
                  />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.eveningEnabled}
                      onChange={(e) =>
                        updatePreferences({
                          eveningEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={async () => {
                    setTestSending(true);
                    await fetch("/api/notifications/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: "Test Notification",
                        body: "Push notifications are working!",
                        url: "/dashboard",
                      }),
                    });
                    setTestSending(false);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {testSending ? "Sending..." : "Send test notification"}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={unsubscribe}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Disable notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
