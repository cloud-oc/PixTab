export function abortableDelay(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(abortReason(signal));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(finish, milliseconds);
    signal?.addEventListener("abort", cancel, { once: true });

    function finish() {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }
    function cancel() {
      clearTimeout(timer);
      reject(abortReason(signal));
    }
  });
}

export function createTimedSignal(parentSignal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  const relayAbort = () => controller.abort(abortReason(parentSignal));
  if (parentSignal?.aborted) relayAbort();
  else parentSignal?.addEventListener("abort", relayAbort, { once: true });
  const timer = timeoutMs > 0 ? setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("REQUEST_TIMEOUT", "TimeoutError"));
  }, timeoutMs) : null;
  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose() {
      if (timer) clearTimeout(timer);
      parentSignal?.removeEventListener("abort", relayAbort);
    }
  };
}

export function abortReason(signal) {
  return signal?.reason || new DOMException("REQUEST_ABORTED", "AbortError");
}
