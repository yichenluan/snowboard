import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./prototype", import.meta.url)),
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("./3d", import.meta.url)),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
