/// <reference types='vitest' />
import { type ConfigEnv, defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
// import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };

  return defineConfig({
    root: import.meta.dirname,
    cacheDir: "../../node_modules/.vite/apps/web",

    ssr: {
      resolve: {
        conditions: ["@signa/source"],
        externalConditions: ["@signa/source"]
      },
      noExternal: ["@signa/react-ui"]
    },

    environments: {
      server: {
        build: {
          rollupOptions: {
            output: {
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "assets/[name].[hash].[ext]"
            }
          }
        }
      }
    },

    server: {
      port: 4200,
      host: true,
      allowedHosts: [env.VITE_SERVER_URL ? new URL(env.VITE_SERVER_URL).hostname : "localhost"],
      watch: { usePolling: true, interval: 1000 }
    },

    preview: {
      port: 4200,
      host: "0.0.0.0"
    },

    plugins: [
      // tanstackRouter({
      //   target: "react",
      //   autoCodeSplitting: true
      // }),
      tanstackStart(),
      react(),
      tailwindcss(),
      tsconfigPaths()
    ],

    build: {
      outDir: "./dist",
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  });
};
