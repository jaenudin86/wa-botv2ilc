const router = require("express").Router();
const fs = require("fs");

router.get("/checkauth", async (req, res) => {
  client
    .getState()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((err) => {
      if (err) {
        res.send("DISCONNECTED");
      }
    });
});

router.get("/getqr", async (req, res) => {
  client
    .getState()
    .then((data) => {
      if (data) {
        // res.write("<html><body><h2>Already Authenticated</h2></body></html>");
        // res.send({ status: 'success',data: '1234567',  message: `Sukses` })
        // res.end();
      } else
      // res.send(res);
      // res.send({ status: 'success',date: res, message: `MediaMessage successfully sent to ` })
      console.log('jaenudin'); 
      sendQr(res);
    })
    .catch((err) =>      sendQr(res));
});

function sendQr(res) {
  fs.readFile("components/last.text", "utf8",(err, last_qr) => {
    if (!err && last_qr) {
      console.log(last_qr); 
      res.send({ status: 'success',data: last_qr, message: `MediaMessage successfully sent to ` });
      // var page = `
      //               <html>
      //                   <body>
      //                       <script type="module">
      //                       </script>
      //                       <div id="qrcode"></div>
      //                       <script type="module">
      //                           import QrCreator from "https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.es6.min.js";
      //                           let container = document.getElementById("qrcode");
      //                           QrCreator.render({
      //                               text: "${last_qr}",
      //                               radius: 0.5, // 0.0 to 0.5
      //                               ecLevel: "H", // L, M, Q, H
      //                               fill: "#536DFE", // foreground color
      //                               background: null, // color or null for transparent
      //                               size: 256, // in pixels
      //                           }, container);
      //                       </script>
      //                   </body>
      //               </html>
      //           `;
      // res.write(page);
      // res.end();
    }
  });
}

module.exports = router;
