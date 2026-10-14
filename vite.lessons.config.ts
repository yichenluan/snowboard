import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// One self-contained runtime for both HTTP and saved file:// HTML.
export default defineConfig({
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: fileURLToPath(new URL("./.validation/lesson-player-build", import.meta.url)),
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("./lesson-player/main.tsx", import.meta.url)),
      name: "SnowLessonBundle",
      formats: ["iife"],
      fileName: () => "runtime.js",
    },
    minify: true,
  },
});
