import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/StepCard";
import { AddStepDialog } from "@/components/AddStepDialog";
import { listSteps } from "@/lib/api";

export default function App() {
  const {
    data: steps,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({ queryKey: ["steps"], queryFn: listSteps });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            NorCal Developer Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Follow these steps to get set up.
          </p>
        </div>
        <AddStepDialog />
      </header>

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
            <StepCard key={step.id} step={step} index={i + 1} />
          ))}
        </ol>
      )}
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
