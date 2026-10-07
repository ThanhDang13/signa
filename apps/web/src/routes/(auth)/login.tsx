import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAppForm } from "@signa/web/components/form/hooks/use-app-form";
import { authMutations } from "@signa/web/lib/tanstack/options/auth";
import { FieldGroup } from "@signa/react-ui/components/ui/field";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage
});

function LoginPage() {
  const loginMutation = useMutation(authMutations.login());

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: ""
    } satisfies LoginFormValues as LoginFormValues,
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync({
        body: {
          email: value.email,
          password: value.password
        }
      });
    }
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Signa Admin
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form.AppForm>
              <form.Form className="flex flex-col gap-6">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Đăng nhập vào tài khoản</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Nhập email của bạn để đăng nhập vào hệ thống
                    </p>
                  </div>

                  <form.AppField name="email">
                    {(field) => (
                      <field.Input
                        label="Email"
                        placeholder="admin@example.com"
                        autoComplete="email"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="password">
                    {(field) => <field.Password label="Mật khẩu" autoComplete="current-password" />}
                  </form.AppField>

                  <form.Submit className="w-full">
                    {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                  </form.Submit>
                </FieldGroup>
              </form.Form>
            </form.AppForm>
          </div>
        </div>
      </div>

      <div className="bg-muted relative hidden overflow-hidden lg:block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M40 0H0V40"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="800" height="800" fill="url(#grid)" className="text-foreground" />
          <circle cx="600" cy="200" r="260" fill="url(#glow)" className="text-primary" />
          <circle cx="180" cy="640" r="200" fill="url(#glow)" className="text-primary" />

          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            opacity="0.5"
          >
            <circle cx="400" cy="400" r="120" />
            <circle cx="400" cy="400" r="200" strokeOpacity="0.5" />
            <circle cx="400" cy="400" r="280" strokeOpacity="0.25" />
            <path d="M400 330v140M330 400h140" />
          </g>
        </svg>
      </div>
    </div>
  );
}
