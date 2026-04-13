import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { NextRequest } from "next/server";

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_CONTACT_EMAIL || "noreply@recovery-journal.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Use service role client for cron (no user session)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Determine if this is a morning or evening window
  // We check both — users in different timezones may match either
  const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  // Get morning subscriptions matching this time (within 30-min window)
  const { data: morningSubsRaw } = await supabase
    .from("push_subscriptions")
    .select("*, users!inner(timezone)")
    .eq("morning_enabled", true);

  // Get evening subscriptions matching this time
  const { data: eveningSubsRaw } = await supabase
    .from("push_subscriptions")
    .select("*, users!inner(timezone)")
    .eq("evening_enabled", true);

  const morningMessages = [
    "Good morning! Start your day with a moment of gratitude.",
    "Rise and shine! How are you feeling today?",
    "New day, new strength. Time for your morning check-in.",
  ];

  const eveningMessages = [
    "How was your day? Take a moment to reflect.",
    "Evening check-in time. What are you grateful for today?",
    "End your day mindfully. How did recovery go today?",
  ];

  let totalSent = 0;
  let totalExpired = 0;

  // Process morning notifications
  if (morningSubsRaw) {
    for (const sub of morningSubsRaw) {
      const userTz = (sub.users as { timezone: string })?.timezone || "UTC";
      const userTime = getTimeInTimezone(now, userTz);
      const targetTime = sub.morning_time?.slice(0, 5) || "08:00";

      if (isWithinWindow(userTime, targetTime)) {
        const body = morningMessages[Math.floor(Math.random() * morningMessages.length)];
        const result = await sendPush(sub, "Good Morning!", body, "/check-ins/new");
        if (result === "sent") totalSent++;
        if (result === "expired") {
          totalExpired++;
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  // Process evening notifications
  if (eveningSubsRaw) {
    for (const sub of eveningSubsRaw) {
      const userTz = (sub.users as { timezone: string })?.timezone || "UTC";
      const userTime = getTimeInTimezone(now, userTz);
      const targetTime = sub.evening_time?.slice(0, 5) || "20:00";

      if (isWithinWindow(userTime, targetTime)) {
        const body = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
        const result = await sendPush(sub, "Evening Reflection", body, "/check-ins/new");
        if (result === "sent") totalSent++;
        if (result === "expired") {
          totalExpired++;
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  return Response.json({
    ok: true,
    time: timeStr,
    sent: totalSent,
    expired: totalExpired,
  });
}

function getTimeInTimezone(date: Date, timezone: string): string {
  try {
    return date.toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return date.toLocaleTimeString("en-GB", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}

function isWithinWindow(currentTime: string, targetTime: string): boolean {
  const [ch, cm] = currentTime.split(":").map(Number);
  const [th, tm] = targetTime.split(":").map(Number);
  const currentMinutes = ch * 60 + cm;
  const targetMinutes = th * 60 + tm;
  // Within a 15-minute window after target time
  const diff = currentMinutes - targetMinutes;
  return diff >= 0 && diff < 15;
}

interface PushSub {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendPush(
  sub: PushSub,
  title: string,
  body: string,
  url: string
): Promise<"sent" | "expired" | "error"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({ title, body, url, tag: "scheduled-reminder" })
    );
    return "sent";
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err) {
      const statusCode = (err as { statusCode: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        return "expired";
      }
    }
    return "error";
  }
}
