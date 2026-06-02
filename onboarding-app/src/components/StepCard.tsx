import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditStepDialog } from "@/components/EditStepDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import type { OnboardingStep } from "@/data/types";

interface StepCardProps {
  step: OnboardingStep;
  index: number; // 1-based display position
}

export function StepCard({ step, index }: StepCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">
            {step.title}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {step.body}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit step: ${step.title}`}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
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

      <EditStepDialog step={step} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDeleteDialog
        step={step}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </li>
  );
}
