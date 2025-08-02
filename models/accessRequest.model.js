import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  lastCheckedAccessRequests: { 
    type: Date, 
    default: new Date(0) 
 },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
export default AccessRequest;
