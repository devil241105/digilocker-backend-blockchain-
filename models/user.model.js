import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  documents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document"
    }
  ]
});

const User = mongoose.model("User", userSchema);
export default User;
