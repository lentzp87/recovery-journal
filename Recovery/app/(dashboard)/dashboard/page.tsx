import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch today's data
  const today = new Date().toISOString().split("T")[0];

  const [journalRes, stepsRes, checkInsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, entry_date, title, mood")
      .eq("user_id", user!.id)
      .order("entry_date", { ascending: false })
      .limit(5),
    supabase
      .from("step_work")
      .select("step_number, status")
      .eq("user_id", user!.id)
      .order("step_number"),
    supabase
      .from("check_ins")
      .select("id, check_in_type, mood")
      .eq("user_id", user!.id)
      .eq("check_in_date", today),
  ]);

  const recentEntries = journalRes.data || [];
  const steps = stepsRes.data || [];
  const todayCheckIns = checkInsRes.data || [];

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const hasMorningCheckIn = todayCheckIns.some((c) => c.check_in_type === "morning");
  const hasEveningCheckIn = todayCheckIns.some((c) => c.check_in_type === "evening");

  const moodLabels = ["", "Struggling", "Tough", "Okay", "Good", "Great"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()},{" "}
          {user?.user_metadata?.display_name || "friend"}
        </h1>
        <p className="text-gray-500 mt-1">One day at a time.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href={`/dashboard/journal/${today}`}
          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition"
        >
          <div className="text-2xl mb-2">📖</div>
          <h3 className="font-semibold text-gray-900">Today&apos;s Journal</h3>
          <p className="text-sm text-gray-500 mt-1">Write or continue your reflection</p>
        </Link>

        <Link
          href="/dashboard/check-ins/new"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition"
        >
          <div className="text-2xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-900">Quick Check-in</h3>
          <p className="text-sm text-gray-500 mt-1">
            {hasMorningCheckIn && hasEveningCheckIn
              ? "Both check-ins done today"
              : hasMorningCheckIn
              ? "Evening check-in available"
              : "Morning check-in available"}
          </p>
        </Link>

        <Link
          href="/dashboard/steps"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition"
        >
          <div className="text-2xl mb-2">🪜</div>
          <h3 className="font-semibold text-gray-900">Step Work</h3>
          <p className="text-sm text-gray-500 mt-1">
            {completedSteps}/12 steps completed
          </p>
        </Link>
      </div>

      {/* Recent journal entries */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Entries</h2>
          <Link
            href="/dashboard/journal"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
          </Link>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            No entries yet. Start your first journal entry today.
          </p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/dashboard/journal/${entry.entry_date}`}
                className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.title || formatDate(entry.entry_date)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(entry.entry_date)}
                    </p>
                  </div>
                  {entry.mood && (
                    <span className="text-sm text-gray-500">
                      {moodLabels[entry.mood]}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
