import { cloudinary } from "../config/cloudinary.js";
import { uploadToIPFS } from "../utils/ipfsUploader.js";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";
import { PassThrough } from "stream";
import mongoose from "mongoose";
import { keccak256 } from "ethers";
import { storeHashOnChain, verifyHashOnChain } from "../utils/blockchain.js";
import AccessRequest from "../models/accessRequest.model.js";

export const uploadDocument = async (req, res) => {
  try {
    const address = req.user.address;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    
    const cloudinaryUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(stream);
    });

    
    const ipfsHash = await uploadToIPFS(file.buffer, file.originalname);

    
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    
    const fileHash = keccak256(file.buffer);

    
    const txHash = await storeHashOnChain(fileHash);

    
    const doc = await Document.create({
      owner: user._id,
      fileName: file.originalname,
      cloudinaryUrl,
      ipfsHash,
      fileHash,
      txHash
    });

    
    await User.findByIdAndUpdate(user._id, { $push: { documents: doc._id } });

    return res.json({
      success: true,
      message: "Document uploaded successfully",
      doc
    });
  } catch (err) {
    console.error("Upload error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Document upload failed" });
    }
  }
};

export const getUserDocuments = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();

    const user = await User.findOne({ address });
    if (!user) return res.status(404).json({ error: "User not found" });

    const documents = await Document.find({ owner: user._id })
      .populate("owner", "address name email phone")
      .sort({ uploadedAt: -1 });

    if (!documents.length) {
      return res.status(404).json({ error: "No documents found for this user" });
    }

    return res.json({ success: true, documents });
  } catch (err) {
    console.error("Get documents error:", err);
    return res.status(500).json({ error: "Failed to retrieve documents" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const address = req.user.address;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!document.owner.equals(user._id)) {
      return res.status(403).json({ error: "Unauthorized to delete this document" });
    }

    await Document.findByIdAndDelete(docId);
    await User.findByIdAndUpdate(user._id, { $pull: { documents: docId } });

    return res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Delete document error:", err);
    return res.status(500).json({ error: "Failed to delete document" });
  }
};

export const testUpload = (req, res) => {
  console.log("🧾 Reached testUpload controller ✅");
  res.json({ success: true, msg: "Upload flow working", file: req.file });
};

export const verifyDocument = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileHash = keccak256(file.buffer);
    const exists = await verifyHashOnChain(fileHash);

    return res.json({ success: true, exists, fileHash });
  } catch (err) {
    console.error("Verify document error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

export const accessDocument = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const docId = req.params.id;

    const user = await User.findOne({ address });
    if (!user) return res.status(404).json({ error: "User not found" });

    const document = await Document.findById(docId).populate("owner");

    if (!document) return res.status(404).json({ error: "Document not found" });

    const isOwner = document.owner._id.equals(user._id);

    if (isOwner) {
      return res.json({ success: true, access: "owner", document });
    }

    
    const approvedRequest = await AccessRequest.findOne({
      from: user._id,
      to: document.owner._id,
      document: document._id,
      status: "approved"
    });

    if (!approvedRequest) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json({
      success: true,
      access: "approved",
      document
    });
  } catch (err) {
    console.error("Access check error:", err);
    return res.status(500).json({ error: "Failed to verify access" });
  }
};

export const getApprovedDocuments = async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const user = await User.findOne({ address });

    if (!user) return res.status(404).json({ error: "User not found" });

    const approvedRequests = await AccessRequest.find({
      from: user._id,
      status: "approved"
    })
      .populate("document")
      .populate("to", "name address email");

    const approvedDocs = approvedRequests.map(req => ({
      document: req.document,
      owner: req.to
    }));

    return res.json({ success: true, count: approvedDocs.length, approvedDocs });
  } catch (err) {
    console.error("Get approved documents error:", err);
    return res.status(500).json({ error: "Failed to retrieve approved documents" });
  }
};
