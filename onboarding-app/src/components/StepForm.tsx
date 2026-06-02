import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH } from "@/data/types";

export interface StepFormValues {
  title: string;
  body: string;
}

interface StepFormProps {
  defaultTitle?: string;
  defaultBody?: string;
  submitLabel: string;
  pending: boolean;
  errorMessage?: string;
  onSubmit: (values: StepFormValues) => void;
  onCancel: () => void;
}

// Shared add/edit form. Holds the field state, disables submit while a mutation is
// pending or the fields are blank, and renders any server error inline.
export function StepForm({
  defaultTitle = "",
  defaultBody = "",
  submitLabel,
  pending,
  errorMessage,
  onSubmit,
  onCancel,
}: StepFormProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);

  const canSubmit =
    !pending && title.trim().length > 0 && body.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), body });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="step-title">Title</Label>
        <Input
          id="step-title"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Set up Slack"
          disabled={pending}
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="step-body">Instructions</Label>
        <Textarea
          id="step-body"
          value={body}
          maxLength={BODY_MAX_LENGTH}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Step-by-step instructions…"
          disabled={pending}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
