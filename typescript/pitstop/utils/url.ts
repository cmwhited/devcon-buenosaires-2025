export function getAppUrl() {
  if (typeof window !== "undefined") return window.location.origin
  return `http://localhost:${process.env.PORT ?? 3000}`
}
