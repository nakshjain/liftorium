import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/mongodb.js";

const startServer = async () => {
  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Gym Helper API listening on port ${env.PORT}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Failed to start Gym Helper API", error);
  process.exit(1);
});
