import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/server.ts"],
  target: "node20",
  minify: true,
  tsconfig: "tsconfig.build.json",
  platform: "node",
  format: "esm",
  outDir: "dist",
  clean: true,
  env: {
    NODE_ENV: "production",
  },
})
