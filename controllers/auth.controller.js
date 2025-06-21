import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const registerWithMetaMask = async (req, res) => {
  const { address, message, signature } = req.body;

  if (!address || !message || !signature) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: "Signature mismatch" });
    }

    // Create user if doesn't exist
    let user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      user = await User.create({ address: address.toLowerCase() });
    }

    // Generate JWT
    const token = jwt.sign({ address }, process.env.JWT_SECRET, { expiresIn: "2h" });

    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, data: decoded });
  } catch (err) {
    res.sendStatus(403);
  }
};
