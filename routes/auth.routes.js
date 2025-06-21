import express from "express";
import { registerWithMetaMask, verifyToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerWithMetaMask);
router.get("/protected", verifyToken);

export default router;
