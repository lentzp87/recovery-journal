"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Confirming your account...</p>
    </div>
  );
}
