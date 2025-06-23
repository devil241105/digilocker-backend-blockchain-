import express from "express";
import { registerWithMetaMask, verifyToken, completeUserProfile, getUserProfile, updateUserProfile, deleteUserProfile, getAllUsers } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerWithMetaMask);
router.get("/protected", verifyToken);
router.post("/complete-profile", completeUserProfile);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.delete("/profile", deleteUserProfile);

router.get("/users", getAllUsers);

export default router;
