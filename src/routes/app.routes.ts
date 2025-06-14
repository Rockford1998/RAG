// routes/kb.routes.ts
import { Router } from "express";
import { test, train } from "../controller/kb.controller";
import { upload } from "../middlewares/uploadMiddleware";
import path from "path";

const router = Router();
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).send("No file uploaded");
            return;
        }
        const filePath = path.join(__dirname, "../../uploads", file.filename);
        train(filePath);
        res.status(200).send("File processed successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Processing failed");
    }
});


router.get("/train", async (req, res) => {
    await train("sample.pdf");
    res.send("Creating RAG!");
});

router.get("/test/:q", async (req, res) => {
    console.log("Testing RAG with query:", req.params.q);
    const q = parseInt(req.params.q, 10);
    await test(q);
    res.send("Testing RAG!");
});

export default router;
