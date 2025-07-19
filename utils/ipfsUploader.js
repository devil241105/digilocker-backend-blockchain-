import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config(); 


export const uploadToIPFS = async (buffer, fileName) => {
  try {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
      throw new Error("Pinata API keys are missing in environment variables");
    }

    const formData = new FormData();
    formData.append("file", buffer, fileName); 

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
        }
      }
    );

    return res.data.IpfsHash;
  } catch (error) {
    console.error("IPFS Upload Error:", error.response?.data || error.message);
    throw new Error("Failed to upload to IPFS");
  }
};
