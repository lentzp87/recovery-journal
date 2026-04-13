import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Recovery Journal
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          A private space for your recovery journey. Track your reflections,
          step work, and daily check-ins — synced across all your devices.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-8 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition"
          >
            Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          Your entries are private and encrypted. Only you can see your data.
        </p>
      </div>
    </div>
  );
}
