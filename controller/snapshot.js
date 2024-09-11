const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const aws_s3 = require('./aws_s3')

// const rtspUrl = 'rtsp://192.168.74.118/screenlive';
const rtspUrl = 'rtsp://localhost:8554/mystream';
const outputDir = './ebike'; // Directory to save snapshots

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

/* //Function to capture a snapshot
function captureSnapshot(rtspUrl, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(rtspUrl)
      .frames(1)            // Capture 1 frame
      .output(outputPath)    // Save to the output file
      .on('end', () => {
        console.log('Snapshot captured and saved to:', outputPath);
        resolve("/ebike"+outputPath);
      })
      .on('error', (err) => {
        console.error('Error capturing snapshot:', err.message);
        reject(err);
      })
      .run();  // Run the FFmpeg command
  });
} */

// Function to capture a snapshot
function captureSnapshot(rtspUrl, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(rtspUrl)
      .frames(1)            // Capture 1 frame
      .output(outputPath)    // Save to the output file
      .on('end', () => {
        console.log('Snapshot captured and saved to:', outputPath);
        try {
          // Get file stats, including size
          const stats = fs.statSync(outputPath);
          const fileSizeInBytes = stats.size;
          console.log(`File size: ${fileSizeInBytes} bytes`);

          // if(fileSizeInBytes < 360 * 1000) {
          //   IntervalSnapshot()
          // } else {
            resolve({ path: outputPath, size: fileSizeInBytes });
          // }
        } catch (error) {
          console.error('Error getting file size:', error);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('Error capturing snapshot:', err.message);
        reject(err);
      })
      .run();  // Run the FFmpeg command
  });
}

// Function to generate a unique filename with a timestamp
function generateFileName() {
  const now = new Date();
  return `snapshot_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}.jpg`;
}

function captureAndValidateSnapshot(rtspUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const retryCapture = () => {
      captureSnapshot(rtspUrl, outputPath)
        .then(async ({ path, size }) => {
          if (size < 380 * 1000) {
            console.log('File size is too small, retrying...');
            deleteFileSync(path);
            retryCapture();  // Retry capturing if the file size is too small
          } else {
            await aws_s3.uploadFile(path);
            deleteFileSync(path)
            resolve({ path, size });
          }
        })
        .catch(reject);
    };
    
    retryCapture();  // Initial capture attempt
  });
}

// Function to delete a file synchronously
function deleteFileSync(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (err) {
    console.error(`Error deleting file: ${filePath}`, err);
  }
}

function IntervalSnapshot () {
  // Capture a snapshot every 30 seconds
  setInterval(() => {
    const fileName = generateFileName();
    const outputPath = `${outputDir}/${fileName}`;
    console.log("Snapshot start");
    
    captureAndValidateSnapshot(rtspUrl, outputPath)
      .then(({ path, size }) => {
        console.log(`Snapshot saved: ${path}, Size: ${size} bytes`);
      })
      .catch((err) => {
        console.log(err.message);
        console.error('Snapshot failed:', err);
      });
  }, 10 * 1000); // 30 seconds interval
}

module.exports = { IntervalSnapshot }
