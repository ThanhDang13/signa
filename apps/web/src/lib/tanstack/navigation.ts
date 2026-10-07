let navigateFn: ((to: string, replace?: boolean) => void) | null = null;

export function bindNavigator(fn: (to: string, replace?: boolean) => void) {
  navigateFn = fn;
}

export function navigate(to: string, replace = false) {
  navigateFn?.(to, replace);
}
