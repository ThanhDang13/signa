import { createFileRoute } from "@tanstack/react-router";
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

  // Calculate completion percentage
  const completionRate =
    statistics.totalBallots > 0
      ? ((statistics.scannedBallots / statistics.totalBallots) * 100).toFixed(1)
      : "0.0";

  const validRate =
    statistics.scannedBallots > 0
      ? ((statistics.validScans / statistics.scannedBallots) * 100).toFixed(1)
      : "0.0";

  return (
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

      {/* Field Results */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Kết quả theo câu hỏi</h2>

        {fields.map((field) => {
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
              color: "hsl(var(--chart-1))"
            }
          };

          return (
            <Card key={field.fieldId}>
              <CardHeader>
                <CardTitle>{field.label}</CardTitle>
                <CardDescription>
                  Loại: {field.type === "checkbox" ? "Nhiều lựa chọn" : "Một lựa chọn"} • Tổng số
                  lượt chọn: {field.totalVotes}
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
        })}
      </div>
    </div>
  );
}
