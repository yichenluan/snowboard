import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export default defineConfig({
  root: fileURLToPath(new URL("./prototype", import.meta.url)),
  base: "./",
  plugins: [{
    name: "snowboard-analytics",
    transformIndexHtml() {
      const config = JSON.parse(readFileSync(new URL("./analytics-config.json", import.meta.url), "utf8"));
      const tracker = readFileSync(new URL("./analytics.js", import.meta.url), "utf8");
      return [{
        tag: "script",
        children: `window.SNOW_ANALYTICS_CONFIG=${JSON.stringify(config).replaceAll("<", "\\u003c")};\n${tracker}\nwindow.SnowAnalytics?.view({path:"/snowboard/3d/",title:"搓雪小回转 · 三维动作实验室"});`.replace(/<\/script/gi, "<\\/script"),
        injectTo: "body",
      }];
    },
  }],
  build: {
    outDir: fileURLToPath(new URL("./3d", import.meta.url)),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
