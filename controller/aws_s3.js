const { S3, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
// const { ReadStream } = require('fs');
const fs = require('fs');
const path = require('path');

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3({
    region: AWS_REGION, // Replace with your desired region
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID, // Replace with your access key
        secretAccessKey: AWS_SECRET_ACCESS_KEY // Replace with your secret key
    }
});

const bucketName = 'chp-s3';
const folderPrefix = 'ebike/';

const uploadFile = async (filePath) => {
    const fileStream = fs.createReadStream(filePath);
    console.log(path.basename(filePath));
    
    const uploadParams = {
        Bucket: bucketName, // Replace with your bucket name
        Key: `ebike/${path.basename(filePath)}`, // The name of the file in S3
        Body: fileStream,
        ContentType: 'image/jpg' // Set the content type
    };

    try {
        const data = await s3.putObject(uploadParams);
        console.log('File uploaded successfully:', data);
        
    } catch (err) {
        console.error('Error uploading file:', err);
    }
};

async function deleteOldFiles() {
    const threeDaysAgo = new Date();
    // threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setMinutes(threeDaysAgo.getMinutes() - 1);
  
    try {
      // Step 1: List all objects in the bucket
      const listParams = {
        Bucket: bucketName,
        Prefix : folderPrefix
      };
      
      const listCommand = new ListObjectsV2Command(listParams);
      const data = await s3.send(listCommand);
  
      if (!data.Contents || data.Contents.length === 0) {
        console.log('No files found in the bucket.');
        return;
      }
  
      // Step 2: Filter files older than 3 days
      const oldFiles = data.Contents.filter((file) => {
        const lastModified = new Date(file.LastModified);
        return lastModified < threeDaysAgo && file.Key.endsWith('.jpg');
      });
  
      if (oldFiles.length === 0) {
        console.log('No files older than 3 days found.');
        return;
      }
  
      // Step 3: Delete the old files
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: oldFiles.map((file) => ({ Key: file.Key })),
        },
      };
  
      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      const deleteResult = await s3.send(deleteCommand);
  
      console.log('Deleted files:', deleteResult.Deleted);
    } catch (err) {
      console.error('Error deleting old files:', err);
    }
  }

  deleteOldFiles()
  setInterval(() => {
    deleteOldFiles()
  }, 24 * 60 * 60 * 1000); // 1 day interval

module.exports={ uploadFile, deleteOldFiles }
