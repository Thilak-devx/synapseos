export function getRequestIp(
  headers: Headers | Request["headers"] | undefined,
  fallback = "127.0.0.1",
) {
  if (!headers) {
    return fallback;
  }

  const forwardedFor =
    typeof "get" in headers ? headers.get("x-forwarded-for") : null;
  const realIp = typeof "get" in headers ? headers.get("x-real-ip") : null;

  return (
    forwardedFor?.split(",")[0]?.trim() ??
    realIp?.trim() ??
    fallback
  );
}
