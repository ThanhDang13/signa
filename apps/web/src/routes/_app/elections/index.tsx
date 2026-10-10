import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Play,
  Square,
  Pencil,
  BarChart3,
  X,
  FileText,
  Edit,
  ScanLine
} from "lucide-react";
import * as React from "react";
import { z } from "zod";
import { Link } from "@tanstack/react-router";

import { useAppForm } from "@signa/web/components/form/hooks/use-app-form";
import { DataTable } from "@signa/web/components/table/data-table";
import { electionMutations, electionQueries } from "@signa/web/lib/tanstack/options/election";
import { Button } from "@signa/react-ui/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from "@signa/react-ui/components/ui/breadcrumb";
import { Separator } from "@signa/react-ui/components/ui/separator";
import { SidebarTrigger } from "@signa/react-ui/components/ui/sidebar";
import { ScrollArea } from "@signa/react-ui/components/ui/scroll-area";
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
import { Badge } from "@signa/react-ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@signa/react-ui/components/ui/select";

export const Route = createFileRoute("/_app/elections/")({
  component: RouteComponent
});

type Election = {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "active" | "closed" | "archived";
  startDate?: string;
  endDate?: string;
  maxVoters?: number;
  createdAt: string;
  updatedAt: string;
};

// For MVP: simple form without formStructure (will add form builder later)
const electionFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  maxVoters: z.coerce.number().int().positive().optional()
});

type ElectionFormValues = z.input<typeof electionFormSchema>;

