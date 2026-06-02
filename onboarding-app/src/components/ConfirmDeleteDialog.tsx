import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteStep } from "@/lib/api";
import type { OnboardingStep } from "@/data/types";

interface ConfirmDeleteDialogProps {
  step: OnboardingStep;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDeleteDialog({
  step,
  open,
  onOpenChange,
}: ConfirmDeleteDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteStep(step.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      onOpenChange(false);
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) mutation.reset();
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this step?</AlertDialogTitle>
          <AlertDialogDescription>
            “{step.title}” will be removed from the list. This hides it from the
            onboarding view; the record is preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {mutation.error && (
          <p role="alert" className="text-sm text-red-600">
            {mutation.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          {/* Not AlertDialogAction: we close on mutation success, not on click. */}
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting…" : "Delete step"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
