import { Icon } from "@signa/android/components/ui/icon";
import { Text } from "@signa/android/components/ui/text";
import { cn } from "@signa/android/lib/utils";
import type { LucideIcon } from "lucide-react-native";
import * as React from "react";
import { Animated, Pressable, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal } from "@rn-primitives/portal";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";
type ToastPosition = "top" | "bottom";

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  icon?: LucideIcon;
  duration?: number;
}

interface ToasterProps {
  position?: ToastPosition;
  offset?: number;
}

// Toast state management
let toastState: ToastData | null = null;
const listeners = new Set<(toast: ToastData | null) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(toastState));
}

let toastId = 0;

export function toast({
  title,
  description,
  variant = "default",
  icon,
  duration
}: Omit<ToastData, "id">) {
  const id = `toast-${++toastId}`;
  toastState = { id, title, description, variant, icon, duration };
  notifyListeners();
}

export function Toaster({ position = "top", offset = 16 }: ToasterProps = {}) {
  const [currentToast, setCurrentToast] = React.useState<ToastData | null>(null);
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const isTop = position === "top";

  React.useEffect(() => {
    listeners.add(setCurrentToast);
    return () => {
      listeners.delete(setCurrentToast);
    };
  }, []);

  React.useEffect(() => {
    if (currentToast) {
      // Reset position based on direction
      const startValue = isTop ? -100 : 100;
      translateY.setValue(startValue);

      // Slide in and fade in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss
      const duration = currentToast.duration ?? (currentToast.variant === "error" ? 5000 : 3000);
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  const dismissToast = () => {
    const endValue = isTop ? -100 : 100;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: endValue,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      toastState = null;
      notifyListeners();
    });
  };

  if (!currentToast) return null;

  const getIconColor = () => {
    switch (currentToast.variant) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-destructive";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-foreground";
    }
  };

  const paddingStyle = isTop
    ? { paddingTop: insets.top + offset }
    : { paddingBottom: insets.bottom + offset };

  return (
    <Portal name="toast-portal">
      <View
        style={paddingStyle}
        className={cn(
          "pointer-events-none absolute left-0 right-0 items-center px-4",
          isTop ? "top-0" : "bottom-0"
        )}
      >
        <Animated.View
          style={{
            transform: [{ translateY }],
            opacity
          }}
          className="pointer-events-auto w-full max-w-md"
        >
          <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-md">
            {/* Icon (colored based on variant, centered vertically) */}
            {currentToast.icon && (
              <View className="shrink-0">
                <Icon as={currentToast.icon} size={20} className={getIconColor()} />
              </View>
            )}

            {/* Content */}
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-semibold leading-tight text-foreground">
                {currentToast.title}
              </Text>
              {currentToast.description && (
                <Text className="text-sm leading-tight text-muted-foreground">
                  {currentToast.description}
                </Text>
              )}
            </View>

            {/* Close button */}
            <Pressable
              onPress={dismissToast}
              className="shrink-0 rounded-md p-1 opacity-70 active:opacity-100"
            >
              <Icon as={X} size={16} className="text-foreground" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Portal>
  );
}
