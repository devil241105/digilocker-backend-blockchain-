import express from "express";
import multer from "multer";
import { jwtAuthMiddleware } from "../middlewares/jwt.js";
import {
  uploadDocument,
  getUserDocuments,
  deleteDocument,
  verifyDocument
} from "../controllers/document.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", jwtAuthMiddleware, upload.single("file"), uploadDocument);
router.get("/user-documents", jwtAuthMiddleware, getUserDocuments);
router.delete("/:docId", jwtAuthMiddleware, deleteDocument);
router.post("/verify", jwtAuthMiddleware, upload.single("file"), verifyDocument);

export default router;
