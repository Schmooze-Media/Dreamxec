const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID
  }
});

async function uploadToS3(file, folder) {
  try {
    const fileContent = await fs.readFile(file.path);

    let ext = file.originalname ? path.extname(file.originalname) : '';
    const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype
    });

    await s3.send(command);

    await fs.unlink(file.path).catch(console.error);

    axios.post(process.env.LAMBDAAPI,{
      imgUrl:`${process.env.CLOUDFROUNTURL}/${key}`,
      key:key
    }).catch(console.error);
    
    return `${process.env.CLOUDFROUNTURL}/${key}`;
  } catch (err) {
    console.error("S3 Upload Error:", err);
    return null;
  }
}

module.exports = {uploadToS3};