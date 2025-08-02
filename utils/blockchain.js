import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const abiPath = path.join(__dirname, "./contractABI.json");
const contractABI = JSON.parse(fs.readFileSync(abiPath, "utf-8"));


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);


export const storeHashOnChain = async (hash) => {
  const tx = await contract.storeDocumentHash(hash);
  await tx.wait();
  return tx.hash;
};


export const verifyHashOnChain = async (hash) => {
  return await contract.verifyDocumentHash(hash);
};
 