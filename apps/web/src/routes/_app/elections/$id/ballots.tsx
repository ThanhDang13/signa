import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { electionQueries } from "@signa/web/lib/tanstack/options/election";
import { ballotQueries } from "@signa/web/lib/tanstack/options/ballot";
import { DataTable } from "@signa/web/components/table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@signa/react-ui/components/ui/button";
import { Badge } from "@signa/react-ui/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@signa/react-ui/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@signa/react-ui/components/ui/dialog";
import { Input } from "@signa/react-ui/components/ui/input";
import { Label } from "@signa/react-ui/components/ui/label";
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
import { useState, useEffect } from "react";
import { FileText, Download, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { generateBallotsContract } from "@signa/contracts-http/ballot";
import { generateBallotsFn } from "@signa/web/lib/api/ballot/ballot";
import { CallOptions } from "@signa/dsl-http-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/elections/$id/ballots")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      electionQueries.detail({
        params: { id: params.id }
      })
    ),
  component: BallotsPage
});

function BallotsPage() {
  const { id: electionId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: election } = useSuspenseQuery(
    electionQueries.detail({
      params: { id: electionId }
    })
  );

  const { data: batchesData } = useSuspenseQuery(
    ballotQueries.listBatches({
      params: { electionId },
      query: { pageIndex: 0, pageSize: 50 }
    })
  );

  const batches = batchesData?.data || [];
  const pendingOrProcessingBatches = batches.filter(
    (b) => b.status === "pending" || b.status === "processing"
  );

  // Poll for pending/processing batches every 3 seconds
  useEffect(() => {
    if (pendingOrProcessingBatches.length === 0) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ballotQueries.listBatches({
          params: { electionId },
          query: { pageIndex: 0, pageSize: 50 }
        }).queryKey
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingOrProcessingBatches.length, electionId, queryClient]);

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
              <BreadcrumbPage>Quản lý phiếu bầu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý phiếu bầu</h1>
            <p className="text-muted-foreground">{election.title}</p>
            {election.maxVoters && (
              <p className="text-muted-foreground mt-1 text-sm">
                {election.remainingBallots !== null && election.remainingBallots !== undefined ? (
                  <>
                    Còn lại: <span className="font-medium">{election.remainingBallots}</span> /{" "}
                    {election.maxVoters} phiếu
                  </>
                ) : (
                  <>Giới hạn: {election.maxVoters} phiếu</>
                )}
              </p>
            )}
          </div>
          <GenerateBallotsDialog
            electionId={electionId}
            remainingBallots={election.remainingBallots}
          />
        </div>

        <BatchesTab batches={batches} />
      </div>
    </div>
  );
}

type BallotBatch = {
  id: string;
  electionId: string;
  count: number;
  status: "pending" | "processing" | "completed" | "failed";
  batchPdfS3Key?: string;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
};

function BatchesTab({ batches }: { batches: any[] }) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Array<{ id: string; value: unknown }>>(
    []
  );

  const columns: ColumnDef<BallotBatch>[] = [
    {
      accessorKey: "createdAt",
      header: "Thời gian tạo",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div>{new Date(date).toLocaleString("vi-VN")}</div>;
      }
    },
    {
      accessorKey: "count",
      header: "Số lượng",
      cell: ({ row }) => <div className="font-medium">{row.getValue("count")}</div>
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as BallotBatch["status"];
        return <StatusBadge status={status} />;
      }
    },
    {
      accessorKey: "processedAt",
      header: "Xử lý xong",
      cell: ({ row }) => {
        const date = row.getValue("processedAt") as string | undefined;
        return <div>{date ? new Date(date).toLocaleString("vi-VN") : "—"}</div>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => <BatchActions batch={row.original} />
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={batches}
      pageCount={Math.ceil(batches.length / pagination.pageSize)}
      rowCount={batches.length}
      isLoading={false}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
    />
  );
}

function StatusBadge({ status }: { status: BallotBatch["status"] }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Đang chờ",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      variant: "secondary" as const
    },
    processing: {
      icon: Loader2,
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
      icon: AlertCircle,
      label: "Thất bại",
      color: "text-red-600",
      bgColor: "bg-red-50",
      variant: "destructive" as const
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.bgColor} ${config.color}`}>
      <StatusIcon className={`mr-1 h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}

