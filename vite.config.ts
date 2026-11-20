import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NEXT_PUBLIC_STORYSPARK_PUBLIC_WEB": JSON.stringify("true"),
    "process.env.NEXT_PUBLIC_STORYSPARK_BASE_PATH": JSON.stringify(""),
  },
  build: { outDir: "dist", emptyOutDir: true },
});
