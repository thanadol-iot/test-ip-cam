const videoStream = require('rtsp-stream-hls');
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
// ใช้ cors
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

const options = {
    url: 'rtsp://192.168.1.101:554', // Your RTSP URL
    segmentFolder: path.join(__dirname, 'public', 'segment'), // Directory for .m3u8 and .ts files
    ffmpegOptions: {
        '-hls_time': '30', // Segment duration
        '-hls_list_size': '0', // Keep all segments in the playlist
        '-f': 'hls', // Force format to HLS
    },
};
const stream = new videoStream(options);
stream.start();

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
