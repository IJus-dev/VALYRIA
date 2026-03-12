import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/domain",
  "packages/xrpl",
  "apps/api",
]);