function BatchActions({ batch }: { batch: BallotBatch }) {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!batch.batchPdfS3Key) return;

    setIsDownloading(true);
    try {
      const result = await queryClient.fetchQuery(
        ballotQueries.getBatchDownload({
          params: { batchId: batch.id }
        })
      );

      window.open(result.downloadUrl, "_blank");
      toast.success("Đã tạo link tải xuống");
    } catch (error) {
      toast.error("Không thể tạo link tải xuống");
    } finally {
      setIsDownloading(false);
    }
  };

  if (batch.status === "completed" && batch.batchPdfS3Key) {
    return (
      <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Tải xuống
      </Button>
    );
  }

  if (batch.status === "failed" && batch.lastError) {
    return (
      <div className="text-destructive max-w-xs truncate text-sm" title={batch.lastError}>
        {batch.lastError}
      </div>
    );
  }

  return <div className="text-muted-foreground text-sm">—</div>;
}

function GenerateBallotsDialog({
  electionId,
  remainingBallots
}: {
  electionId: string;
  remainingBallots: number | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState("");
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: (options: CallOptions<typeof generateBallotsContract>) =>
      generateBallotsFn({ data: options }),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu tạo phiếu bầu");
      setOpen(false);
      setCount("");
      queryClient.invalidateQueries({
        queryKey: ballotQueries.listBatches({
          params: { electionId },
          query: { pageIndex: 1, pageSize: 50 }
        }).queryKey
      });
      // Invalidate election detail to refresh remainingBallots
      queryClient.invalidateQueries({
        queryKey: electionQueries.detail({ params: { id: electionId } }).queryKey
      });
    },
    onError: () => {
      toast.error("Không thể tạo phiếu bầu. Vui lòng thử lại.");
    }
  });

  const handleGenerate = () => {
    const countNum = parseInt(count);
    if (!countNum || countNum < 1 || countNum > 10000) {
      toast.error("Số lượng phải từ 1 đến 10,000");
      return;
    }

    if (
      remainingBallots !== null &&
      remainingBallots !== undefined &&
      countNum > remainingBallots
    ) {
      toast.error(`Chỉ có thể tạo tối đa ${remainingBallots} phiếu`);
      return;
    }

    generateMutation.mutate({
      body: { electionId: electionId, count: countNum }
    });
  };

  const maxAllowed =
    remainingBallots !== null && remainingBallots !== undefined
      ? Math.min(remainingBallots, 10000)
      : 10000;

  const isAtLimit =
    remainingBallots !== null && remainingBallots !== undefined && remainingBallots === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isAtLimit}>
          <FileText className="mr-2 h-4 w-4" />
          Tạo phiếu bầu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo phiếu bầu mới</DialogTitle>
          <DialogDescription>
            Nhập số lượng phiếu bầu cần tạo. Quá trình tạo phiếu sẽ được xử lý trong nền.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="count">Số lượng phiếu</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max={maxAllowed}
              placeholder={`Nhập số lượng (1-${maxAllowed.toLocaleString()})`}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            {remainingBallots !== null && remainingBallots !== undefined ? (
              <p className="text-muted-foreground text-sm">
                Còn lại {remainingBallots.toLocaleString()} phiếu có thể tạo
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Mỗi phiếu sẽ có mã QR và chữ ký riêng biệt
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo phiếu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Ballot = {
  id: string;
  electionId: string;
  signature: {
    signature: string;
    timestamp: string;
  };
  qrCodeData: string;
  status: "pending" | "voted";
  pdfS3Key?: string;
  layoutMetadata: {
    pageWidth: number;
    pageHeight: number;
    markers: any;
    qrCode: any;
    fields: any[];
  };
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
};

function BallotsTab({ electionId }: { electionId: string }) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Array<{ id: string; value: unknown }>>(
    []
  );

  const sortBy = sorting[0]?.id || "createdAt";
  const order = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading } = useSuspenseQuery(
    ballotQueries.list({
      query: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: sortBy as "generatedAt" | "status" | "createdAt",
        order,
        electionId
      }
    })
  );

  const columns: ColumnDef<Ballot>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return <div className="font-mono text-xs">{id.slice(0, 8)}...</div>;
      }
    },
    {
      accessorKey: "generatedAt",
      header: "Thời gian tạo",
      cell: ({ row }) => {
        const date = row.getValue("generatedAt") as string;
        return <div>{new Date(date).toLocaleString("vi-VN")}</div>;
      }
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as Ballot["status"];
        return <BallotStatusBadge status={status} />;
      }
    },
    {
      accessorKey: "signature",
      header: "Chữ ký",
      cell: ({ row }) => {
        const signature = row.getValue("signature") as Ballot["signature"];
        return <div className="font-mono text-xs">{signature.signature.slice(0, 12)}...</div>;
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      pageCount={data?.meta.totalPages || 0}
      rowCount={data?.meta.totalCount}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      sorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
    />
  );
}

function BallotStatusBadge({ status }: { status: Ballot["status"] }) {
  const statusConfig = {
    pending: {
      label: "Chưa bầu",
      variant: "secondary" as const
    },
    voted: {
      label: "Đã bầu",
      variant: "default" as const
    }
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
