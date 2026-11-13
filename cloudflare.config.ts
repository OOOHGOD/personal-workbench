import {bindings, defineConfig} from "cf/config";

export default defineConfig({worker: {
  name: "personal-workbench",
  entrypoint: "./server/worker.mjs",
  compatibilityDate: "2026-10-19",
  workersDev: true,
  previewUrls: false,
  env: {
    DB: bindings.d1({name: "personal-workbench", id: process.env.WORKBENCH_DATABASE_ID || undefined}),
    ADMIN_PASSWORD: bindings.secret(),
    SESSION_SECRET: bindings.secret(),
    WORKBENCH_READ_TOKEN: bindings.secret(),
  },
  observability: {enabled: true, redactQueryString: true,
    logs: {enabled: true, invocationLogs: false}, traces: {enabled: true}},
}});
