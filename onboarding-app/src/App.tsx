import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/StepCard";
import { AddStepDialog } from "@/components/AddStepDialog";
import { useCompletedSteps } from "@/hooks/useCompletedSteps";
import { listSteps } from "@/lib/api";

export default function App() {
  const {
    data: steps,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["steps"], queryFn: listSteps });

  const { completed, toggle } = useCompletedSteps();
  const doneCount = steps?.filter((s) => completed.has(s.id)).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-norcal-black">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <img
            src="/norcal-crew-logo.png"
            alt="NorCal Crew"
            className="h-11 w-auto"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            NorCal{" "}
            <span className="text-norcal-gold">Developer Onboarding</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Follow these steps to get set up.
            {steps && steps.length > 0 && (
              <span className="ml-1 font-medium text-slate-700">
                {doneCount} of {steps.length} done.
              </span>
            )}
          </p>
          <AddStepDialog />
        </div>

        {isPending && <SkeletonList />}

        {isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
          >
            <p className="text-sm text-red-700">
              Couldn’t load onboarding steps: {error.message}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {steps && steps.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              No onboarding steps yet. Add the first one to get started.
            </p>
          </div>
        )}

        {steps && steps.length > 0 && (
          <ol className="grid list-none gap-4 p-0">
            {steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i + 1}
                completed={completed.has(step.id)}
                onToggleComplete={toggle}
              />
            ))}
          </ol>
        )}
      </main>

      <footer className="border-t border-slate-300 bg-norcal-gray">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Norcal Crew</p>
          <p className="mt-1">101 Westpoint Harbor Drive</p>
          <p>Redwood City, CA 94063</p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=101+Westpoint+Harbor+Drive+Redwood+City+CA+94063"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-medium text-slate-700 underline decoration-norcal-gold decoration-2 underline-offset-2 hover:text-slate-900"
          >
            Directions
          </a>
          <p className="mt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} Norcal Crew. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="grid list-none gap-4 p-0" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
        />
      ))}
    </ul>
  );
}
