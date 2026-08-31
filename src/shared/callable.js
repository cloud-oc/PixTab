/**
 * Store a host-provided function without later changing its receiver.
 * This also keeps injected test doubles independent from their owner object.
 */
export function safeCallable(fn) {
  if (typeof fn !== "function") return null;
  return (...args) => fn(...args);
}
