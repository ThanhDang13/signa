import { useFormContext } from "@signa/web/components/form/hooks/use-form-context";
import type { FormEvent, ReactNode } from "react";

type AppFormProps = {
  children: ReactNode;
  className?: string;
};

export function Form({ children, className }: AppFormProps) {
  const form = useFormContext();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
