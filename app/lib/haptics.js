// Vibration API : uniquement Android/Chrome. No-op silencieux ailleurs (iOS Safari, desktop).
function vibrate(pattern) {
  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
    try { window.navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }
}

export const haptic = {
  tap: () => vibrate(8),
  select: () => vibrate(12),
  success: () => vibrate([15, 40, 15]),
  warning: () => vibrate([20, 30, 20, 30]),
  delete: () => vibrate([10, 20, 30]),
};
