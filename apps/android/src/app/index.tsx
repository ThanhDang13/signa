import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CheckCircle,
  ClipboardList,
  History,
  ScanLine,
  Settings,
  XCircle
} from "lucide-react-native";

import { Button } from "@signa/android/components/ui/button";
import { Icon } from "@signa/android/components/ui/icon";
import { Text } from "@signa/android/components/ui/text";
import { ballotKeys, ballotQueries } from "@signa/android/lib/tanstack/options/ballot";
import { useIsFocused } from "@react-navigation/native";

type ScanRequest = {
  requestId: string;
  status: string;
  validationStatus:
    | "valid"
    | "invalid_markers"
    | "invalid_qr"
    | "invalid_selections"
    | "invalid_confidence"
    | "rejected_election_closed"
    | null;
};

function ticketId(requestId: string) {
  // Use last 8 chars (more entropy) instead of first 4 (timestamp in UUIDv7)
  return `#${requestId.slice(-8).toUpperCase()}`;
}

function errorLabel(request: ScanRequest) {
  if (request.status === "failed") return "Lỗi quét";

  switch (request.validationStatus) {
    case "invalid_markers":
      return "Lỗi điểm chuẩn";
    case "invalid_qr":
      return "Lỗi mã QR";
    case "invalid_selections":
      return "Lỗi lựa chọn";
    case "invalid_confidence":
      return "Độ chính xác thấp";
    case "rejected_election_closed":
      return "Cuộc bầu cử đã đóng";
    default:
      return "Lỗi quét";
  }
}

function TicketRow({
  request,
  state,
  isLast
}: {
  request: ScanRequest;
  state: "attention" | "processing";
  isLast: boolean;
}) {
  const isAttention = state === "attention";
  const isPending = request.status === "pending";

  return (
    <Link href={`/scan-detail?requestId=${request.requestId}`} asChild>
      <Pressable
        className={`flex-row items-center gap-3 p-4 active:bg-muted/50 ${
          isLast ? "" : "border-b border-border"
        }`}
      >
        <View
          className={`h-2.5 w-2.5 rounded-full ${isAttention ? "bg-destructive" : "bg-amber-500"}`}
        />
        <View className="flex-1">
          <Text className="font-mono text-sm font-semibold text-foreground">
            {ticketId(request.requestId)}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground">
            {isAttention ? errorLabel(request) : isPending ? "Chờ xử lý" : "Đang xử lý"}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function EmptySection({ children }: { children: React.ReactNode }) {
  return <Text className="p-4 text-sm text-muted-foreground">{children}</Text>;
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Main query - no polling
  const { data, isError, isLoading } = useQuery(ballotQueries.listScanRequests(0, 20, "all"));

  const requests = data?.data ?? [];
  const successfulRequests = requests.filter(
    (request) => request.status === "completed" && request.validationStatus === "valid"
  );
  const attentionRequests = requests.filter(
    (request) =>
      request.status === "failed" ||
      (request.status === "completed" && request.validationStatus !== "valid")
  );
  const processingRequests = requests.filter(
    (request) => request.status === "pending" || request.status === "processing"
  );

  const isFocused = useIsFocused();

  // Lightweight status polling - returns only pending/processing items
  const { data: pollData } = useQuery({
    ...ballotQueries.pollScanStatus(),
    enabled: isFocused,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    gcTime: 0
  });

  // Refetch main list when poll data changes and has active items
  useEffect(() => {
    if (!pollData) return;

    queryClient.refetchQueries({
      queryKey: ballotKeys.scanRequests(0, 20, "all")
    });
  }, [pollData, queryClient]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-md self-center">
          <View className="mb-8 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Tổng quan</Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Theo dõi trạng thái các phiếu đã quét
              </Text>
            </View>
            <Link href="/settings" asChild>
              <Button variant="ghost" size="icon" accessibilityLabel="Mở cài đặt">
                <Icon as={Settings} size={20} className="text-foreground" />
              </Button>
            </Link>
          </View>

          <View className="mb-6 rounded-lg border border-border bg-card">
            <View className="flex-row">
              <View className="flex-1 items-center border-r border-border px-2 py-4">
                <Icon as={ClipboardList} size={19} className="mb-2 text-muted-foreground" />
                <Text className="text-2xl font-bold text-foreground">
                  {isLoading ? "—" : (data?.meta.totalCount ?? 0)}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">Tổng phiếu</Text>
              </View>
              <View className="flex-1 items-center border-r border-border px-2 py-4">
                <Icon as={CheckCircle} size={19} className="mb-2 text-emerald-600" />
                <Text className="text-2xl font-bold text-emerald-600">
                  {isLoading ? "—" : successfulRequests.length}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">Thành công</Text>
              </View>
              <View className="flex-1 items-center px-2 py-4">
                <Icon as={XCircle} size={19} className="mb-2 text-destructive" />
                <Text className="text-2xl font-bold text-destructive">
                  {isLoading ? "—" : attentionRequests.length}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">Cần xử lý</Text>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center rounded-lg border border-border bg-card py-10">
              <ActivityIndicator />
              <Text className="mt-3 text-sm text-muted-foreground">Đang tải...</Text>
            </View>
          ) : isError ? (
            <View className="rounded-lg border border-destructive/30 bg-card p-4">
              <Text className="font-medium text-destructive">Không thể tải dữ liệu</Text>
              <Text className="mt-1 text-sm text-muted-foreground">Vui lòng thử lại sau.</Text>
            </View>
          ) : (
            <>
              <View className="mb-6">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">CẦN XỬ LÝ</Text>
                  {attentionRequests.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => router.push("/history?filter=invalid")}
                    >
                      <Text className="text-xs text-primary">
                        Xem tất cả ({attentionRequests.length})
                      </Text>
                    </Button>
                  )}
                </View>
                <View className="rounded-lg border border-border bg-card">
                  {attentionRequests.length > 0 ? (
                    attentionRequests
                      .slice(0, 3)
                      .map((request, index, visibleRequests) => (
                        <TicketRow
                          key={request.requestId}
                          request={request}
                          state="attention"
                          isLast={index === visibleRequests.length - 1}
                        />
                      ))
                  ) : (
                    <EmptySection>Không có phiếu cần xử lý.</EmptySection>
                  )}
                </View>
              </View>

              <View className="mb-6">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-muted-foreground">ĐANG XỬ LÝ</Text>
                  {processingRequests.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => router.push("/history?filter=processing")}
                    >
                      <Text className="text-xs text-primary">
                        Xem tất cả ({processingRequests.length})
                      </Text>
                    </Button>
                  )}
                </View>
                <View className="rounded-lg border border-border bg-card">
                  {processingRequests.length > 0 ? (
                    <TicketRow request={processingRequests[0]} state="processing" isLast />
                  ) : (
                    <EmptySection>Không có phiếu đang chờ.</EmptySection>
                  )}
                </View>
              </View>
            </>
          )}

          <View className="mt-2 gap-3">
            <Link href="/scan" asChild>
              <Button variant="default" size="lg">
                <Icon as={ScanLine} size={20} />
                <Text>Quét phiếu mới</Text>
              </Button>
            </Link>
            <Link href="/history" asChild>
              <Button variant="outline" size="lg">
                <Icon as={History} size={20} />
                <Text>Xem lịch sử quét</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
