import Document from "../models/document.model.js";
import User from "../models/user.model.js";
import { uploadToIPFS } from "../utils/ipfsUploader.js";

export const uploadDocument = async (req, res) => {
  try {
    const address = req.user.address;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cloudinaryUrl = file.path || file.secure_url;
    const ipfsHash = await uploadToIPFS(file.path);

  
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
      message: "File uploaded and linked to user",
      doc
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Document upload failed" });
  }
};

export const getUserDocuments = async (req, res) => {
  try {
    const address = req.user.address;
    const documents = await Document.find({ owner: address.toLowerCase() })
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