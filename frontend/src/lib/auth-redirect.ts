// Only allow redirects to paths inside this application.
// This prevents an attacker from supplying an external redirect URL.
export function getSafeRedirectPath(
  requestedPath: string | null,
): string {
  if (
    !requestedPath ||
    !requestedPath.startsWith("/") ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\") ||
    /[\u0000-\u001f]/.test(requestedPath)
  ) {
    return "/generate";
  }

  const pathname = requestedPath.split(/[?#]/, 1)[0];

  if (pathname === "/login" || pathname === "/register") {
    return "/generate";
  }

  return requestedPath;
}
