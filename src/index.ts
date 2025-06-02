import express from "express";
import { init } from "./db/init";
import router from "./routes/app.routes";

const app = express();
const port = process.env.PORT || 3000;

async function service() {
  await init();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/", router)

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

service();
