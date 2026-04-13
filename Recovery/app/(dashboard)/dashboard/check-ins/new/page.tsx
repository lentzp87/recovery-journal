"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const moodOptions = [
  { value: 1, label: "Struggling", color: "bg-red-100 text-red-700 border-red-200" },
  { value: 2, label: "Tough", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: 3, label: "Okay", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: 4, label: "Good", color: "bg-green-100 text-green-700 border-green-200" },
  { value: 5, label: "Great", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export default function NewCheckInPage() {
  const router = useRouter();
  const supabase = createClient();

  const hour = new Date().getHours();
  const [checkInType, setCheckInType] = useState<"morning" | "evening">(
    hour < 14 ? "morning" : "evening"
  );
  const [mood, setMood] = useState<number | null>(null);
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [gratitudeItems, setGratitudeItems] = useState<string[]>([]);
  const [cravingLevel, setCravingLevel] = useState(1);
  const [hasCravings, setHasCravings] = useState(false);
  const [cravingNotes, setCravingNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function addGratitudeItem() {
    const trimmed = gratitudeInput.trim();
    if (trimmed && !gratitudeItems.includes(trimmed)) {
      setGratitudeItems([...gratitudeItems, trimmed]);
      setGratitudeInput("");
    }
  }

  function removeGratitudeItem(item: string) {
    setGratitudeItems(gratitudeItems.filter((i) => i !== item));
  }

  async function handleSubmit() {
    if (!mood) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("check_ins").upsert(
      {
        user_id: user.id,
        check_in_date: today,
        check_in_type: checkInType,
        mood,
        gratitude_items: gratitudeItems.length > 0 ? gratitudeItems : null,
        craving_level: hasCravings ? cravingLevel : null,
        craving_notes: hasCravings && cravingNotes ? cravingNotes : null,
      },
      { onConflict: "user_id,check_in_date,check_in_type" }
    );

    setSaving(false);
    if (!error) {
      router.push("/dashboard/check-ins");
      router.refresh();
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/check-ins")}
          className="text-sm text-gray-400 hover:text-gray-600 mb-1"
        >
          ← Back to check-ins
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Quick Check-in</h1>
      </div>

      <div className="space-y-6">
        {/* Type */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">When</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCheckInType("morning")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                checkInType === "morning"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setCheckInType("evening")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                checkInType === "evening"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              Evening
            </button>
          </div>
        </div>

        {/* Mood */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">How are you feeling?</h3>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  mood === option.value
                    ? option.color
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Gratitude</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={gratitudeInput}
              onChange={(e) => setGratitudeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGratitudeItem()}
              placeholder="Something you're grateful for..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
            />
            <button
              onClick={addGratitudeItem}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Add
            </button>
          </div>
          {gratitudeItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {gratitudeItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full"
                >
                  {item}
                  <button
                    onClick={() => removeGratitudeItem(item)}
                    className="text-green-400 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cravings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Any cravings?</h3>
            <button
              onClick={() => setHasCravings(!hasCravings)}
              className={`relative w-11 h-6 rounded-full transition ${
                hasCravings ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hasCravings ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {hasCravings && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-gray-500 mb-2 block">
                  Intensity: {cravingLevel}/10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={cravingLevel}
                  onChange={(e) => setCravingLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <textarea
                value={cravingNotes}
                onChange={(e) => setCravingNotes(e.target.value)}
                placeholder="What triggered it? How did you handle it?"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 resize-none"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!mood || saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save check-in"}
        </button>
      </div>
    </div>
  );
}
