import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// POST - Create a new push subscription
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscription, preferences } = await request.json();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      morning_enabled: preferences?.morningEnabled ?? true,
      evening_enabled: preferences?.eveningEnabled ?? true,
      morning_time: preferences?.morningTime ?? "08:00",
      evening_time: preferences?.eveningTime ?? "20:00",
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

// PATCH - Update notification preferences
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { preferences } = await request.json();

  const { error } = await supabase
    .from("push_subscriptions")
    .update({
      morning_enabled: preferences.morningEnabled,
      evening_enabled: preferences.eveningEnabled,
      morning_time: preferences.morningTime,
      evening_time: preferences.eveningTime,
    })
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

// DELETE - Remove push subscription
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
