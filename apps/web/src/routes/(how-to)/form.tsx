import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useAppForm } from "@signa/web/components/form/hooks/use-app-form";

const testSchema = z.object({
  // Input
  username: z.string().min(1, "Username is required"),
  email: z.email("Invalid email"),

  // Password
  password: z.string().min(8, "At least 8 characters"),

  // Textarea
  bio: z.string().max(200, "Max 200 characters").optional(),

  // Select
  role: z.string().min(1, "Please select a role"),

  // Checkbox
  agreeToTerms: z.boolean().refine((v) => v, "You must agree to terms"),

  // Switch
  notifications: z.boolean(),

  // RadioGroup
  plan: z.enum(["free", "pro", "enterprise"], { message: "Please select a plan" }),

  // DatePicker
  birthDate: z.date().optional(),

  // DateRangePicker
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional()
    })
    .optional()
});

type TestFormValues = z.infer<typeof testSchema>;

export const Route = createFileRoute("/(how-to)/form")({
  component: FormTestPage
});

function FormTestPage() {
  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      bio: "", // string, not undefined
      role: "",
      agreeToTerms: false, // widen to boolean
      notifications: false,
      plan: "free",
      birthDate: undefined,
      dateRange: undefined
    } satisfies TestFormValues as TestFormValues,
    validators: {
      onSubmit: testSchema
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value);
      alert(JSON.stringify(value, null, 2));
    }
  });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Form Components Test</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A test page for all available form field components.
        </p>
      </div>

      <form.AppForm>
        <form.Form>
          {/* ── Input ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Input</h2>

            <form.AppField name="username">
              {(field) => (
                <field.Input
                  label="Username"
                  placeholder="john_doe"
                  description="Unique identifier for your account."
                />
              )}
            </form.AppField>

            <form.AppField name="email">
              {(field) => (
                <field.Input
                  label="Email"
                  placeholder="you@example.com"
                  description="We'll never share your email."
                />
              )}
            </form.AppField>
          </section>

          {/* ── Password ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Password</h2>

            <form.AppField name="password">
              {(field) => (
                <field.Password label="Password" description="Must be at least 8 characters." />
              )}
            </form.AppField>
          </section>

          {/* ── Textarea ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Textarea</h2>

            <form.AppField name="bio">
              {(field) => (
                <field.Textarea
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  description="Max 200 characters."
                />
              )}
            </form.AppField>
          </section>

          {/* ── Select ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Select</h2>

            <form.AppField name="role">
              {(field) => (
                <field.Select
                  label="Role"
                  description="Your role in the organization."
                  options={[
                    { label: "Admin", value: "admin" },
                    { label: "Editor", value: "editor" },
                    { label: "Viewer", value: "viewer" }
                  ]}
                />
              )}
            </form.AppField>
          </section>

          {/* ── RadioGroup ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Radio Group</h2>

            <form.AppField name="plan">
              {(field) => (
                <field.RadioGroup
                  label="Plan"
                  description="Choose the plan that fits you."
                  options={[
                    { label: "Free", value: "free" },
                    { label: "Pro", value: "pro" },
                    { label: "Enterprise", value: "enterprise" }
                  ]}
                />
              )}
            </form.AppField>
          </section>

          {/* ── DatePicker ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Date Picker</h2>

            <form.AppField name="birthDate">
              {(field) => <field.DatePicker label="Birth Date" description="Your date of birth." />}
            </form.AppField>
          </section>

          {/* ── DateRangePicker ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Date Range Picker</h2>

            <form.AppField name="dateRange">
              {(field) => (
                <field.DateRangePicker
                  label="Date Range"
                  description="Select a start and end date."
                />
              )}
            </form.AppField>
          </section>

          {/* ── Switch ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Switch</h2>

            <form.AppField name="notifications">
              {(field) => (
                <field.Switch
                  layout="inline"
                  label="Email Notifications"
                  description="Receive updates about your account by email."
                />
              )}
            </form.AppField>
          </section>

          {/* ── Checkbox ── */}
          <section className="space-y-4">
            <h2 className="border-b pb-1 text-base font-semibold">Checkbox</h2>

            <form.AppField name="agreeToTerms">
              {(field) => (
                <field.Checkbox
                  layout="inline"
                  label="I agree to the Terms of Service"
                  description="You must accept the terms to continue."
                />
              )}
            </form.AppField>
          </section>

          {/* ── Submit ── */}

          <form.Submit>{false ? "Submitting..." : "Submit"}</form.Submit>
        </form.Form>
      </form.AppForm>

      {/* Debug panel */}
      <form.Subscribe selector={(s) => s.values}>
        {(values) => (
          <details className="bg-muted mt-10 rounded-lg p-4">
            <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
              Debug — current values
            </summary>
            <pre className="mt-3 overflow-auto text-xs">{JSON.stringify(values, null, 2)}</pre>
          </details>
        )}
      </form.Subscribe>
    </div>
  );
}
