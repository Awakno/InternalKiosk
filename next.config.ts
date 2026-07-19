import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Déployé sur Vercel : pas besoin de output:'standalone' (spécifique au
  // self-hosting Docker/Node.js, voir .../output.md) -- Vercel gère son
  // propre packaging de build.
  // Pins le workspace root à ce projet -- sinon la détection automatique
  // de Turbopack peut se faire piéger par un lockfile isolé ailleurs sur
  // le disque (ex. dans un dossier parent) et mal cadrer le file tracing.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
