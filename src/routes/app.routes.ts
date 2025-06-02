// routes/kb.routes.ts
import { Router } from "express";
import { test, train } from "../controller/kb.controller";

const router = Router();

router.get("/train", async (req, res) => {
    await train("sample.pdf");
    res.send("Creating RAG!");
});

router.get("/test/:q", async (req, res) => {
    const q = parseInt(req.params.q, 10);
    await test(q);
    res.send("Testing RAG!");
});

export default router;
