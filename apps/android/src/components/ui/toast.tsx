import * as ToastPrimitive from '@rn-primitives/toast';
import { Icon } from '@signa/android/components/ui/icon';
import { Text } from '@signa/android/components/ui/text';
import { cn } from '@signa/android/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, Animated, PanResponder } from 'react-native';
import { X } from 'lucide-react-native';

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  iconClassName?: string;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = 'default', icon, iconClassName, children, onOpenChange, ...props }, ref) => {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
          opacity.setValue(1 - Math.abs(gestureState.dy) / 100);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          // Swipe up to dismiss
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onOpenChange?.(false);
          });
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Auto-dismiss after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onOpenChange?.(false);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [onOpenChange, translateY, opacity]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      {...panResponder.panHandlers}
    >
      <ToastPrimitive.Root
        ref={ref}
        className={cn(
          'pointer-events-auto relative mb-4 flex w-full flex-row items-center gap-3 overflow-hidden rounded-lg border p-4',
          // Default variant
          'border-border bg-card dark:bg-gray-900',
          // Destructive variant
          variant === 'destructive' && 'border-destructive/50 bg-destructive/10 dark:bg-destructive/20',
          // Error variant
          variant === 'error' && 'border-red-500/50 bg-red-500/10 dark:bg-red-500/20',
          // Success variant
          variant === 'success' && 'border-green-500/50 bg-green-500/10 dark:bg-green-500/20',
          // Warning variant
          variant === 'warning' && 'border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/20',
          className
        )}
        onOpenChange={onOpenChange}
        {...props}>
        {icon && (
          <View className="shrink-0">
            <Icon
              as={icon}
              size={20}
              className={cn(
                'text-foreground',
                variant === 'destructive' && 'text-destructive',
                variant === 'error' && 'text-red-500',
                variant === 'success' && 'text-green-500',
                variant === 'warning' && 'text-yellow-500',
                iconClassName
              )}
            />
          </View>
        )}
        <View className="flex-1">{children}</View>
        <ToastPrimitive.Close asChild>
          <Pressable className="shrink-0 rounded-md p-1 opacity-70 active:opacity-100">
            <Icon as={X} size={16} className="text-foreground" />
          </Pressable>
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    </Animated.View>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'text-foreground/50 hover:text-foreground absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none group-hover:opacity-100',
      className
    )}
    {...props}>
    <Icon as={X} className="size-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    asChild>
    <Text className={cn('text-sm font-semibold text-foreground', className)} {...props} />
  </ToastPrimitive.Title>
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    asChild>
    <Text className={cn('text-muted-foreground text-sm opacity-90', className)} {...props} />
  </ToastPrimitive.Description>
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
};
export type { ToastProps, ToastActionElement };