function RouteComponent() {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Array<{ id: string; value: unknown }>>(
    []
  );

  const sortBy = sorting[0]?.id || "createdAt";
  const order = sorting[0]?.desc ? "desc" : "asc";

  // Extract status filter from columnFilters
  const statusFilter = React.useMemo(() => {
    const filter = columnFilters.find((f) => f.id === "status");
    return filter?.value as Election["status"] | undefined;
  }, [columnFilters]);

  // Extract search query from columnFilters
  const searchQuery = React.useMemo(() => {
    const filter = columnFilters.find((f) => f.id === "title");
    return (filter?.value as string) || "";
  }, [columnFilters]);

  const { data, isLoading } = useQuery(
    electionQueries.list({
      query: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: sortBy as "title" | "status" | "startDate" | "createdAt",
        order,
        status: statusFilter
      }
    })
  );

  // Client-side search filter (if backend doesn't support search)
  const filteredData = React.useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery) return data.data;

    const query = searchQuery.toLowerCase();
    return data.data.filter(
      (election) =>
        election.title.toLowerCase().includes(query) ||
        election.description?.toLowerCase().includes(query)
    );
  }, [data?.data, searchQuery]);

  const columns: ColumnDef<Election>[] = [
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as Election["status"];
        return <StatusBadge status={status} />;
      }
    },
    {
      accessorKey: "maxVoters",
      header: "Số phiếu tối đa",
      cell: ({ row }) => {
        const maxVoters = row.getValue("maxVoters") as number | undefined;
        return <div>{maxVoters ?? "—"}</div>;
      }
    },
    {
      accessorKey: "startDate",
      header: "Ngày bắt đầu",
      cell: ({ row }) => {
        const date = row.getValue("startDate") as string | undefined;
        return <div>{date ? new Date(date).toLocaleDateString("vi-VN") : "—"}</div>;
      }
    },
    {
      accessorKey: "endDate",
      header: "Ngày kết thúc",
      cell: ({ row }) => {
        const date = row.getValue("endDate") as string | undefined;
        return <div>{date ? new Date(date).toLocaleDateString("vi-VN") : "—"}</div>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => <ElectionActions election={row.original} />
    }
  ];

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Quản lý cuộc bầu cử</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <ScrollArea className="h-full flex-1">
        <div className="p-4">
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
                id: "title",
                title: "Tìm kiếm theo tiêu đề hoặc mô tả"
              }
            ]}
            toolbarActions={
              <>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    const newFilters = columnFilters.filter((f) => f.id !== "status");
                    if (value !== "all") {
                      newFilters.push({ id: "status", value });
                    }
                    setColumnFilters(newFilters);
                  }}
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="active">Đang diễn ra</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                    <SelectItem value="archived">Đã lưu trữ</SelectItem>
                  </SelectContent>
                </Select>
                <CreateElectionDialog />
              </>
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusBadge({ status }: { status: Election["status"] }) {
  const variants = {
    draft: { label: "Nháp", variant: "secondary" as const },
    active: { label: "Đang diễn ra", variant: "default" as const },
    closed: { label: "Đã đóng", variant: "outline" as const },
    archived: { label: "Đã lưu trữ", variant: "outline" as const }
  };

  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function CreateElectionDialog() {
  const [open, setOpen] = React.useState(false);
  const createMutation = useMutation(electionMutations.create());

  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      maxVoters: undefined
    } satisfies ElectionFormValues as ElectionFormValues,
    validators: {
      onSubmit: electionFormSchema
    },
    onSubmit: async ({ value }) => {
      // TODO: Add formStructure when form builder is ready
      // For now, create with minimal structure
      await createMutation.mutateAsync({
        body: {
          ...value,
          formStructure: {
            title: value.title,
            description: value.description,
            fields: [],
            layout: {
              pageWidth: 210,
              pageHeight: 297,
              margins: { top: 20, right: 20, bottom: 20, left: 20 }
            }
          }
        }
      });
      setOpen(false);
      form.reset();
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tạo cuộc bầu cử</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo cuộc bầu cử mới</DialogTitle>
          <DialogDescription>Thêm một cuộc bầu cử mới vào hệ thống</DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="title">
              {(field) => <field.Input label="Tiêu đề" placeholder="Bầu cử đại biểu 2026" />}
            </form.AppField>

            <form.AppField name="description">
              {(field) => (
                <field.Textarea label="Mô tả (tùy chọn)" placeholder="Mô tả về cuộc bầu cử" />
              )}
            </form.AppField>

            <form.AppField name="startDate">
              {(field) => <field.DatePicker label="Ngày bắt đầu (tùy chọn)" />}
            </form.AppField>

            <form.AppField name="endDate">
              {(field) => <field.DatePicker label="Ngày kết thúc (tùy chọn)" />}
            </form.AppField>

            <form.AppField name="maxVoters">
              {(field) => (
                <field.Input label="Số lượng cử tri tối đa (tùy chọn)" placeholder="1000" />
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

function EditElectionDialog({ election }: { election: Election }) {
  const [open, setOpen] = React.useState(false);
  const updateMutation = useMutation(electionMutations.update());

  const form = useAppForm({
    defaultValues: {
      title: election.title,
      description: election.description || "",
      startDate: election.startDate,
      endDate: election.endDate,
      maxVoters: election.maxVoters
    } satisfies ElectionFormValues as ElectionFormValues,
    validators: {
      onSubmit: electionFormSchema
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        params: { id: election.id },
        body: value
      });
      setOpen(false);
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setOpen(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Chỉnh sửa
      </DropdownMenuItem>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chỉnh sửa cuộc bầu cử</AlertDialogTitle>
          <AlertDialogDescription>
            Cập nhật thông tin cuộc bầu cử <strong>{election.title}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="title">
              {(field) => <field.Input label="Tiêu đề" placeholder="Bầu cử đại biểu 2026" />}
            </form.AppField>

            <form.AppField name="description">
              {(field) => (
                <field.Textarea label="Mô tả (tùy chọn)" placeholder="Mô tả về cuộc bầu cử" />
              )}
            </form.AppField>

            <form.AppField name="startDate">
              {(field) => <field.DatePicker label="Ngày bắt đầu (tùy chọn)" />}
            </form.AppField>

            <form.AppField name="endDate">
              {(field) => <field.DatePicker label="Ngày kết thúc (tùy chọn)" />}
            </form.AppField>

            <form.AppField name="maxVoters">
              {(field) => (
                <field.Input label="Số lượng cử tri tối đa (tùy chọn)" placeholder="1000" />
              )}
            </form.AppField>

            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <form.Submit isPending={updateMutation.isPending}>
                {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </form.Submit>
            </AlertDialogFooter>
          </form.Form>
        </form.AppForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActivateElectionDialog({ election }: { election: Election }) {
  const [open, setOpen] = React.useState(false);
  const activateMutation = useMutation(electionMutations.activate());

  const handleActivate = async () => {
    await activateMutation.mutateAsync({
      params: { id: election.id }
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setOpen(true)}>
        <Play className="mr-2 h-4 w-4" />
        Kích hoạt
      </DropdownMenuItem>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận kích hoạt</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn kích hoạt cuộc bầu cử <strong>{election.title}</strong>?
            <br />
            Cuộc bầu cử sẽ chuyển sang trạng thái đang diễn ra.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleActivate} disabled={activateMutation.isPending}>
            {activateMutation.isPending ? "Đang kích hoạt..." : "Kích hoạt"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CloseElectionDialog({ election }: { election: Election }) {
  const [open, setOpen] = React.useState(false);
  const closeMutation = useMutation(electionMutations.close());

  const handleClose = async () => {
    await closeMutation.mutateAsync({
      params: { id: election.id }
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setOpen(true)}>
        <Square className="mr-2 h-4 w-4" />
        Đóng
      </DropdownMenuItem>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận đóng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn đóng cuộc bầu cử <strong>{election.title}</strong>?
            <br />
            Cuộc bầu cử sẽ không thể nhận thêm phiếu bầu mới.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleClose} disabled={closeMutation.isPending}>
            {closeMutation.isPending ? "Đang đóng..." : "Đóng"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteElectionDialog({ election }: { election: Election }) {
  const [open, setOpen] = React.useState(false);
  const deleteMutation = useMutation(electionMutations.delete());

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      params: { id: election.id }
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
            Bạn có chắc chắn muốn xóa cuộc bầu cử <strong>{election.title}</strong>?
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

function ElectionActions({ election }: { election: Election }) {
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
        {election.status === "draft" && (
          <>
            <EditElectionDialog election={election} />
            <DropdownMenuItem asChild>
              <Link to="/elections/$id/builder" params={{ id: election.id }}>
                <Pencil className="mr-2 h-4 w-4" />
                Thiết kế phiếu bầu
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {election.status === "active" && (
          <DropdownMenuItem asChild>
            <Link to="/elections/$id/ballots" params={{ id: election.id }}>
              <FileText className="mr-2 h-4 w-4" />
              Quản lý phiếu bầu
            </Link>
          </DropdownMenuItem>
        )}
        {election.status === "active" && (
          <DropdownMenuItem asChild>
            <Link to="/elections/$id/scans" params={{ id: election.id }}>
              <ScanLine className="mr-2 h-4 w-4" />
              Quản lý quét phiếu
            </Link>
          </DropdownMenuItem>
        )}
        {election.status === "closed" && (
          <DropdownMenuItem asChild>
            <Link to="/elections/$id/scans" params={{ id: election.id }}>
              <ScanLine className="mr-2 h-4 w-4" />
              Xem lịch sử quét
            </Link>
          </DropdownMenuItem>
        )}
        {(election.status === "active" || election.status === "closed") && (
          <DropdownMenuItem asChild>
            <Link to="/elections/$id/results" params={{ id: election.id }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Xem kết quả
            </Link>
          </DropdownMenuItem>
        )}
        {election.status === "draft" && <ActivateElectionDialog election={election} />}
        {election.status === "active" && <CloseElectionDialog election={election} />}
        {election.status === "draft" && <DeleteElectionDialog election={election} />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
