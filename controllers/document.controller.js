import { cloudinary } from "../config/cloudinary.js";
import { uploadToIPFS } from "../utils/ipfsUploader.js";
import Document from "../models/document.model.js";
import User from "../models/user.model.js";
import { PassThrough } from "stream";
import mongoose from "mongoose";

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

    const doc = await Document.create({
      owner: user._id,
      fileName: file.originalname,
      cloudinaryUrl,
      ipfsHash
    });

    await User.findByIdAndUpdate(user._id, { $push: { documents: doc._id } });

    return res.json({
      success: true,
      message: "File uploaded to Cloudinary and IPFS",
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
