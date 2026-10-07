import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { useAppForm } from "@signa/web/components/form/hooks/use-app-form";
import { DataTable } from "@signa/web/components/table/data-table";
import { clerkMutations, listClerksOptions } from "@signa/web/lib/tanstack/options/clerk";
import { Button } from "@signa/react-ui/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from "@signa/react-ui/components/ui/breadcrumb";
import { Separator } from "@signa/react-ui/components/ui/separator";
import { SidebarTrigger } from "@signa/react-ui/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@signa/react-ui/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@signa/react-ui/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@signa/react-ui/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/clerks/")({
  component: RouteComponent
});

type Clerk = {
  id: string;
  email: string;
  fullname: string;
  createdAt: string;
};

const clerkFormSchema = z.object({
  email: z.string({ message: "Email không hợp lệ" }).email("Email không hợp lệ"),
  fullname: z.string().min(1, "Họ tên không được để trống"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự")
});

const clerkEditFormSchema = z.object({
  email: z.string({ message: "Email không hợp lệ" }).email("Email không hợp lệ"),
  fullname: z.string().min(1, "Họ tên không được để trống"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").optional().or(z.literal(""))
});

type ClerkFormValues = z.infer<typeof clerkFormSchema>;
type ClerkEditFormValues = z.infer<typeof clerkEditFormSchema>;

function RouteComponent() {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Array<{ id: string; value: unknown }>>(
    []
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const sortBy = sorting[0]?.id || "createdAt";
  const order = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading } = useQuery(
    listClerksOptions({
      query: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: sortBy as "email" | "fullname" | "createdAt",
        order
      }
    })
  );

  const filteredData = React.useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery) return data.data;

    const query = searchQuery.toLowerCase();
    return data.data.filter(
      (clerk) =>
        clerk.email.toLowerCase().includes(query) || clerk.fullname.toLowerCase().includes(query)
    );
  }, [data?.data, searchQuery]);

  const columns: ColumnDef<Clerk>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>
    },
    {
      accessorKey: "fullname",
      header: "Họ tên",
      cell: ({ row }) => <div>{row.getValue("fullname")}</div>
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleDateString("vi-VN")}</div>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => <ClerkActions clerk={row.original} />
    }
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Quản lý kiểm phiếu viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 p-4">
        <DataTable
          columns={columns}
          data={filteredData}
          pageCount={data?.meta.totalPages || 0}
          rowCount={data?.meta.totalCount}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          searchableColumns={[
            {
              id: "search",
              title: "Tìm kiếm theo email hoặc họ tên"
            }
          ]}
          toolbarActions={<CreateClerkDialog />}
        />
      </div>
    </div>
  );
}

function CreateClerkDialog() {
  const [open, setOpen] = React.useState(false);
  const createMutation = useMutation(clerkMutations.create());

  const form = useAppForm({
    defaultValues: {
      email: "",
      fullname: "",
      password: ""
    } satisfies ClerkFormValues as ClerkFormValues,
    validators: {
      onSubmit: clerkFormSchema
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        body: value
      });
      setOpen(false);
      form.reset();
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tạo kiểm phiếu viên</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo kiểm phiếu viên mới</DialogTitle>
          <DialogDescription>Thêm một kiểm phiếu viên mới vào hệ thống</DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="email">
              {(field) => (
                <field.Input label="Email" placeholder="clerk@example.com" autoComplete="email" />
              )}
            </form.AppField>

            <form.AppField name="fullname">
              {(field) => <field.Input label="Họ tên" placeholder="Nguyễn Văn A" />}
            </form.AppField>

            <form.AppField name="password">
              {(field) => (
                <field.Password
                  label="Mật khẩu"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              )}
            </form.AppField>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <form.Submit isPending={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo"}
              </form.Submit>
            </div>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function EditClerkDialog({ clerk }: { clerk: Clerk }) {
  const [open, setOpen] = React.useState(false);
  const updateMutation = useMutation(clerkMutations.update());
  const resetPasswordMutation = useMutation(clerkMutations.resetPassword());

  const form = useAppForm({
    defaultValues: {
      email: clerk.email,
      fullname: clerk.fullname,
      password: ""
    } satisfies ClerkEditFormValues as ClerkEditFormValues,
    validators: {
      onSubmit: clerkEditFormSchema
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        params: { id: clerk.id },
        body: {
          fullname: value.fullname
        }
      });

      if (value.password && value.password.length >= 8) {
        await resetPasswordMutation.mutateAsync({
          params: { id: clerk.id },
          body: { password: value.password }
        });
      }

      setOpen(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa kiểm phiếu viên</DialogTitle>
          <DialogDescription>Cập nhật thông tin kiểm phiếu viên</DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="email">
              {(field) => <field.Input label="Email" readOnly />}
            </form.AppField>

            <form.AppField name="fullname">
              {(field) => <field.Input label="Họ tên" placeholder="Nguyễn Văn A" />}
            </form.AppField>

            <form.AppField name="password">
              {(field) => (
                <field.Password
                  label="Mật khẩu mới (tùy chọn)"
                  autoComplete="new-password"
                  placeholder="Để trống nếu không đổi"
                />
              )}
            </form.AppField>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <form.Submit isPending={updateMutation.isPending || resetPasswordMutation.isPending}>
                {updateMutation.isPending || resetPasswordMutation.isPending
                  ? "Đang cập nhật..."
                  : "Cập nhật"}
              </form.Submit>
            </div>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClerkDialog({ clerk }: { clerk: Clerk }) {
  const [open, setOpen] = React.useState(false);
  const deleteMutation = useMutation(clerkMutations.delete());

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      params: { id: clerk.id }
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Xóa
      </DropdownMenuItem>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa kiểm phiếu viên <strong>{clerk.fullname}</strong> (
            {clerk.email})?
            <br />
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ClerkActions({ clerk }: { clerk: Clerk }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Mở menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <EditClerkDialog clerk={clerk} />
        <DeleteClerkDialog clerk={clerk} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
