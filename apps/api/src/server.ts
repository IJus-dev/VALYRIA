import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const start = async (): Promise<void> => {
  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
}
