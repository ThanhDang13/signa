import { useEffect, useRef } from "react";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react-native";

import { Button } from "@signa/android/components/ui/button";
import { Icon } from "@signa/android/components/ui/icon";
import { Text } from "@signa/android/components/ui/text";
import { ballotKeys, ballotQueries } from "@signa/android/lib/tanstack/options/ballot";

type ScanRequestDetail = {
  requestId: string;
  ballotId: string;
  status: "pending" | "processing" | "completed" | "failed";
  s3Url?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  result?: {
    validationStatus:
      | "valid"
      | "invalid_markers"
      | "invalid_qr"
      | "invalid_selections"
      | "invalid_confidence";
    qrVerified: boolean;
    selections: Array<{
      fieldId: string;
      selectedValues: string[];
      confidence: number;
    }>;
    processingMetadata: {
      markersDetected: boolean;
      alignmentApplied: boolean;
    };
    processedAt: string;
  };
};

function ticketId(requestId: string) {
  // Use last 8 chars (more entropy) instead of first 8 (timestamp in UUIDv7)
  return `#${requestId.slice(-8).toUpperCase()}`;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: ScanRequestDetail["status"] }) {
  const config = {
    pending: {
      label: "Chờ xử lý",
      icon: Clock,
      bgColor: "bg-amber-500/15",
      textColor: "text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-600",
    },
    processing: {
      label: "Đang xử lý",
      icon: Clock,
      bgColor: "bg-amber-500/15",
      textColor: "text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-600",
    },
    completed: {
      label: "Đã xử lý",
      icon: CheckCircle,
      bgColor: "bg-emerald-600/10",
      textColor: "text-emerald-700 dark:text-emerald-400",
      iconColor: "text-emerald-600",
    },
    failed: {
      label: "Không thành công",
      icon: XCircle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      iconColor: "text-destructive",
    },
  }[status];

  return (
    <View className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${config.bgColor}`}>
      <Icon as={config.icon} size={16} className={config.iconColor} />
      <Text className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
}

function ValidationStatusBadge({
  validationStatus,
}: {
  validationStatus:
    | "valid"
    | "invalid_markers"
    | "invalid_qr"
    | "invalid_selections"
    | "invalid_confidence";
}) {
  const config = {
    valid: {
      label: "Hợp lệ",
      icon: CheckCircle,
      bgColor: "bg-emerald-600/10",
      textColor: "text-emerald-700 dark:text-emerald-400",
      iconColor: "text-emerald-600",
    },
    invalid_markers: {
      label: "Lỗi điểm chuẩn",
      icon: AlertCircle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      iconColor: "text-destructive",
    },
    invalid_qr: {
      label: "Lỗi mã QR",
      icon: AlertCircle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      iconColor: "text-destructive",
    },
    invalid_selections: {
      label: "Lỗi lựa chọn",
      icon: AlertCircle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      iconColor: "text-destructive",
    },
    invalid_confidence: {
      label: "Độ chính xác thấp",
      icon: AlertCircle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      iconColor: "text-destructive",
    },
  }[validationStatus];

  return (
    <View className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${config.bgColor}`}>
      <Icon as={config.icon} size={16} className={config.iconColor} />
      <Text className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
}

