import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ballotQueries } from "@signa/web/lib/tanstack/options/ballot";
import { electionQueries } from "@signa/web/lib/tanstack/options/election";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@signa/react-ui/components/ui/card";
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
import { CheckCircle2, XCircle, Clock, AlertCircle, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_app/elections/$id/_s/scans/$requestId")({
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(
        electionQueries.detail({
          params: { id: params.id }
        })
      ),
      queryClient.ensureQueryData(
        ballotQueries.getScanRequest({
          params: { requestId: params.requestId }
        })
      )
    ]),
  component: ScanDetailPage
});

function ScanDetailPage() {
  const { id: electionId, requestId } = Route.useParams();

  const { data: election } = useSuspenseQuery(
    electionQueries.detail({
      params: { id: electionId }
    })
  );

  const { data: scanRequest } = useSuspenseQuery(
    ballotQueries.getScanRequest({
      params: { requestId }
    })
  );

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
              <BreadcrumbLink asChild>
                <Link to="/elections/$id/scans" params={{ id: electionId }}>
                  Quản lý quét phiếu
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chi tiết quét</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Chi tiết yêu cầu quét</h1>
          <p className="text-muted-foreground">{election.title}</p>
        </div>

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trạng thái xử lý</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBadge status={scanRequest.status} />
            </CardContent>
          </Card>

          {scanRequest.result && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Kết quả xác thực</CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidationBadge status={scanRequest.result.validationStatus} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Xác thực QR Code</CardDescription>
                </CardHeader>
                <CardContent>
                  {scanRequest.result.qrVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Hợp lệ</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Không hợp lệ</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Scanned Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Hình ảnh phiếu bầu đã quét
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={scanRequest.s3Url}
                alt="Scanned ballot"
                className="h-auto w-full max-w-2xl mx-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Metadata */}
        {scanRequest.result && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Điểm chuẩn được phát hiện:</span>
                <span className="font-medium">
                  {scanRequest.result.processingMetadata.markersDetected ? "Có" : "Không"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Căn chỉnh được áp dụng:</span>
                <span className="font-medium">
                  {scanRequest.result.processingMetadata.alignmentApplied ? "Có" : "Không"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thời gian xử lý:</span>
                <span className="font-medium">
                  {new Date(scanRequest.result.processedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selections */}
        {scanRequest.result && scanRequest.result.selections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lựa chọn đã quét</CardTitle>
              <CardDescription>
                Các lựa chọn được phát hiện từ phiếu bầu với độ tin cậy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanRequest.result.selections.map((selection, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">Trường {index + 1}</span>
                      <Badge variant="outline">
                        Độ tin cậy: {(selection.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Giá trị: </span>
                      <span className="font-medium">{selection.selectedValues.join(", ")}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">Field ID: </span>
                      <code className="text-xs">{selection.fieldId}</code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Request ID:</span>
              <code className="text-xs">{scanRequest.requestId}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ballot ID:</span>
              <code className="text-xs">{scanRequest.ballotId}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời gian tạo:</span>
              <span className="font-medium">
                {new Date(scanRequest.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            {scanRequest.processedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thời gian hoàn thành:</span>
                <span className="font-medium">
                  {new Date(scanRequest.processedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
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
      <StatusIcon className="mr-1 h-4 w-4" />
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
