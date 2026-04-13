import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

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

export default async function StepsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: steps } = await supabase
    .from("step_work")
    .select("*")
    .eq("user_id", user!.id)
    .order("step_number");

  const stepsMap = new Map(steps?.map((s) => [s.step_number, s]) || []);
  const completed = steps?.filter((s) => s.status === "completed").length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">The Twelve Steps</h1>
        <p className="text-gray-500 mt-1">{completed} of 12 completed</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completed / 12) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {stepDescriptions.map((description, index) => {
          const stepNumber = index + 1;
          const step = stepsMap.get(stepNumber);
          const status = step?.status || "not_started";

          return (
            <Link
              key={stepNumber}
              href={`/dashboard/steps/${stepNumber}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${
                      status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "in_progress"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-400"
                    }
                  `}
                >
                  {status === "completed" ? "✓" : stepNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Step {stepNumber}</h3>
                    {status === "in_progress" && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
