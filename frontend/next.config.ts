import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas en el navegador (e2e/run.mjs) compilan en otra carpeta, para
  // no pisar el build ni el dev de siempre.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
