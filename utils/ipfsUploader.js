import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const uploadToIPFS = async (filePath) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxContentLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
      }
    }
  );

  return res.data.IpfsHash;
};
