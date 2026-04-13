import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function JournalListPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_date, title, mood, content")
    .eq("user_id", user!.id)
    .order("entry_date", { ascending: false });

  const moodLabels = ["", "Struggling", "Tough", "Okay", "Good", "Great"];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
        <Link
          href={`/dashboard/journal/${today}`}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Today&apos;s entry
        </Link>
      </div>

      {(!entries || entries.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📖</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No entries yet</h2>
          <p className="text-gray-500 mb-6">
            Your journal is a private space for reflection. Start writing whenever you&apos;re ready.
          </p>
          <Link
            href={`/dashboard/journal/${today}`}
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Write your first entry
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/dashboard/journal/${entry.entry_date}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {entry.title || formatDate(entry.entry_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(entry.entry_date)}
                  </p>
                  {entry.content && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {entry.content}
                    </p>
                  )}
                </div>
                {entry.mood && (
                  <span className="ml-4 text-sm text-gray-400 whitespace-nowrap">
                    {moodLabels[entry.mood]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
