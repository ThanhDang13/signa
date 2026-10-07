import * as React from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@signa/web/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@signa/react-ui/components/ui/sidebar";
import { TooltipProvider } from "@signa/react-ui/components/ui/tooltip";
import { getMeOptions } from "@signa/web/lib/tanstack/options/auth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    let user;
    try {
      user = await context.queryClient.query(getMeOptions());
    } catch {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "SUPER_ADMIN") {
      if (typeof window !== "undefined") {
        setTimeout(() => {
          toast.error("Bạn không có quyền truy cập trang này");
        }, 0);
      }
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AppLayout
});

function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
