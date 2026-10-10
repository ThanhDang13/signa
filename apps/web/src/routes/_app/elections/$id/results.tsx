import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { electionQueries } from "@signa/web/lib/tanstack/options/election";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@signa/react-ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@signa/react-ui/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ChartConfig } from "@signa/react-ui/components/ui/chart";
import { Input } from "@signa/react-ui/components/ui/input";
import { Button } from "@signa/react-ui/components/ui/button";
import { Badge } from "@signa/react-ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@signa/react-ui/components/ui/select";
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
import { ScrollArea } from "@signa/react-ui/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";

export const Route = createFileRoute("/_app/elections/$id/results")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      electionQueries.results({
        params: { id: params.id }
      })
    ),
  component: ElectionResultsPage
});

function ElectionResultsPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(
    electionQueries.results({
      params: { id }
    })
  );

  const { statistics, fields } = data;

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldTypeFilter, setFieldTypeFilter] = useState<"all" | "checkbox" | "radio">("all");
  const [minVoteThreshold, setMinVoteThreshold] = useState(0);

  // Calculate completion percentage
  const completionRate =
    statistics.totalBallots > 0
      ? ((statistics.scannedBallots / statistics.totalBallots) * 100).toFixed(1)
      : "0.0";

  const validRate =
    statistics.scannedBallots > 0
      ? ((statistics.validScans / statistics.scannedBallots) * 100).toFixed(1)
      : "0.0";

  // Filtered fields
  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      // Search filter
      if (searchQuery && !field.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Field type filter
      if (fieldTypeFilter !== "all" && field.type !== fieldTypeFilter) {
        return false;
      }

      // Vote threshold filter
      if (minVoteThreshold > 0 && field.totalVotes < minVoteThreshold) {
        return false;
      }

      return true;
    });
  }, [fields, searchQuery, fieldTypeFilter, minVoteThreshold]);

  const hasActiveFilters = searchQuery || fieldTypeFilter !== "all" || minVoteThreshold > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setFieldTypeFilter("all");
    setMinVoteThreshold(0);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
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
              <BreadcrumbPage>Kết quả bầu cử</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <ScrollArea className="h-full flex-1">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Kết quả bầu cử</h1>
            <p className="text-muted-foreground">Thống kê và kết quả chi tiết</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tổng số phiếu</CardDescription>
                <CardTitle className="text-3xl">{statistics.totalBallots}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">Đã tạo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Đã quét</CardDescription>
                <CardTitle className="text-3xl">{statistics.scannedBallots}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">{completionRate}% hoàn thành</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Hợp lệ</CardDescription>
                <CardTitle className="text-3xl text-green-600">{statistics.validScans}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">{validRate}% phiếu quét</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Không hợp lệ</CardDescription>
                <CardTitle className="text-3xl text-red-600">{statistics.invalidScans}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">Cần kiểm tra</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Chưa quét</CardDescription>
                <CardTitle className="text-3xl">{statistics.pendingBallots}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">Đang chờ</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle className="text-lg">Bộ lọc</CardTitle>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Search */}
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Tìm kiếm hạng mục..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Field Type Filter */}
                <Select
                  value={fieldTypeFilter}
                  onValueChange={(value: any) => setFieldTypeFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Loại hạng mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="radio">Một lựa chọn</SelectItem>
                    <SelectItem value="checkbox">Nhiều lựa chọn</SelectItem>
                  </SelectContent>
                </Select>

                {/* Vote Threshold */}
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-sm whitespace-nowrap">
                    Tối thiểu:
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minVoteThreshold || ""}
                    onChange={(e) => setMinVoteThreshold(Number(e.target.value) || 0)}
                    className="w-full"
                  />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">phiếu</span>
                </div>
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Hiển thị {filteredFields.length} / {fields.length} hạng mục
                  </span>
                  {filteredFields.length === 0 && (
                    <Badge variant="secondary">Không tìm thấy kết quả</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Results */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Kết quả theo hạng mục</h2>

            {filteredFields.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Không có hạng mục nào phù hợp với bộ lọc</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFields.map((field) => {
                // Prepare chart data
                const chartData = field.results.map((result) => ({
                  option: result.option,
                  count: result.count,
                  percentage: result.percentage
                }));

                // Chart config
                const chartConfig: ChartConfig = {
                  count: {
                    label: "Số lượt chọn",
                    color: "var(--chart-2)"
                  }
                };

                return (
                  <Card key={field.fieldId}>
                    <CardHeader>
                      <CardTitle>{field.label}</CardTitle>
                      <CardDescription>
                        Loại: {field.type === "checkbox" ? "Nhiều lựa chọn" : "Một lựa chọn"} • Tổng
                        số lượt chọn: {field.totalVotes}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Chart */}
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="option"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                        </BarChart>
                      </ChartContainer>

                      {/* Table */}
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="p-2 text-left font-medium">Lựa chọn</th>
                              <th className="p-2 text-right font-medium">Số phiếu</th>
                              <th className="p-2 text-right font-medium">Phần trăm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {field.results.map((result) => (
                              <tr key={result.option} className="border-b last:border-0">
                                <td className="p-2">{result.option}</td>
                                <td className="p-2 text-right font-medium">{result.count}</td>
                                <td className="text-muted-foreground p-2 text-right">
                                  {result.percentage.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
