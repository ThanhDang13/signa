import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { X } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { decompressQrData, type QrCodeData } from "@signa/android/lib/utils/qr-decompression";

interface QrScannerProps {
  onScan: (data: QrCodeData) => void;
  onClose: () => void;
  onError?: (error: string) => void;
}

export function QrScanner({ onScan, onClose, onError }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      console.log("QR code detected:", data.substring(0, 50));

      if (!data) {
        throw new Error("QR code has no data");
      }

      // The QR code contains base64-encoded compressed data
      // Decode base64 to get compressed bytes, then decompress
      try {
        const compressedData = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const qrData = decompressQrData(compressedData);
        onScan(qrData);
      } catch (decodeError) {
        console.error("Failed to decode QR:", decodeError);

        // Fallback: try as plain text format (for testing)
        const parts = data.split(":");
        if (parts.length === 2) {
          const qrData = {
            ballotId: parts[0],
            signature: parts[1],
          };
          onScan(qrData);
        } else {
          throw new Error("Invalid QR code format");
        }
      }
    } catch (error) {
      console.error("QR scan error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to read QR code";
      onError?.(errorMessage);
      // Allow scanning again after error
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (permission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Checking camera permission...</Text>
      </View>
    );
  }

  if (permission?.granted === false) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="mb-4 text-center text-foreground">
          Camera permission is required to scan QR codes.
        </Text>
        <Pressable
          className="rounded-lg bg-primary px-6 py-3 active:opacity-80"
          onPress={async () => {
            const result = await requestPermission();
            if (!result.granted) {
              // Open settings if permission denied
              Linking.openSettings();
            }
          }}
        >
          <Text className="font-semibold text-primary-foreground">Grant Permission</Text>
        </Pressable>
        <Pressable className="mt-4 px-6 py-3 active:opacity-80" onPress={onClose}>
          <Text className="text-muted-foreground">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay with scanning frame */}
      <View className="flex-1 items-center justify-center">
        <View className="h-64 w-64 border-2 border-white" />
        <Text className="mt-4 text-white">Align QR code within frame</Text>
      </View>

      {/* Close button */}
      <Pressable
        className="absolute right-4 top-12 rounded-full bg-black/50 p-3 active:opacity-80"
        onPress={onClose}
      >
        <X size={24} color="white" />
      </Pressable>

      {/* Scanned indicator */}
      {scanned && (
        <View className="absolute bottom-12 left-0 right-0 items-center">
          <View className="rounded-lg bg-green-500 px-6 py-3">
            <Text className="font-semibold text-white">QR Code Scanned!</Text>
          </View>
        </View>
      )}
    </View>
  );
}
