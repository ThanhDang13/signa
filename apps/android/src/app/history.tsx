import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ScanLine, Settings, Filter } from "lucide-react-native";

import { Button } from "@signa/android/components/ui/button";
import { Icon } from "@signa/android/components/ui/icon";
import { Text } from "@signa/android/components/ui/text";
import { ballotKeys, ballotQueries, FilterType } from "@signa/android/lib/tanstack/options/ballot";

const PAGE_SIZE = 20;

type ScanRequest = {
  requestId: string;
  status: string;
  validationStatus:
    "valid" | "invalid_markers" | "invalid_qr" | "invalid_selections" | "invalid_confidence" | null;
  processedAt: string | null;
};

type RequestState = {
  label: string;
  dotColor: "bg-amber-500" | "bg-destructive" | "bg-emerald-600";
  badgeClassName: string;
  badgeTextClassName: string;
};

function ticketId(requestId: string) {
  // Use last 8 chars (more entropy) instead of first 4 (timestamp in UUIDv7)
  return `#${requestId.slice(-8).toUpperCase()}`;
}

function requestState(request: ScanRequest): RequestState {
  if (request.status === "pending") {
    return {
      label: "Chờ xử lý",
      dotColor: "bg-amber-500",
      badgeClassName: "bg-amber-500/15",
      badgeTextClassName: "text-amber-700 dark:text-amber-400"
    };
  }
  if (request.status === "processing") {
    return {
      label: "Đang xử lý",
      dotColor: "bg-amber-500",
      badgeClassName: "bg-amber-500/15",
      badgeTextClassName: "text-amber-700 dark:text-amber-400"
    };
  }
  if (request.status === "failed") {
    return {
      label: "Không thành công",
      dotColor: "bg-destructive",
      badgeClassName: "bg-destructive/10",
      badgeTextClassName: "text-destructive"
    };
  }
  if (request.validationStatus === "valid") {
    return {
      label: "Đã xử lý",
      dotColor: "bg-emerald-600",
      badgeClassName: "bg-emerald-600/10",
      badgeTextClassName: "text-emerald-700 dark:text-emerald-400"
    };
  }

  // Handle null validationStatus for pending/processing
  if (!request.validationStatus) {
    return {
      label: "Đang chờ",
      dotColor: "bg-amber-500",
      badgeClassName: "bg-amber-500/15",
      badgeTextClassName: "text-amber-700 dark:text-amber-400"
    };
  }

  const labels = {
    invalid_markers: "Lỗi điểm chuẩn",
    invalid_qr: "Lỗi mã QR",
    invalid_selections: "Lỗi lựa chọn",
    invalid_confidence: "Độ chính xác thấp"
  } as const;

  return {
    label: labels[request.validationStatus],
    dotColor: "bg-destructive",
    badgeClassName: "bg-destructive/10",
    badgeTextClassName: "text-destructive"
  };
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "Đang xử lý";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getFilterLabel(filter: FilterType) {
  switch (filter) {
    case "all":
      return "Tất cả";
    case "valid":
      return "Thành công";
    case "invalid":
      return "Cần xử lý";
    case "pending":
      return "Chờ xử lý";
    case "processing":
      return "Đang xử lý";
    default:
      return "Tất cả";
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<FilterType>((filterParam as FilterType) ?? "all");
  const [pageIndex, setPageIndex] = useState(0);
  const [requests, setRequests] = useState<ScanRequest[]>([]);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    ballotQueries.listScanRequests(pageIndex, PAGE_SIZE, filter)
  );

  useEffect(() => {
    if (!data) return;

    // Apply client-side filtering based on validationStatus
    const filteredItems = data.items.filter((request) => {
      if (filter === "all") return true;
      if (filter === "pending") return request.status === "pending";
      if (filter === "processing") return request.status === "processing";
      if (filter === "valid") {
        return request.status === "completed" && request.validationStatus === "valid";
      }
      if (filter === "invalid") {
        return (
          request.status === "failed" ||
          (request.status === "completed" && request.validationStatus !== "valid")
        );
      }
      return true;
    });

    setRequests((current) => {
      if (pageIndex === 0) return filteredItems;

      const loadedRequestIds = new Set(current.map((request) => request.requestId));
      return [
        ...current,
        ...filteredItems.filter((request) => !loadedRequestIds.has(request.requestId))
      ];
    });
  }, [data, pageIndex, filter]);

  const hasMore = requests.length < (data?.total ?? 0);

  const refreshHistory = async () => {
    setRequests([]);
    setPageIndex(0);
    await queryClient.invalidateQueries({ queryKey: ballotKeys._root });
    await refetch();
  };

  const loadMore = () => {
    if (!isFetching && hasMore) setPageIndex((current) => current + 1);
  };

  const changeFilter = (newFilter: FilterType) => {
    setFilter(newFilter);
    setRequests([]);
    setPageIndex(0);
  };

  const filters: FilterType[] = ["all", "valid", "invalid", "pending", "processing"];

  // Lightweight status polling - returns only pending/processing items
  const { data: pollData } = useQuery({
    ...ballotQueries.pollScanStatus(),
    enabled: true,
    refetchInterval: 5000,
    gcTime: 0
  });

  // Refetch when poll data changes and has active items
  useEffect(() => {
    if (!pollData) return;
    queryClient.invalidateQueries({
      queryKey: ballotKeys.scanRequests(pageIndex, PAGE_SIZE, filter)
    });
  }, [pollData, queryClient, pageIndex, filter]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-12"
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refreshHistory} />
        }
      >
        <View className="w-full max-w-md self-center">
          <View className="mb-8 flex-row items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onPress={() => router.back()}
              accessibilityLabel="Quay lại"
            >
              <Icon as={ArrowLeft} size={24} className="text-foreground" />
            </Button>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Lịch sử quét</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                {data ? `${data.total} phiếu đã gửi` : "Danh sách phiếu đã gửi"}
              </Text>
            </View>
            <Link href="/settings" asChild>
              <Button variant="ghost" size="icon" accessibilityLabel="Mở cài đặt">
                <Icon as={Settings} size={20} className="text-foreground" />
              </Button>
            </Link>
          </View>

          <View className="mb-6">
            <View className="mb-3 flex-row items-center gap-2">
              <Icon as={Filter} size={16} className="text-muted-foreground" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1"
                contentContainerClassName="gap-2"
              >
                {filters.map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onPress={() => changeFilter(f)}
                  >
                    <Text className="text-xs">{getFilterLabel(f)}</Text>
                  </Button>
                ))}
              </ScrollView>
            </View>
            <View className="overflow-hidden rounded-lg border border-border bg-card">
              {isLoading ? (
                <View className="items-center py-12">
                  <ActivityIndicator />
                  <Text className="mt-3 text-sm text-muted-foreground">Đang tải lịch sử...</Text>
                </View>
              ) : isError ? (
                <View className="p-4">
                  <Text className="font-medium text-destructive">Không thể tải lịch sử quét</Text>
                  <Text className="mt-1 text-sm text-muted-foreground">Kéo xuống để thử lại.</Text>
                </View>
              ) : requests.length === 0 ? (
                <View className="p-4">
                  <Text className="text-sm text-muted-foreground">
                    Chưa có phiếu nào được quét.
                  </Text>
                </View>
              ) : (
                requests.map((request, index) => {
                  const state = requestState(request);
                  return (
                    <Link
                      key={request.requestId}
                      href={`/scan-detail?requestId=${request.requestId}`}
                      asChild
                    >
                      <Pressable
                        className={`flex-row items-center gap-3 p-4 active:bg-muted/50 ${
                          index < requests.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <View className={`h-2.5 w-2.5 rounded-full ${state.dotColor}`} />
                        <View className="flex-1">
                          <Text className="font-mono text-sm font-semibold text-foreground">
                            {ticketId(request.requestId)}
                          </Text>
                          <Text className="mt-1 text-xs text-muted-foreground">
                            {formatTimestamp(request.processedAt)}
                          </Text>
                        </View>
                        <View className={`rounded-full px-2.5 py-1 ${state.badgeClassName}`}>
                          <Text className={`text-xs font-medium ${state.badgeTextClassName}`}>
                            {state.label}
                          </Text>
                        </View>
                      </Pressable>
                    </Link>
                  );
                })
              )}
            </View>
          </View>

          {hasMore && (
            <Button
              variant="outline"
              size="lg"
              className="mb-3"
              onPress={loadMore}
              disabled={isFetching}
            >
              {isFetching ? <ActivityIndicator /> : <Icon as={ChevronDown} size={18} />}
              <Text>{isFetching ? "Đang tải..." : "Tải thêm"}</Text>
            </Button>
          )}

          <Link href="/scan" asChild>
            <Button variant="default" size="lg">
              <Icon as={ScanLine} size={20} />
              <Text>Quét phiếu mới</Text>
            </Button>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
