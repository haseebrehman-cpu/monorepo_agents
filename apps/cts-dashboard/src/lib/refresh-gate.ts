export function createRefreshGate(refresh: () => Promise<void>) {
  let pending: Promise<void> | null = null;

  return function refreshOnce(): Promise<void> {
    if (!pending) {
      pending = refresh().finally(() => {
        pending = null;
      });
    }
    return pending;
  };
}
