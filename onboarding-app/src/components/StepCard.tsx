import { useState } from "react";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/data/types";

interface StepCardProps {
  step: OnboardingStep;
  index: number; // 1-based display position
  completed: boolean;
  onToggleComplete: (id: string) => void;
}

export function StepCard({
  step,
  index,
  completed,
  onToggleComplete,
}: StepCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <li
      className={cn(
        "rounded-lg border bg-white p-5 shadow-sm transition-colors",
        completed ? "border-green-200 bg-green-50/40" : "border-slate-200",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Explicit, obvious check-off control. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={
            completed
              ? `Mark "${step.title}" not done`
              : `Mark "${step.title}" done`
          }
          onClick={() => onToggleComplete(step.id)}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            completed
              ? "border-green-600 bg-green-600 text-white"
              : "border-slate-300 bg-white text-transparent hover:border-green-500 hover:text-green-500",
          )}
        >
          <Check className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "text-base font-semibold",
              completed ? "text-slate-400 line-through" : "text-slate-900",
            )}
          >
            <span className="text-slate-400">{index}.</span> {step.title}
          </h2>
          <p
            className={cn(
              "mt-2 whitespace-pre-wrap text-sm leading-relaxed",
              completed ? "text-slate-400" : "text-slate-700",
            )}
          >
            {step.body}
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete step: ${step.title}`}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <ConfirmDeleteDialog
        step={step}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </li>
  );
}
