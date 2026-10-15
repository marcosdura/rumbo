import type { NextConfig } from "next";
import { securityHeaders } from "./lib/securityHeaders";

const nextConfig: NextConfig = {
  // Las pruebas en el navegador (e2e/run.mjs) compilan en otra carpeta, para
  // no pisar el build ni el dev de siempre.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Sin "X-Powered-By: Next.js": no hace falta anunciar con qué está hecho.
  poweredByHeader: false,
  // CSP y las demás cabeceras de seguridad, en todas las páginas
  // (lib/securityHeaders.ts).
  async headers() {
    return [{
      source: "/:path*",
      headers: securityHeaders(process.env.NEXT_PUBLIC_API_URL, process.env.NODE_ENV === "development"),
    }]
  },
};

export default nextConfig;
