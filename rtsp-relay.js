const express = require('express');
const bodyParser = require('body-parser');
// const snaphot = require('./controller/snapshot')

const app = express();
// Middleware
app.use(bodyParser.json());

const { Cam } = require('onvif');
const { proxy, scriptUrl } = require('rtsp-relay')(app);
let port = 3000

const handler = proxy({
  // url: `rtsp://1.tcp.jp.ngrok.io:20051/`,
  // url : 'rtsp://192.168.74.118/screenlive',
  url : 'rtsp://localhost:8554/mystream',
  // if your RTSP stream need credentials, include them in the URL as above
  verbose: true,
  additionalFlags: [
    '-vf', 'scale=1280:720',
    '-bufsize', '2M',  // ตั้งค่า buffer size เป็น 2MB
    '-maxrate', '1M' 
  ]  // เพิ่มการปรับขนาดที่นี่
});

// the endpoint our RTSP uses
app.ws('/api/stream', handler);

// this is an example html page to view the stream
app.get('/', (req, res) =>
  res.send(`
  <canvas id='canvas'></canvas>

  <script src='${scriptUrl}'></script>
  <script>
    loadPlayer({
      url: 'ws://localhost:3000/api/stream',
      canvas: document.getElementById('canvas')
    });
  </script>
`),
);

// กำหนดค่าของกล้อง ONVIF
const HOSTNAME = '192.168.1.101';
const PORT = 80;
const USERNAME = 'admin';
const PASSWORD = 'WIPS031202307210178';

// ฟังก์ชันสำหรับเชื่อมต่อกับกล้อง
function connectToCamera(callback) {
  new Cam({
      hostname: HOSTNAME,
      username: USERNAME,
      password: PASSWORD,
      port: PORT,
      timeout: 20000
  }, callback);
}

// API สำหรับควบคุม PTZ
app.post('/ptz', (req, res) => {
  console.log("ptz start");
  const { action, speed } = req.body;

  connectToCamera((err, cam) => {
    console.log("--- conneting --- ");
    console.log(cam);
      if (err) {
          console.error('Camera connection error:', err);
          return res.status(500).json({ error: 'Camera connection error' });
      }

      let x_speed = 0, y_speed = 0, zoom_speed = 0;

      switch (action) {
          case 'up':
              y_speed = speed || 0.5;
              break;
          case 'down':
              y_speed = -(speed || 0.5);
              break;
          case 'left':
              x_speed = -(speed || 0.5);
              break;
          case 'right':
              x_speed = speed || 0.5;
              break;
          case 'zoom_in':
              zoom_speed = speed || 0.5;
              break;
          case 'zoom_out':
              zoom_speed = -(speed || 0.5);
              break;
          default:
              return res.status(400).json({ error: 'Invalid action' });
      }

      // ส่งคำสั่ง PTZ ไปที่กล้อง
      cam.continuousMove({ x: x_speed, y: y_speed, zoom: zoom_speed }, (err) => {
          if (err) {
              console.error('PTZ move error:', err);
              return res.status(500).json({ error: 'PTZ move error' });
          }

          // หยุดการเคลื่อนที่หลังจากเวลาหนึ่ง
          setTimeout(() => {
              cam.stop({ panTilt: true, zoom: true }, (err) => {
                  if (err) {
                      console.error('Stop PTZ error:', err);
                      return res.status(500).json({ error: 'Stop PTZ error' });
                  }

                  res.json({ message: 'PTZ move success' });
              });
          }, 500); // หยุดหลังจาก 0.5 วินาที
      });
  });
});

// API สำหรับไปยัง preset
app.post('/goto_preset', (req, res) => {
  const { presetNumber } = req.body;

  connectToCamera((err, cam) => {
      if (err) {
          console.error('Camera connection error:', err);
          return res.status(500).json({ error: 'Camera connection error' });
      }

      cam.getPresets({}, (err, presets) => {
          if (err) {
              console.error('Get presets error:', err);
              return res.status(500).json({ error: 'Get presets error' });
          }

          const presetKeys = Object.keys(presets);
          if (presetNumber > presetKeys.length || presetNumber < 1) {
              return res.status(400).json({ error: 'Invalid preset number' });
          }

          const presetToken = presets[presetKeys[presetNumber - 1]];

          cam.gotoPreset({ preset: presetToken }, (err) => {
              if (err) {
                  console.error('Goto preset error:', err);
                  return res.status(500).json({ error: 'Goto preset error' });
              }

              res.json({ message: `Moved to preset ${presetNumber}` });
          });
      });
  });
});

// snaphot.IntervalSnapshot()

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});