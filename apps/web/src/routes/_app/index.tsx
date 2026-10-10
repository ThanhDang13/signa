import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from "@signa/react-ui/components/ui/breadcrumb";
import { Separator } from "@signa/react-ui/components/ui/separator";
import { SidebarTrigger } from "@signa/react-ui/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@signa/react-ui/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQueries } from "@signa/web/lib/tanstack/options/dashboard";
import { Badge } from "@signa/react-ui/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BarChart3,
  ScanLine,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@signa/react-ui/components/ui/button";
import { ScrollArea } from "@signa/react-ui/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@signa/react-ui/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Label } from "recharts";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(dashboardQueries.stats());
  }
});

function RouteComponent() {
  const { data: stats } = useSuspenseQuery(dashboardQueries.stats());

  const statusColors = {
    pending: "text-blue-600 bg-blue-50",
    processing: "text-yellow-600 bg-yellow-50",
    completed: "text-green-600 bg-green-50",
    failed: "text-red-600 bg-red-50"
  };

  const statusLabels = {
    pending: "đang chờ",
    processing: "đang xử lý",
    completed: "hoàn thành",
    failed: "thất bại"
  };

  // Chart configurations
  const scanTrendChartConfig = {
    count: {
      label: "Số lượng quét",
      color: "var(--chart-1)"
    }
  };

  const electionStatusChartConfig = {
    draft: {
      label: "Nháp",
      color: "var(--chart-2)"
    },
    active: {
      label: "Đang diễn ra",
      color: "var(--chart-1)"
    },
    closed: {
      label: "Đã đóng",
      color: "var(--chart-3)"
    }
  };

  const scanStatusChartConfig = {
    completed: {
      label: "Hoàn thành",
      color: "var(--chart-1)"
    },
    processing: {
      label: "Đang xử lý",
      color: "var(--chart-2)"
    },
    pending: {
      label: "Chờ xử lý",
      color: "var(--chart-4)"
    },
    failed: {
      label: "Thất bại",
      color: "var(--chart-5)"
    }
  };

  // Prepare chart data
  const scanTrendData = stats.scanTrend.map((item) => ({
    date: format(new Date(item.date), "dd/MM", { locale: vi }),
    count: item.count
  }));

  const electionStatusData = [
    { status: "draft", value: stats.elections.draft, fill: "var(--color-draft)" },
    { status: "active", value: stats.elections.active, fill: "var(--color-active)" },
    { status: "closed", value: stats.elections.closed, fill: "var(--color-closed)" }
  ].filter((item) => item.value > 0);

  const scanStatusData = [
    { status: "completed", value: stats.scans.completed, fill: "var(--color-completed)" },
    { status: "processing", value: stats.scans.processing, fill: "var(--color-processing)" },
    { status: "pending", value: stats.scans.pending, fill: "var(--color-pending)" },
    { status: "failed", value: stats.scans.failed, fill: "var(--color-failed)" }
  ].filter((item) => item.value > 0);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Bảng điều khiển</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tổng quan hệ thống</h2>
          <p className="text-muted-foreground">
            Theo dõi hoạt động và hiệu suất của hệ thống bầu cử
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Elections Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuộc bầu cử</CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.elections.total}</div>
              <p className="text-muted-foreground mt-1 text-xs">Tổng số cuộc bầu cử</p>
              <div className="mt-4 flex gap-2 text-xs">
                <Badge variant="secondary" className="gap-1">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  {stats.elections.draft}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {stats.elections.active}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Scans Today Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quét hôm nay</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scans.today}</div>
              <p className="text-muted-foreground mt-1 text-xs">Phiếu đã quét trong ngày</p>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Tổng cộng:</span>
                  <span className="font-medium">{stats.scans.total} phiếu</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scan Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trạng thái quét</CardTitle>
              <ScanLine className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Hoàn thành</span>
                  </div>
                  <span className="font-medium">{stats.scans.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Đang xử lý</span>
                  </div>
                  <span className="font-medium">{stats.scans.processing}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Thất bại</span>
                  </div>
                  <span className="font-medium">{stats.scans.failed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ballots Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phiếu bầu</CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ballots.total}</div>
              <p className="text-muted-foreground mt-1 text-xs">Tổng số phiếu bầu</p>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${stats.ballots.total > 0 ? (stats.ballots.voted / stats.ballots.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium">{stats.ballots.voted} đã bầu</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-7">
          {/* Scan Trend Chart - 4 columns */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Xu hướng quét 7 ngày qua</CardTitle>
              <CardDescription>Số lượng phiếu được quét theo ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scanTrendChartConfig} className="h-[200px] w-full">
                <AreaChart data={scanTrendData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="count"
                    type="monotone"
                    fill="url(#fillCount)"
                    fillOpacity={0.4}
                    stroke="var(--color-count)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Charts - 3 columns */}
          <div className="grid gap-4 md:col-span-3">
            {/* Election Status Pie */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Phân bổ cuộc bầu cử</CardTitle>
                <CardDescription>Theo trạng thái</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                {electionStatusData.length > 0 ? (
                  <ChartContainer
                    config={electionStatusChartConfig}
                    className="mx-auto aspect-square h-[150px]"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={electionStatusData}
                        dataKey="value"
                        nameKey="status"
                        innerRadius={40}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {stats.elections.total}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    Tổng cộng
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-muted-foreground flex h-[150px] items-center justify-center text-sm">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan Status Pie */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Phân bổ trạng thái quét</CardTitle>
                <CardDescription>Tất cả các lần quét</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                {scanStatusData.length > 0 ? (
                  <ChartContainer
                    config={scanStatusChartConfig}
                    className="mx-auto aspect-square h-[150px]"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={scanStatusData} dataKey="value" nameKey="status" innerRadius={40}>
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {stats.scans.total}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    Tổng cộng
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-muted-foreground flex h-[150px] items-center justify-center text-sm">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity and Quick Actions Row */}
        <div className="grid gap-4 md:grid-cols-7">
          {/* Recent Activity - 4 columns */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                {stats.recentActivity.length > 0
                  ? `${stats.recentActivity.length} hoạt động mới nhất`
                  : "Chưa có hoạt động nào"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="text-muted-foreground/50 mb-3 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">Chưa có hoạt động nào để hiển thị</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="hover:bg-muted/50 flex items-start gap-4 rounded-lg border p-3 transition-colors"
                      >
                        <div
                          className={`rounded-full p-2 ${statusColors[activity.status as keyof typeof statusColors] || "bg-gray-50"}`}
                        >
                          {activity.type === "scan" ? (
                            <ScanLine className="h-4 w-4" />
                          ) : activity.type === "generation" ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <BarChart3 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-none font-medium">
                            {activity.type === "scan"
                              ? `Quét phiếu bầu ${statusLabels[activity.status as keyof typeof statusLabels] || activity.status}`
                              : `Tạo phiếu bầu ${statusLabels[activity.status as keyof typeof statusLabels] || activity.status}`}
                          </p>
                          {activity.electionTitle && activity.electionId && (
                            <p className="text-muted-foreground text-sm">
                              {activity.type === "scan" ? (
                                <Link
                                  to="/elections/$id/scans/$requestId"
                                  params={{ id: activity.electionId, requestId: activity.id }}
                                  className="inline-flex items-center gap-1 hover:underline"
                                >
                                  {activity.electionTitle}
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              ) : (
                                <Link
                                  to="/elections/$id/ballots"
                                  params={{ id: activity.electionId }}
                                  className="inline-flex items-center gap-1 hover:underline"
                                >
                                  {activity.electionTitle}
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              )}
                            </p>
                          )}
                          {activity.electionTitle && !activity.electionId && (
                            <p className="text-muted-foreground text-sm">
                              {activity.electionTitle}
                            </p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            activity.status === "completed"
                              ? "default"
                              : activity.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                          className="gap-1"
                        >
                          {activity.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                          {activity.status === "processing" && <Clock className="h-3 w-3" />}
                          {activity.status === "pending" && <Clock className="h-3 w-3" />}
                          {activity.status === "failed" && <XCircle className="h-3 w-3" />}
                          {statusLabels[activity.status as keyof typeof statusLabels] || activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - 3 columns */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
              <CardDescription>Các tác vụ thường dùng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/elections">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Quản lý cuộc bầu cử
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/clerks">
                  <FileText className="mr-2 h-4 w-4" />
                  Quản lý kiểm phiếu viên
                </Link>
              </Button>

              <Separator className="my-4" />

              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Thống kê hệ thống</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tỷ lệ thành công</span>
                      <span className="font-medium">
                        {stats.scans.total > 0
                          ? Math.round((stats.scans.completed / stats.scans.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Đang chờ xử lý</span>
                      <span className="font-medium">{stats.scans.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cuộc bầu cử đóng</span>
                      <span className="font-medium">{stats.elections.closed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
