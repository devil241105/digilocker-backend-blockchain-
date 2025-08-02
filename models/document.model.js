import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: { 
    type: String, 
    required: true 
},

  cloudinaryUrl: {
     type: String, 
     required: true 
    },

  ipfsHash: { 
    type: String 
 },

 fileHash: String,


 txHash: String,

  uploadedAt: { 
    type: Date, 
    default: Date.now 
 }
 
});

const Document = mongoose.model("Document", documentSchema);
export default Document;
