"use client";

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const stepDescriptions = [
  "We admitted we were powerless — that our lives had become unmanageable.",
  "Came to believe that a Power greater than ourselves could restore us to sanity.",
  "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
  "Made a searching and fearless moral inventory of ourselves.",
  "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
  "Were entirely ready to have God remove all these defects of character.",
  "Humbly asked Him to remove our shortcomings.",
  "Made a list of all persons we had harmed, and became willing to make amends to them all.",
  "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
  "Continued to take personal inventory and when we were wrong promptly admitted it.",
  "Sought through prayer and meditation to improve our conscious contact with God as we understood Him.",
  "Having had a spiritual awakening as the result of these Steps, we tried to carry this message and to practice these principles in all our affairs.",
];

export default function StepDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stepNumber = Number(params.stepNumber);
  const supabase = createClient();

  const [status, setStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");
  const [reflection, setReflection] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorContact, setSponsorContact] = useState("");
  const [stepId, setStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStep = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("step_work")
      .select("*")
      .eq("user_id", user.id)
      .eq("step_number", stepNumber)
      .single();

    if (data) {
      setStepId(data.id);
      setStatus(data.status as typeof status);
      setReflection(data.reflection || "");
      setSponsorName(data.sponsor_name || "");
      setSponsorContact(data.sponsor_contact || "");
    }
    setLoading(false);
  }, [supabase, stepNumber]);

  useEffect(() => {
    loadStep();
  }, [loadStep]);

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const stepData = {
      user_id: user.id,
      step_number: stepNumber,
      status,
      reflection: reflection || null,
      sponsor_name: sponsorName || null,
      sponsor_contact: sponsorContact || null,
      start_date: status !== "not_started" ? today : null,
      completion_date: status === "completed" ? today : null,
    };

    if (stepId) {
      await supabase.from("step_work").update(stepData).eq("id", stepId);
    } else {
      const { data } = await supabase
        .from("step_work")
        .insert(stepData)
        .select()
        .single();
      if (data) setStepId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push("/dashboard/steps")}
            className="text-sm text-gray-400 hover:text-gray-600 mb-1"
          >
            ← Back to steps
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Step {stepNumber}</h1>
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
        {/* Step description */}
        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <p className="text-indigo-900 italic leading-relaxed">
            &ldquo;{stepDescriptions[stepNumber - 1]}&rdquo;
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
          <div className="flex gap-2">
            {(["not_started", "in_progress", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border transition
                  ${
                    status === s
                      ? s === "completed"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : s === "in_progress"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }
                `}
              >
                {s === "not_started"
                  ? "Not started"
                  : s === "in_progress"
                  ? "In progress"
                  : "Completed"}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Your Reflection</h3>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your thoughts on this step... What does it mean to you? How are you working it?"
            rows={8}
            className="w-full text-gray-900 placeholder-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Sponsor info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sponsor (optional)</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="Sponsor name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
            />
            <input
              type="text"
              value={sponsorContact}
              onChange={(e) => setSponsorContact(e.target.value)}
              placeholder="Phone or email"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
