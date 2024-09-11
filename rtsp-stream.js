const Stream = require('node-rtsp-stream');
const stream = new Stream({
  name: 'ip-camera',
  // streamUrl: 'rtsp://admin:WIPS031202307210178@192.168.1.100:554',
  streamUrl: 'rtsp://1.tcp.jp.ngrok.io:20051/',
// streamUrl : 'rtsp://localhost:8554/mystream',
  wsPort: 9999,
  ffmpegOptions: { 
    '-stats': '',
    '-r': 30,
    '-b:v': '600', // Reduced video bitrate
    '-bufsize': '512k', // Reduced buffer size
    '-maxrate': '800k', // Maximum video bitrate
    '-an': '', // Disable audio
    '-vf': 'scale=854:480',
    '-c:v': 'libx264',
    '-preset': 'ultrafast', // Faster preset for debugging
    '-crf': '23',
    '-max_muxing_queue_size': '4096',
  }
});
// console.log(stream);
