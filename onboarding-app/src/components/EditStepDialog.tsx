import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StepForm, type StepFormValues } from "@/components/StepForm";
import { updateStep } from "@/lib/api";
import type { OnboardingStep } from "@/data/types";

interface EditStepDialogProps {
  step: OnboardingStep;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStepDialog({
  step,
  open,
  onOpenChange,
}: EditStepDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: StepFormValues) => updateStep(step.id, values),
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit step</DialogTitle>
          <DialogDescription>
            Update the title or instructions for this step.
          </DialogDescription>
        </DialogHeader>
        <StepForm
          defaultTitle={step.title}
          defaultBody={step.body}
          submitLabel="Save changes"
          pending={mutation.isPending}
          errorMessage={mutation.error?.message}
          onSubmit={(values) => mutation.mutate(values)}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
