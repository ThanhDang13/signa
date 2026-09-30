import { useRef, useState } from "react";
import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import {
  BarcodeScanningResult,
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  AlertCircle,
  Camera as CameraIcon,
  CheckCircle,
  X,
} from "lucide-react-native";
import {
  analyzeImageQuality,
  type ImageQualityResult,
} from "@signa/android/lib/utils/image-quality";
import {
  extractQrFromImage,
  extractQrFromPayload,
  type QrExtractionResult,
} from "@signa/android/lib/utils/qr-extraction";
import { toast } from "@signa/android/lib/hooks/use-toast";
import { Icon } from "@signa/android/components/ui/icon";
import { Button } from "@signa/android/components/ui/button";
import { Text } from "@signa/android/components/ui/text";

// CameraView emits the same barcode repeatedly while it remains visible.
// Keep the success toast quiet for a few seconds instead of showing it per frame.
const QR_DETECTION_COOLDOWN_MS = 5000;

interface QrOverlay {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface CameraSize {
  width: number;
  height: number;
}

interface QrPosition {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BallotCameraProps {
  onCapture: (
    imageUri: string,
    qrResult: {
      ballotId: string | null;
      error: "not_found" | "decode_failed" | null;
    },
    quality: ImageQualityResult,
  ) => void;
  onClose: () => void;
}

/**
 * Frame dimensions — single source of truth used by both the overlay JSX and the crop math.
 * Must stay in sync so what the user sees in the frame is exactly what gets cropped.
 */
function getFrameDimensions(screenWidth: number, screenHeight: number) {
  const frameWidth = Math.min(384, screenWidth - 48); // max-w-sm, 24px padding each side
  const frameHeight = frameWidth * (11 / 8.5); // 8.5:11 ballot aspect ratio
  const frameX = (screenWidth - frameWidth) / 2;
  const frameY = (screenHeight - frameHeight) / 2 - 60; // Move up by 60px
  return { frameWidth, frameHeight, frameX, frameY };
}

/**
 * Map a screen-space frame rect to photo pixel coordinates.
 *
 * expo-camera uses "cover" semantics — the preview always fills the full screen:
 *   - If photo is wider than screen aspect → fit full height, overflow left/right
 *   - If photo is taller than screen aspect → fit full width, overflow top/bottom
 *
 * We reverse this to find where the frame rect sits in the actual photo pixels.
 */
function computeCropParams(
  photoWidth: number,
  photoHeight: number,
  screenWidth: number,
  screenHeight: number,
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
) {
  const screenAspect = screenWidth / screenHeight;
  const photoAspect = photoWidth / photoHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (photoAspect > screenAspect) {
    // Photo wider than screen → preview fits full height, overflows left/right
    scale = photoHeight / screenHeight;
    const scaledPhotoWidth = photoWidth / scale;
    offsetX = Math.max(0, (scaledPhotoWidth - screenWidth) / 2);
  } else {
    // Photo taller than screen → preview fits full width, overflows top/bottom
    scale = photoWidth / screenWidth;
    const scaledPhotoHeight = photoHeight / scale;
    offsetY = Math.max(0, (scaledPhotoHeight - screenHeight) / 2);
  }

  let cropX = (frameX + offsetX) * scale;
  let cropY = (frameY + offsetY) * scale;
  let cropWidth = frameWidth * scale;
  let cropHeight = frameHeight * scale;

  // Clamp to photo bounds
  cropX = Math.max(0, Math.min(cropX, photoWidth - cropWidth));
  cropY = Math.max(0, Math.min(cropY, photoHeight - cropHeight));
  cropWidth = Math.min(cropWidth, photoWidth - cropX);
  cropHeight = Math.min(cropHeight, photoHeight - cropY);

  return { cropX, cropY, cropWidth, cropHeight };
}

function getQrPosition(result: BarcodeScanningResult): QrPosition | null {
  // Barcode bounds arrive in the camera analysis image space. They are
  // transformed to the preview only by transformQrPositionToView below.
  if (
    !result.bounds ||
    result.bounds.size.width <= 0 ||
    result.bounds.size.height <= 0
  ) {
    return null;
  }

  return {
    minX: result.bounds.origin.x,
    maxX: result.bounds.origin.x + result.bounds.size.width,
    minY: result.bounds.origin.y,
    maxY: result.bounds.origin.y + result.bounds.size.height,
  };
}

function transformQrPositionToView(
  position: QrPosition | null,
  viewWidth: number,
  viewHeight: number,
  photoWidth: number,
  photoHeight: number,
): QrPosition | null {
  if (!position || photoWidth <= 0 || photoHeight <= 0) return null;

  // CameraView renders the sensor image with cover semantics. One dimension
  // fills the preview and the excess image is cropped off-screen.
  const screenAspect = viewWidth / viewHeight;
  const photoAspect = photoWidth / photoHeight;
  const scale =
    photoAspect > screenAspect
      ? viewHeight / photoHeight
      : viewWidth / photoWidth;
  const scaledPhotoWidth = photoWidth * scale;
  const scaledPhotoHeight = photoHeight * scale;
  const offsetX = Math.max(0, (scaledPhotoWidth - viewWidth) / 2);
  const offsetY = Math.max(0, (scaledPhotoHeight - viewHeight) / 2);

  return {
    minX: position.minX * scale - offsetX,
    maxX: position.maxX * scale - offsetX,
    minY: position.minY * scale - offsetY,
    maxY: position.maxY * scale - offsetY,
  };
}

function getQrOverlay(
  result: BarcodeScanningResult,
  viewWidth: number,
  viewHeight: number,
  photoWidth: number,
  photoHeight: number,
): QrOverlay | null {
  const position = transformQrPositionToView(
    getQrPosition(result),
    viewWidth,
    viewHeight,
    photoWidth,
    photoHeight,
  );
  if (!position) return null;

  const width = position.maxX - position.minX;
  const height = position.maxY - position.minY;
  if (width <= 0 || height <= 0) return null;

  const size = Math.min(Math.max(width, height), viewWidth, viewHeight);
  const centerX = (position.minX + position.maxX) / 2;
  const centerY = (position.minY + position.maxY) / 2;
  const left = Math.max(0, Math.min(centerX - size / 2, viewWidth - size));
  const top = Math.max(0, Math.min(centerY - size / 2, viewHeight - size));

  return { left, top, width: size, height: size };
}

function isQrInsideBallotFrame(
  result: BarcodeScanningResult,
  frameX: number,
  frameY: number,
  frameWidth: number,
  frameHeight: number,
  viewWidth: number,
  viewHeight: number,
  photoWidth: number,
  photoHeight: number,
) {
  const overlay = getQrOverlay(
    result,
    viewWidth,
    viewHeight,
    photoWidth,
    photoHeight,
  );
  if (!overlay) return false;

  const centerX = overlay.left + overlay.width / 2;
  const centerY = overlay.top + overlay.height / 2;
  return (
    centerX >= frameX &&
    centerX <= frameX + frameWidth &&
    centerY >= frameY &&
    centerY <= frameY + frameHeight
  );
}

function getQrFingerprint(
  result: BarcodeScanningResult,
  qrResult: QrExtractionResult,
) {
  const position = getQrPosition(result);
  const location = position
    ? `${Math.round(position.minX)}:${Math.round(position.minY)}:${Math.round(position.maxX)}:${Math.round(position.maxY)}`
    : "none";
  return `${qrResult.ballotId ?? qrResult.error}:${location}`;
}

function didQrMove(previous: string, current: string) {
  const [previousValue, ...previousPosition] = previous.split(":");
  const [currentValue, ...currentPosition] = current.split(":");
  if (
    previousValue !== currentValue ||
    previousPosition.length !== 4 ||
    currentPosition.length !== 4
  ) {
    return true;
  }

  return currentPosition.some(
    (value, index) =>
      Math.abs(Number(value) - Number(previousPosition[index])) > 12,
  );
}

function getQrToast(result: QrExtractionResult) {
  if (result.error === "decode_failed") {
    return {
      title: "QR không hợp lệ",
      description: "Không thể giải mã dữ liệu QR",
      variant: "error" as const,
      icon: AlertCircle,
    };
  }

  return {
    title: "Không đọc được QR",
    description: "Vui lòng đưa mã QR vào khung",
    variant: "warning" as const,
    icon: AlertCircle,
  };
}

export function BallotCamera({ onCapture, onClose }: BallotCameraProps) {
  const [facing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeScanningEnabled, setBarcodeScanningEnabled] = useState(true);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<CameraView>(null);
  const sensorSize = useRef<CameraSize>({ width: 1080, height: 1920 });
  const sensorSnapshotInFlight = useRef(false);
  const lastQrDetection = useRef({ fingerprint: "", timestamp: 0 });
  const lastFrameFingerprint = useRef("");

  // Use measured camera layout dimensions, fallback to window dimensions until measured
  const hasLayout = cameraLayout.width > 0 && cameraLayout.height > 0;
  const screenWidth = hasLayout
    ? cameraLayout.width
    : Dimensions.get("window").width;
  const screenHeight = hasLayout
    ? cameraLayout.height
    : Dimensions.get("window").height;
  const { frameWidth, frameHeight, frameX, frameY } = getFrameDimensions(
    screenWidth,
    screenHeight,
  );

  const captureSensorSize = async () => {
    if (!cameraRef.current || sensorSnapshotInFlight.current) return;
    sensorSnapshotInFlight.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.01,
        skipProcessing: true,
      });
      if (photo?.width && photo?.height) {
        sensorSize.current = { width: photo.width, height: photo.height };
      }
    } catch {
      // The default sensor size remains in use if the silent snapshot fails.
    } finally {
      sensorSnapshotInFlight.current = false;
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isProcessing) return;

