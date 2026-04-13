"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const moodOptions = [
  { value: 1, label: "Struggling", color: "bg-red-100 text-red-700 border-red-200" },
  { value: 2, label: "Tough", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: 3, label: "Okay", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: 4, label: "Good", color: "bg-green-100 text-green-700 border-green-200" },
  { value: 5, label: "Great", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export default function JournalEntryPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState("");
  const [cravingsExperienced, setCravingsExperienced] = useState(false);
  const [cravingsIntensity, setCravingsIntensity] = useState(1);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEntry = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", date)
      .single();

    if (data) {
      setEntryId(data.id);
      setTitle(data.title || "");
      setContent(data.content || "");
      setMood(data.mood);
      setGratitude(data.gratitude || "");
      setCravingsExperienced(data.cravings_experienced || false);
      setCravingsIntensity(data.cravings_intensity || 1);
    }
    setLoading(false);
  }, [supabase, date]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const entryData = {
      user_id: user.id,
      entry_date: date,
      title: title || null,
      content: content || null,
      mood,
      gratitude: gratitude || null,
      cravings_experienced: cravingsExperienced,
      cravings_intensity: cravingsExperienced ? cravingsIntensity : null,
    };

    if (entryId) {
      await supabase
        .from("journal_entries")
        .update(entryData)
        .eq("id", entryId);
    } else {
      const { data } = await supabase
        .from("journal_entries")
        .insert(entryData)
        .select()
        .single();
      if (data) setEntryId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/dashboard/journal")}
            className="text-sm text-gray-400 hover:text-gray-600 mb-1"
          >
            ← Back to journal
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{displayDate}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give today a title (optional)"
            className="w-full text-lg font-medium text-gray-900 placeholder-gray-300 outline-none"
          />
        </div>

        {/* Mood */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">How are you feeling?</h3>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(mood === option.value ? null : option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border transition
                  ${
                    mood === option.value
                      ? option.color
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journal content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Reflection</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today? How are you feeling about your recovery?"
            rows={8}
            className="w-full text-gray-900 placeholder-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Gratitude */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Gratitude</h3>
          <textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="What are you grateful for today?"
            rows={3}
            className="w-full text-gray-900 placeholder-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Cravings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Cravings today?</h3>
            <button
              onClick={() => setCravingsExperienced(!cravingsExperienced)}
              className={`
                relative w-11 h-6 rounded-full transition
                ${cravingsExperienced ? "bg-indigo-600" : "bg-gray-200"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${cravingsExperienced ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </div>

          {cravingsExperienced && (
            <div className="mt-4">
              <label className="text-sm text-gray-500 mb-2 block">
                Intensity: {cravingsIntensity}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={cravingsIntensity}
                onChange={(e) => setCravingsIntensity(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Mild</span>
                <span>Intense</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
