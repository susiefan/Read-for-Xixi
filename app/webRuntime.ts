// Public builds are self-contained reading clients, never proxies to the Mac.
export const isPublicWebApp = () => process.env.NEXT_PUBLIC_STORYSPARK_PUBLIC_WEB === "true";
export function publicAsset(path: string): string {
  const prefix = process.env.NEXT_PUBLIC_STORYSPARK_BASE_PATH ?? "";
  if (!prefix || !path.startsWith("/") || path.startsWith("//") || path === prefix || path.startsWith(`${prefix}/`)) return path;
  return `${prefix}${path}`;
}

export function isLocalReadingHost(host: string) {
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local")) return true;
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}
