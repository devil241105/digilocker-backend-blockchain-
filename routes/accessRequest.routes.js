import express from "express";
import { jwtAuthMiddleware } from "../middlewares/jwt.js";
import {
  sendAccessRequest,
  getIncomingRequests,
  getOutgoingRequests,
  approveRequest,
  rejectRequest,
  hasNewAccessRequests,
  hasPendingRequests,
  markAccessRequestsAsSeen
} from "../controllers/accessRequest.controller.js";

const router = express.Router();

router.post("/", jwtAuthMiddleware, sendAccessRequest);
router.get("/incoming", jwtAuthMiddleware, getIncomingRequests);
router.get("/outgoing", jwtAuthMiddleware, getOutgoingRequests);
router.post("/:id/approve", jwtAuthMiddleware, approveRequest);
router.post("/:id/reject", jwtAuthMiddleware, rejectRequest);
router.get("/new", jwtAuthMiddleware, hasNewAccessRequests);
router.get("/pending", jwtAuthMiddleware, hasPendingRequests);
router.post("/mark-seen", jwtAuthMiddleware, markAccessRequestsAsSeen);

export default router;
