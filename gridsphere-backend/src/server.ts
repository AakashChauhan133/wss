import { createApp } from "./app";
import { config } from "./config/env";

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`GridSphere API v2 (Node.js) running on http://localhost:${config.port}`);
});
