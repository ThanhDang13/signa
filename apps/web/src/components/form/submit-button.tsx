import { Button } from "@signa/react-ui/components/ui/button";
import { useFormContext } from "@signa/web/components/form/hooks/use-form-context";
import type { ReactNode } from "react";

type SubmitButtonProps = {
  children: ReactNode;
  loadingText?: ReactNode;
  className?: string;
  isPending?: boolean;
};

export function SubmitButton({ children, loadingText, className, isPending }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => {
        const pending = isSubmitting || Boolean(isPending);
        return (
          <Button type="submit" className={className} disabled={!canSubmit || pending}>
            {pending ? (loadingText ?? children) : children}
          </Button>
        );
      }}
    </form.Subscribe>
  );
}
