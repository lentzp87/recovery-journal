import { createServerSupabaseClient } from "@/lib/supabase/server";
import webpush from "web-push";
import { NextRequest } from "next/server";

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_CONTACT_EMAIL || "noreply@recovery-journal.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// POST - Send a push notification to a specific user (for testing)
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, url } = await request.json();

  // Get user's push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ error: "No subscriptions found" }, { status: 404 });
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: title || "Recovery Journal",
          body: body || "Time for your check-in",
          url: url || "/check-ins/new",
          tag: "manual-notification",
        })
      )
    )
  );

  // Clean up expired subscriptions
  const expired = results
    .map((r, i) => (r.status === "rejected" ? subscriptions[i] : null))
    .filter(Boolean);

  for (const sub of expired) {
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({ sent, expired: expired.length });
}
