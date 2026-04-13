"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export default function SettingsPage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [recoveryStartDate, setRecoveryStartDate] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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
