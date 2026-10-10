import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { electionQueries } from "@signa/web/lib/tanstack/options/election";
import { ballotQueries } from "@signa/web/lib/tanstack/options/ballot";
import { DataTable } from "@signa/web/components/table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@signa/react-ui/components/ui/button";
import { Badge } from "@signa/react-ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@signa/react-ui/components/ui/breadcrumb";
import { Separator } from "@signa/react-ui/components/ui/separator";
import { SidebarTrigger } from "@signa/react-ui/components/ui/sidebar";
import * as React from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, Eye } from "lucide-react";

export const Route = createFileRoute("/_app/elections/$id/scans")({
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(
        electionQueries.detail({
          params: { id: params.id }
        })
      ),
      queryClient.ensureQueryData(
        ballotQueries.adminListScanRequests({
          query: { electionId: params.id, pageIndex: 0, pageSize: 50 }
        })
      )
    ]),
  component: ScansPage
});

function ScansPage() {
  const { id: electionId } = Route.useParams();

  const { data: election } = useSuspenseQuery(
    electionQueries.detail({
      params: { id: electionId }
    })
  );

  const { data: scansData } = useSuspenseQuery(
    ballotQueries.adminListScanRequests({
      query: { electionId, pageIndex: 0, pageSize: 50 }
    })
  );

  const scans = scansData?.data || [];

  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Array<{ id: string; value: unknown }>>(
    []
  );

  type ScanRequest = {
    requestId: string;
    ballotId: string;
    electionId: string;
    userId: string;
    status: string;
    validationStatus: string | null;
    qrVerified: boolean | null;
    createdAt: string;
    processedAt: string | null;
  };

  const columns: ColumnDef<ScanRequest>[] = [
    {
      accessorKey: "createdAt",
      header: "Thời gian quét",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div>{new Date(date).toLocaleString("vi-VN")}</div>;
      }
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <StatusBadge status={status} />;
      }
    },
    {
      accessorKey: "validationStatus",
      header: "Kết quả",
      cell: ({ row }) => {
        const validationStatus = row.getValue("validationStatus") as string | null;
        if (!validationStatus) return <span className="text-muted-foreground">—</span>;
        return <ValidationBadge status={validationStatus} />;
      }
    },
    {
      accessorKey: "qrVerified",
      header: "QR Code",
      cell: ({ row }) => {
        const qrVerified = row.getValue("qrVerified") as boolean | null;
        if (qrVerified === null) return <span className="text-muted-foreground">—</span>;
        return qrVerified ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        );
      }
    },
    {
      accessorKey: "processedAt",
      header: "Xử lý xong",
      cell: ({ row }) => {
        const date = row.getValue("processedAt") as string | null;
        return <div>{date ? new Date(date).toLocaleString("vi-VN") : "—"}</div>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" asChild>
          <Link
            to="/elections/$id/scans/$requestId"
            params={{ id: electionId, requestId: row.original.requestId }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Chi tiết
          </Link>
        </Button>
      )
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
              <BreadcrumbLink asChild>
                <Link to="/elections">Quản lý cuộc bầu cử</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Quản lý quét phiếu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý quét phiếu</h1>
          <p className="text-muted-foreground">{election.title}</p>
        </div>

        <DataTable
          columns={columns}
          data={scans}
          pageCount={Math.ceil(scans.length / pagination.pageSize)}
          rowCount={scans.length}
          isLoading={false}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Đang chờ",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      variant: "secondary" as const
    },
    processing: {
      icon: AlertCircle,
      label: "Đang xử lý",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      variant: "default" as const
    },
    completed: {
      icon: CheckCircle2,
      label: "Hoàn thành",
      color: "text-green-600",
      bgColor: "bg-green-50",
      variant: "default" as const
    },
    failed: {
      icon: XCircle,
      label: "Thất bại",
      color: "text-red-600",
      bgColor: "bg-red-50",
      variant: "destructive" as const
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.bgColor} ${config.color}`}>
      <StatusIcon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function ValidationBadge({ status }: { status: string }) {
  const statusConfig = {
    valid: {
      label: "Hợp lệ",
      variant: "default" as const,
      className: "bg-green-50 text-green-600"
    },
    invalid_markers: {
      label: "Lỗi marker",
      variant: "destructive" as const,
      className: "bg-red-50 text-red-600"
    },
    invalid_qr: {
      label: "Lỗi QR",
      variant: "destructive" as const,
      className: "bg-red-50 text-red-600"
    },
    invalid_selections: {
      label: "Lỗi lựa chọn",
      variant: "destructive" as const,
      className: "bg-red-50 text-red-600"
    },
    invalid_confidence: {
      label: "Độ tin cậy thấp",
      variant: "secondary" as const,
      className: "bg-orange-50 text-orange-600"
    },
    rejected_election_closed: {
      label: "Cuộc bầu đã đóng",
      variant: "secondary" as const,
      className: "bg-gray-50 text-gray-600"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
    className: ""
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
