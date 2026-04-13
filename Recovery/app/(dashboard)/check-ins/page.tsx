import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CheckInsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", user!.id)
    .order("check_in_date", { ascending: false })
    .order("check_in_type")
    .limit(30);

  const moodLabels = ["", "Struggling", "Tough", "Okay", "Good", "Great"];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check-ins</h1>
        <Link
          href="/check-ins/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          New check-in
        </Link>
      </div>

      {(!checkIns || checkIns.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No check-ins yet</h2>
          <p className="text-gray-500 mb-6">
            Quick check-ins help you track your mood and cravings throughout the day.
          </p>
          <Link
            href="/check-ins/new"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            First check-in
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {checkIns.map((checkIn) => (
            <div
              key={checkIn.id}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {checkIn.check_in_type === "morning" ? "Morning" : "Evening"} check-in
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(checkIn.check_in_date)}
                  </p>
                </div>
                <div className="text-right">
                  {checkIn.mood && (
                    <p className="text-sm text-gray-600">{moodLabels[checkIn.mood]}</p>
                  )}
                  {checkIn.craving_level && (
                    <p className="text-xs text-gray-400">Cravings: {checkIn.craving_level}/10</p>
                  )}
                </div>
              </div>
              {checkIn.gratitude_items && checkIn.gratitude_items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {checkIn.gratitude_items.map((item: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
