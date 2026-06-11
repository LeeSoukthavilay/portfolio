import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export function createViteConfig(port: number) {
  return defineConfig({
    plugins: [react()],
    server: { port },
    build: { outDir: "dist", sourcemap: true },
  });
}
