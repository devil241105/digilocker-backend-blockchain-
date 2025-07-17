import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const registerWithMetaMask = async (req, res) => {
  const { address, message, signature } = req.body;

  if (!address || !message || !signature) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: "Signature mismatch" });
    }

    let user = await User.findOne({ address: address.toLowerCase() });

    const token = jwt.sign({ address }, process.env.JWT_SECRET, { expiresIn: "2h" });

    if (!user) {
      // Tell frontend to redirect to complete profile route
      return res.json({
        success: true,
        needsProfile: true,
        token,
        message: "New user, profile incomplete"
      });
    }

    return res.json({ success: true, needsProfile: false, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const completeUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { address } = decoded;

    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOneAndUpdate(
      { address: address.toLowerCase() },
      { name, email, phone },
      { new: true, upsert: true } // upsert = create if doesn't exist
    );

    return res.json({ success: true, message: "Profile completed", user });
  } catch (err) {
    return res.status(403).json({ error: "Token invalid or expired" });
  }
};

export const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, data: decoded });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const getUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ address: decoded.address.toLowerCase() }).populate("documents");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const updateUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { address } = decoded;

    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
      return res.status(400).json({ error: "At least one field is required to update" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const user = await User.findOneAndUpdate(
      { address: address.toLowerCase() },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const deleteUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { address } = decoded;

    await User.findOneAndDelete({ address: address.toLowerCase() });

    res.json({ success: true, message: "User profile deleted" });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate("documents");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
