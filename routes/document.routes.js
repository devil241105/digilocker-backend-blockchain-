import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { jwtAuthMiddleware } from "../middlewares/jwt.js";
import { uploadDocument, getUserDocuments, deleteDocument } from "../controllers/document.controller.js";

const router = express.Router();
const upload = multer({ storage });

router.post("/upload", jwtAuthMiddleware, upload.single("file"), uploadDocument);
router.get("/user-documents", jwtAuthMiddleware, getUserDocuments);
router.delete("/:docId", jwtAuthMiddleware, deleteDocument);

export default router;
