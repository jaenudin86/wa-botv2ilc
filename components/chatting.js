const router = require('express').Router();
const { MessageMedia, Location } = require("whatsapp-web.js");
const request = require('request')
const vuri = require('valid-url');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const mediadownloader = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback)
    })
  }
  const phoneNumberFormatter = function (number) {
    // 1. Menghilangkan karakter selain angka
    // if (number.endsWith('@g.us')) {
    //     return number
    // }

    let formatted = number.replace(/\D/g, '')

    // 2. Menghilangkan angka 0 di depan (prefix)
    //    Kemudian diganti dengan 62
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substr(1)
    }

    return formatted
}
router.post('/sendmessage' , [
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req,res) => {
    const errors = validationResult(req).formatWith(({
        msg
      }) => {
        return msg;
      });
      if (!errors.isEmpty()) {
        return res.status(422).json({
          status: false,
          message: errors.mapped()
        });
      }
    console.log(req.body);
    let phone = phoneNumberFormatter(req.body.number);
    let message = req.body.message;
    console.log(phone);
    if (phone == undefined || message == undefined) {
        res.send({ status:"error", message:"please enter valid phone and message" })
    } else {
        //     client.sendMessage(phone + '@c.us', message).then((response) => {
        //     if (response.id.fromMe) {
        //         res.send({ status:'success', message: `Message successfully sent to ${phone}` })
        //     }
        // });

        client.sendMessage(phone + '@c.us', message).then(response => {
            res.status(200).json({
              status: true,
              response: response
            });
          }).catch(err => {
            res.status(500).json({
              status: false,
              response: err
            });
          });
    }
});

router.post('/sendimage/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let image = req.body.image;
    let caption = req.body.caption;

    if (phone == undefined || image == undefined) {
        res.send({ status: "error", message: "please enter valid phone and base64/url of image" })
    } else {
        if (base64regex.test(image)) {
            let media = new MessageMedia('image/png',image);
            client.sendMessage(`${phone}@c.us`, media, { caption: caption || '' }).then((response) => {
                if (response.id.fromMe) {
                    res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                }
            });
        } else if (vuri.isWebUri(image)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + image.split("/").slice(-1)[0]
            mediadownloader(image, path, () => {
                let media = MessageMedia.fromFilePath(path);
                
                client.sendMessage(`${phone}@c.us`, media, { caption: caption || '' }).then((response) => {
                    if (response.id.fromMe) {
                        res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            res.send({ status:'error', message: 'Invalid URL/Base64 Encoded Media' })
        }
    }
});

router.post('/sendpdf/:phone', async (req,res) => {
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

    let phone = req.params.phone;
    let pdf = req.body.pdf;

    if (phone == undefined || pdf == undefined) {
        res.send({ status: "error", message: "please enter valid phone and base64/url of pdf" })
    } else {
        if (base64regex.test(pdf)) {
            let media = new MessageMedia('application/pdf', pdf);
            client.sendMessage(`${phone}@c.us`, media).then((response) => {
                if (response.id.fromMe) {
                    res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                }
            });
        } else if (vuri.isWebUri(pdf)) {
            if (!fs.existsSync('./temp')) {
                await fs.mkdirSync('./temp');
            }

            var path = './temp/' + pdf.split("/").slice(-1)[0]
            mediadownloader(pdf, path, () => {
                let media = MessageMedia.fromFilePath(path);
                client.sendMessage(`${phone}@c.us`, media).then((response) => {
                    if (response.id.fromMe) {
                        res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
                        fs.unlinkSync(path)
                    }
                });
            })
        } else {
            res.send({ status: 'error', message: 'Invalid URL/Base64 Encoded Media' })
        }
    }
});

router.post('/sendlocation/:phone', async (req, res) => {
    let phone = req.params.phone;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let desc = req.body.description;

    if (phone == undefined || latitude == undefined || longitude == undefined) { 
        res.send({ status: "error", message: "please enter valid phone, latitude and longitude" })
    } else {
        let loc = new Location(latitude, longitude, desc || "");
        client.sendMessage(`${phone}@c.us`, loc).then((response)=>{
            if (response.id.fromMe) {
                res.send({ status: 'success', message: `MediaMessage successfully sent to ${phone}` })
            }
        });
    }
});

router.get('/getchatbyid/:phone', async (req, res) => {
    let phone = req.params.phone;
    if (phone == undefined) {
        res.send({status:"error",message:"please enter valid phone number"});
    } else {
        client.getChatById(`${phone}@c.us`).then((chat) => {
            res.send({ status:"success", message: chat });
        }).catch(() => {
            console.error("getchaterror")
            res.send({ status: "error", message: "getchaterror" })
        })
    }
});

router.get('/getchats', async (req, res) => {
    client.getChats().then((chats) => {
        res.send({ status: "success", message: chats});
    }).catch(() => {
        res.send({ status: "error",message: "getchatserror" })
    })
});

module.exports = router;