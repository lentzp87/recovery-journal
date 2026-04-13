import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") || "json";

  // Fetch all user data
  const [journalRes, stepsRes, checkInsRes, profileRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("step_work")
      .select("*")
      .eq("user_id", user.id)
      .order("step_number"),
    supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", user.id)
      .order("check_in_date", { ascending: false }),
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single(),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    journal_entries: journalRes.data || [],
    step_work: stepsRes.data || [],
    check_ins: checkInsRes.data || [],
  };

  if (format === "csv") {
    const csv = convertToCSV(exportData);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="recovery-journal-export-${today()}.csv"`,
      },
    });
  }

  // Default: JSON
  const json = JSON.stringify(exportData, null, 2);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="recovery-journal-export-${today()}.json"`,
    },
  });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

interface ExportData {
  exported_at: string;
  profile: Record<string, unknown> | null;
  journal_entries: Record<string, unknown>[];
  step_work: Record<string, unknown>[];
  check_ins: Record<string, unknown>[];
}

function convertToCSV(data: ExportData): string {
  const sections: string[] = [];

  // Journal entries
  if (data.journal_entries.length > 0) {
    sections.push("=== JOURNAL ENTRIES ===");
    sections.push(arrayToCSV(data.journal_entries));
  }

  // Step work
  if (data.step_work.length > 0) {
    sections.push("\n=== STEP WORK ===");
    sections.push(arrayToCSV(data.step_work));
  }

  // Check-ins
  if (data.check_ins.length > 0) {
    sections.push("\n=== CHECK-INS ===");
    sections.push(arrayToCSV(data.check_ins));
  }

  if (sections.length === 0) {
    return "No data to export.";
  }

  return sections.join("\n");
}

function arrayToCSV(arr: Record<string, unknown>[]): string {
  if (arr.length === 0) return "";
  const headers = Object.keys(arr[0]);
  const rows = arr.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma/newline/quote
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
