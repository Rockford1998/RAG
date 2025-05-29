import express, { Request, Response } from "express";
import { init } from "./db/init";
import { test, train } from "./controller/kb.controller";

const app = express();
const port = process.env.PORT || 3000;

async function service() {
  await init(); 
  app.get("/train", async (req: Request, res: Response) => {
    await train("Sample.pdf");
    res.send("Creating RAG!");
  });
  app.get("/test/:q", async (req: Request, res: Response) => {
    const q = parseInt(req.params.q, 10);
    await test(q);
    res.send("Testing RAG!");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
service();
