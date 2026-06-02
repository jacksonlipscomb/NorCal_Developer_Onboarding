import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StepForm, type StepFormValues } from "@/components/StepForm";
import { createStep } from "@/lib/api";

export function AddStepDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: StepFormValues) => createStep(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) mutation.reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add step
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add onboarding step</DialogTitle>
          <DialogDescription>
            New steps are added to the end of the list.
          </DialogDescription>
        </DialogHeader>
        <StepForm
          submitLabel="Add step"
          pending={mutation.isPending}
          errorMessage={mutation.error?.message}
          onSubmit={(values) => mutation.mutate(values)}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
