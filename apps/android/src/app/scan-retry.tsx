import { useState } from "react";
import { View, Image, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@signa/android/components/ui/text";
import { Button } from "@signa/android/components/ui/button";
import { Icon } from "@signa/android/components/ui/icon";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react-native";
import { BallotCamera } from "@signa/android/components/scanner/ballot-camera";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ballotMutations, ballotKeys } from "@signa/android/lib/tanstack/options/ballot";
import { toast } from "@signa/android/lib/hooks/use-toast";

export default function ScanRetryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestId, ballotId } = useLocalSearchParams<{
    requestId: string;
    ballotId: string;
  }>();

  const [showCamera, setShowCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState<{
    uri: string;
    qrResult: { ballotId: string | null; error: "not_found" | "decode_failed" | null };
    quality: { isGoodEnough: boolean; issues: string[] };
  } | null>(null);

  const uploadMutation = useMutation(ballotMutations.getUploadUrl());
  const retryMutation = useMutation(ballotMutations.retryScan());

  const handleCapture = (
    uri: string,
    qrResult: { ballotId: string | null; error: "not_found" | "decode_failed" | null },
    quality: any
  ) => {
    setCapturedImage({ uri, qrResult, quality });
    setShowCamera(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const handleAccept = async () => {
    if (!capturedImage?.qrResult.ballotId) return;

    // Check if ballot ID matches
    if (capturedImage.qrResult.ballotId !== ballotId) {
      toast({
        title: "Mã QR không khớp",
        description: "Vui lòng chụp đúng phiếu bầu cần thử lại",
        variant: "error",
        icon: AlertCircle
      });
      return;
    }

    try {
      // 1. Get presigned URL
      const uploadData = await uploadMutation.mutateAsync({
        params: { ballotId: capturedImage.qrResult.ballotId },
        body: { contentType: "image/jpeg" }
      });

      // 2. Upload to S3
      const response = await fetch(capturedImage.uri);
      const blob = await response.blob();

      await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" }
      });

      // 3. Trigger retry processing
      await retryMutation.mutateAsync({
        params: { requestId: requestId || "" },
        body: { s3Key: uploadData.s3Key }
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ballotKeys.scanRequest(requestId || "") });
      queryClient.invalidateQueries({ queryKey: ballotKeys.scanRequests(0, 10) });

      // Show success toast
      toast({
        title: "Thử lại thành công",
        description: "Phiếu bầu đang được xử lý lại",
        variant: "success",
        icon: CheckCircle
      });

      // 4. Navigate home
      router.replace("/");
    } catch (error) {
      console.error("Retry failed:", error);

      // Show error toast
      toast({
        title: "Lỗi thử lại",
        description: error instanceof Error ? error.message : "Vui lòng thử lại",
        variant: "error",
        icon: AlertCircle
      });
    }
  };

  if (showCamera) {
    return (
      <BallotCamera
        onCapture={handleCapture}
        onClose={() => router.back()}
        expectedBallotId={ballotId}
      />
    );
  }

  const ballotIdMatches = capturedImage?.qrResult.ballotId === ballotId;
  const canAccept = ballotIdMatches && capturedImage?.quality.isGoodEnough;
  const isProcessing = uploadMutation.isPending || retryMutation.isPending;

  // QR status helpers
  const getQrStatusIcon = () => {
    if (ballotIdMatches) return CheckCircle;
    return AlertCircle;
  };

  const getQrStatusColor = () => {
    if (ballotIdMatches) return "text-green-500";
    return "text-destructive";
  };

  const getQrStatusTitle = () => {
    if (!capturedImage?.qrResult.ballotId) {
      if (capturedImage?.qrResult.error === "decode_failed") return "Mã QR không hợp lệ";
      return "Không tìm thấy mã QR";
    }
    if (ballotIdMatches) return "Đã phát hiện mã QR";
    return "Mã QR không khớp";
  };

  const getQrStatusDescription = () => {
    if (!capturedImage?.qrResult.ballotId) {
      if (capturedImage?.qrResult.error === "decode_failed") return "Không thể giải mã dữ liệu QR";
      return "Vui lòng chụp lại";
    }
    if (ballotIdMatches) return "Mã QR khớp với phiếu bầu cần thử lại";
    return "Vui lòng chụp đúng phiếu bầu cần thử lại";
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12">
        <Pressable onPress={handleRetake} className="rounded-full p-2 active:bg-muted">
          <Icon as={X} size={24} className="text-foreground" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Thử lại</Text>
        <View className="w-10" />
      </View>

      {/* Image Preview */}
      <View className="flex-1 items-center justify-center p-6">
        {capturedImage && (
          <Image
            source={{ uri: capturedImage.uri }}
            className="h-full w-full rounded-lg"
            resizeMode="contain"
          />
        )}
      </View>

      {/* Status */}
      <View className="px-6 pb-4">
        {/* QR Status */}
        <View className="mb-4 flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
          <Icon as={getQrStatusIcon()} size={20} className={getQrStatusColor()} />
          <View className="flex-1">
            <Text className="font-medium text-foreground">{getQrStatusTitle()}</Text>
            <Text className="text-sm text-muted-foreground">{getQrStatusDescription()}</Text>
          </View>
        </View>

        {/* Quality Status */}
        <View className="mb-4 flex-row items-center gap-3 rounded-lg border border-border bg-card p-4">
          <Icon
            as={capturedImage?.quality.isGoodEnough ? CheckCircle : AlertCircle}
            size={20}
            className={capturedImage?.quality.isGoodEnough ? "text-green-500" : "text-destructive"}
          />
          <View className="flex-1">
            <Text className="font-medium text-foreground">
              {capturedImage?.quality.isGoodEnough
                ? "Chất lượng hình ảnh tốt"
                : "Chất lượng hình ảnh kém"}
            </Text>
            {capturedImage?.quality.issues && capturedImage.quality.issues.length > 0 && (
              <Text className="text-sm text-destructive">
                {capturedImage.quality.issues.join(", ")}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Button
            variant="default"
            size="lg"
            onPress={handleAccept}
            disabled={!canAccept || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text>Chấp nhận</Text>
            )}
          </Button>

          <Button variant="outline" size="lg" onPress={handleRetake} disabled={isProcessing}>
            <Icon as={Camera} size={20} className="text-foreground" />
            <Text>Chụp lại</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
