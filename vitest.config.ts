import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /**
     * Run test files sequentially (one worker) to avoid cross-file
     * database interference in integration tests that share the same
     * PostgreSQL instance.
     */
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 30000,
  },
});