    const qrResult = extractQrFromPayload(result.data);
    const fingerprint = qrResult.ballotId ?? `error:${qrResult.error}`;
    const now = Date.now();
    const isRepeatedDetection =
      lastQrDetection.current.fingerprint === fingerprint &&
      now - lastQrDetection.current.timestamp < QR_DETECTION_COOLDOWN_MS;

    if (isRepeatedDetection) return;
    lastQrDetection.current = { fingerprint, timestamp: now };

    if (qrResult.ballotId) {
      toast({
        title: "QR hợp lệ",
        description: "Đã nhận diện mã QR",
        variant: "success",
        icon: CheckCircle,
        duration: 1800,
      });
      return;
    }

    const qrToast = getQrToast(qrResult);
    toast({ ...qrToast, duration: 2200 });
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Đang kiểm tra quyền truy cập...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className="text-center text-foreground">
          Cần quyền truy cập camera để quét phiếu bầu
        </Text>
        <Button variant="default" onPress={requestPermission}>
          <Text>Cấp quyền</Text>
        </Button>
        <Button variant="ghost" onPress={onClose}>
          <Text>Hủy</Text>
        </Button>
      </View>
    );
  }

  async function takePicture() {
    console.log("takePicture called", {
      hasCamera: !!cameraRef.current,
      isProcessing,
      hasLayout,
    });
    if (!cameraRef.current || isProcessing || !hasLayout) return;
    lastQrDetection.current = { fingerprint: "", timestamp: 0 };
    lastFrameFingerprint.current = "";

    // Disable barcode scanning before taking picture
    setBarcodeScanningEnabled(false);
    setIsProcessing(true);

    // Small delay to ensure barcode scanning is fully disabled
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("Attempting to take picture...");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      console.log("Picture taken:", photo);
      if (!photo?.uri) throw new Error("Failed to capture photo: no URI returned");

      const { cropX, cropY, cropWidth, cropHeight } = computeCropParams(
        photo.width,
        photo.height,
        screenWidth,
        screenHeight,
        frameX,
        frameY,
        frameWidth,
        frameHeight,
      );

      console.log("Photo:", photo.width, "x", photo.height);
      console.log("Screen:", screenWidth, "x", screenHeight);
      console.log("Frame:", { frameX, frameY, frameWidth, frameHeight });
      console.log("Crop:", { cropX, cropY, cropWidth, cropHeight });

      const manipulator = ImageManipulator.manipulate(photo.uri);
      const croppedImage = await manipulator
        .crop({
          originX: cropX,
          originY: cropY,
          width: cropWidth,
          height: cropHeight,
        })
        .renderAsync();

      const croppedResult = await croppedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.92,
      });

      console.log(
        "Cropped result:",
        croppedResult.width,
        "x",
        croppedResult.height,
      );

      const quality = await analyzeImageQuality(croppedResult.uri);
      const qrResult = await extractQrFromImage(croppedResult.uri);
      console.log("QR result:", qrResult);

      onCapture(croppedResult.uri, qrResult, quality);
    } catch (error) {
      console.error("Failed to take picture:", error);
      setIsProcessing(false);
      setBarcodeScanningEnabled(true);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        barcodeScannerSettings={
          barcodeScanningEnabled ? { barcodeTypes: ["qr"] } : undefined
        }
        onCameraReady={captureSensorSize}
        onBarcodeScanned={
          isProcessing || !barcodeScanningEnabled
            ? undefined
            : handleBarcodeScanned
        }
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          console.log(
            "Camera layout measured:",
            layout.width,
            "x",
            layout.height,
          );
          setCameraLayout(layout);
        }}
      >
        {/*
          Dim overlay — 4 rectangles around the frame, pixel-perfect derived from
          the same frameX/frameY/frameWidth/frameHeight used in crop math.
          Only render once we have measured the actual camera view.
        */}

        {hasLayout && (
          <>
            {/* Top */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: frameY,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            />

            {/* Bottom */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: screenHeight - frameY - frameHeight,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            />

            {/* Left */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: frameY,
                left: 0,
                width: frameX,
                height: frameHeight,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            />

            {/* Right */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: frameY,
                right: 0,
                width: frameX,
                height: frameHeight,
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            />

            {/* White frame guide — positioned at exactly frameX/frameY */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: frameY,
                left: frameX,
                width: frameWidth,
                height: frameHeight,
                borderWidth: 2,
                borderColor: "white",
                backgroundColor: "transparent",
              }}
            >
              {/* Corner markers */}
              <View className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white" />
              <View className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white" />
              <View className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white" />
              <View className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white" />
            </View>

            {/* Hint text below the frame */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: frameY + frameHeight + 24,
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            >
              <Text className="text-center text-white">
                Căn phiếu bầu vào khung
              </Text>
              <Text className="mt-1 text-center text-sm text-white/70">
                Đảm bảo toàn bộ phiếu hiển thị và ánh sáng đều
              </Text>
            </View>
          </>
        )}

        {/* Top controls */}
        <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/50"
            onPress={onClose}
          >
            <Icon as={X} size={24} className="text-white" />
          </Button>
        </View>

        {/* Capture button */}
        <View
          className="absolute bottom-12 left-0 right-0 items-center"
          pointerEvents="box-none"
        >
          <Pressable
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 active:bg-white/40"
            onPress={takePicture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text className="text-white">...</Text>
            ) : (
              <Icon as={CameraIcon} size={32} className="text-white" />
            )}
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}
