import AccessRequest from "../models/accessRequest.model.js";
import User from "../models/user.model.js";
import Document from "../models/document.model.js";


export const sendAccessRequest = async (req, res) => {
  try {
    const fromAddress = req.user.address.toLowerCase();
    const { documentId } = req.body;

    const fromUser = await User.findOne({ address: fromAddress });
    const document = await Document.findById(documentId).populate("owner");

    if (!fromUser || !document) {
      return res.status(404).json({ error: "User or document not found" });
    }

    if (document.owner.equals(fromUser._id)) {
      return res.status(400).json({ error: "Cannot request your own document" });
    }

    const toUser = await User.findById(document.owner);

    const existing = await AccessRequest.findOne({
      from: fromUser._id,
      to: toUser._id,
      document: documentId,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({ error: "Request already sent" });
    }

    const request = await AccessRequest.create({
      from: fromUser._id,
      to: toUser._id,
      document: documentId
    });

    res.json({ success: true, request });
  } catch (err) {
    console.error("Send access request error:", err);
    res.status(500).json({ error: "Request failed" });
  }
};


export const getIncomingRequests = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOne({ address });

    const requests = await AccessRequest.find({ to: user._id })
      .populate("from", "address name")
      .populate("document")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to get incoming requests" });
  }
};


export const getOutgoingRequests = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOne({ address });

    const requests = await AccessRequest.find({ from: user._id })
      .populate("to", "address name")
      .populate("document")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to get outgoing requests" });
  }
};


export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await AccessRequest.findById(id).populate("to");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const user = await User.findOne({ address: req.user.address.toLowerCase() });

    if (!user._id.equals(request.to._id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    request.status = "approved";
    await request.save();

    res.json({ success: true, message: "Request approved", request });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve request" });
  }
};


export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await AccessRequest.findById(id).populate("to");

    if (!request) return res.status(404).json({ error: "Request not found" });

    const user = await User.findOne({ address: req.user.address.toLowerCase() });

    if (!user._id.equals(request.to._id)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ success: true, message: "Request rejected", request });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject request" });
  }
};


export const hasNewAccessRequests = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOne({ address });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newRequests = await AccessRequest.find({
      to: user._id,
      status: "pending"
    })
      .populate("from", "address name email")
      .populate("document", "fileName cloudinaryUrl ipfsHash")
      .sort({ createdAt: -1 });

    const hasNew = newRequests.length > 0;

    res.json({
      success: true,
      hasNew,
      requests: newRequests
    });
  } catch (err) {
    console.error("Check new access requests error:", err);
    res.status(500).json({ error: "Failed to check new access requests" });
  }
};


export const markAccessRequestsAsSeen = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOneAndUpdate(
      { address },
      { lastCheckedAccessRequests: new Date() },
      { new: true }
    );

    res.json({ success: true, message: "Marked as seen" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as seen" });
  }
};


export const hasPendingRequests = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOne({ address });

    const pendingExists = await AccessRequest.exists({
      to: user._id,
      status: "pending"
    });

    res.json({ success: true, hasPending: !!pendingExists });
  } catch (err) {
    console.error("Check pending requests error:", err);
    res.status(500).json({ error: "Failed to check pending requests" });
  }
};

