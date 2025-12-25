import axios from "axios";

export const getUploadSignature = async () => {
  const res = await axios.get("/api/upload/cloudinary-signature");
  return res.data;
};