export default function ScanDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const lastPollTime = useRef<string | undefined>();

  const { data, isError, isLoading } = useQuery(
    ballotQueries.getScanRequest(requestId || ""),
  );

  const shouldPoll = data?.status === "pending" || data?.status === "processing";

  // Lightweight status polling
  const { data: pollData } = useQuery({
    ...ballotQueries.pollScanStatus(lastPollTime.current),
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 5000 : false,
  });

  // If poll detects this request changed, invalidate detail query
  useEffect(() => {
    if (!pollData || !requestId) return;

    const changed = pollData.items.find((item) => item.requestId === requestId);
    if (changed) {
      lastPollTime.current = pollData.serverTime;
      queryClient.invalidateQueries({ queryKey: ballotKeys.scanRequest(requestId) });
    }
  }, [pollData, requestId, queryClient]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <StatusBar style="auto" />
        <ActivityIndicator />
        <Text className="mt-3 text-sm text-muted-foreground">
          Đang tải chi tiết...
        </Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="auto" />
        <View className="flex-1 items-center justify-center px-6">
          <Icon as={XCircle} size={48} className="text-destructive" />
          <Text className="mt-4 text-center text-lg font-semibold text-foreground">
            Không thể tải chi tiết
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Vui lòng thử lại sau.
          </Text>
          <Button
            variant="outline"
            size="lg"
            className="mt-6"
            onPress={() => router.back()}
          >
            <Text>Quay lại</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-12"
      >
        <View className="w-full max-w-md self-center">
          <View className="mb-6 flex-row items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onPress={() => router.back()}
              accessibilityLabel="Quay lại"
            >
              <Icon as={ArrowLeft} size={24} className="text-foreground" />
            </Button>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                Chi tiết quét phiếu
              </Text>
              <Text className="font-mono text-sm text-muted-foreground">
                {ticketId(data.requestId)}
              </Text>
            </View>
          </View>

          {/* Status Section */}
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-xs font-medium uppercase text-muted-foreground">
              Trạng thái
            </Text>
            <View className="flex-row items-center justify-between">
              <StatusBadge status={data.status} />
              {data.result?.validationStatus ? (
                <ValidationStatusBadge
                  validationStatus={data.result.validationStatus}
                />
              ) : shouldPoll ? (
                <View className="flex-row items-center gap-2 rounded-full bg-amber-500/15 px-3 py-2">
                  <ActivityIndicator size="small" color="#d97706" />
                  <Text className="text-xs text-amber-700 dark:text-amber-400">
                    Đang theo dõi
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Ballot Image */}
          {data.s3Url && (
            <View className="mb-6 overflow-hidden rounded-lg border border-border bg-card">
              <Text className="border-b border-border p-4 text-xs font-medium uppercase text-muted-foreground">
                Hình ảnh phiếu
              </Text>
              <View className="p-4">
                <Image
                  source={{ uri: data.s3Url }}
                  className="h-96 w-full rounded-lg bg-muted"
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Processing Metadata */}
          {data.result?.processingMetadata && (() => {
            const result = data.result!;
            return (
              <View className="mb-6 rounded-lg border border-border bg-card">
                <Text className="border-b border-border p-4 text-xs font-medium uppercase text-muted-foreground">
                  Kết quả xử lý
                </Text>
                <View className="p-4">
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-foreground">
                      Nhận diện điểm chuẩn
                    </Text>
                    <Icon
                      as={
                        result.processingMetadata.markersDetected
                          ? CheckCircle
                          : XCircle
                      }
                      size={20}
                      className={
                        result.processingMetadata.markersDetected
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-foreground">Xác thực mã QR</Text>
                    <Icon
                      as={result.qrVerified ? CheckCircle : XCircle}
                      size={20}
                      className={
                        result.qrVerified
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-foreground">
                      Căn chỉnh ảnh
                    </Text>
                    <Icon
                      as={
                        result.processingMetadata.alignmentApplied
                          ? CheckCircle
                          : XCircle
                      }
                      size={20}
                      className={
                        result.processingMetadata.alignmentApplied
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    />
                  </View>
                </View>
              </View>
            );
          })()}


          {/* Selections */}
          {data.result?.selections && data.result.selections.length > 0 && (() => {
            const selections = data.result!.selections;
            return (
              <View className="mb-6 rounded-lg border border-border bg-card">
                <Text className="border-b border-border p-4 text-xs font-medium uppercase text-muted-foreground">
                  Các lựa chọn ({selections.length})
                </Text>
                <View className="p-4">
                  {selections.map((selection, index) => (
                    <View
                      key={selection.fieldId}
                      className={`py-3 ${
                        index < selections.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <Text className="font-mono text-xs text-muted-foreground">
                        {selection.fieldId}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {selection.selectedValues.map((value) => (
                          <View
                            key={value}
                            className="rounded-full bg-primary/10 px-3 py-1"
                          >
                            <Text className="text-xs font-medium text-primary">
                              {value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* Timestamps */}
          <View className="rounded-lg border border-border bg-card p-4">
            <Text className="mb-3 text-xs font-medium uppercase text-muted-foreground">
              Thời gian
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">
                  Quét lúc
                </Text>
                <Text className="font-mono text-sm text-foreground">
                  {formatTimestamp(data.createdAt)}
                </Text>
              </View>
              {data.processedAt && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Xử lý xong
                  </Text>
                  <Text className="font-mono text-sm text-foreground">
                    {formatTimestamp(data.processedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Retry Button */}
          {(data.status === "failed" ||
            (data.status === "completed" && data.result?.validationStatus !== "valid")) && (
            <View className="mt-6">
              <Button
                variant="default"
                size="lg"
                onPress={() =>
                  router.push(`/scan-retry?requestId=${data.requestId}&ballotId=${data.ballotId}`)
                }
              >
                <Icon as={RefreshCw} size={20} className="text-primary-foreground" />
                <Text>Thử lại</Text>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
