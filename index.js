require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose")
const bodyParser = require("body-parser");
const { response } = require('express');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

//Database Connection and Modelling.
mongoose.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})

let urlSchema = new mongoose.Schema({
    //original url
    original: { type: String, require: true },
    //short url
    short: Number
})

let Url = mongoose.model("Url", urlSchema)
let resObj = {}

app.post("/api/shorturl", bodyParser.urlencoded({ extended: false }), (req, res) => {
    let inputUrl = req.body["url"]
        //Check, if the URL is valid or not using regex.
    let regUrl = new RegExp(/^[http://www.]/gi)
    if (!inputUrl.match(regUrl)) {
        res.json({ error: "invalid url" })
        return
    }

    resObj["original_url"] = inputUrl

    let inputShort = 1

    Url.findOne({})
        .sort({ short: "desc" })
        .exec((error, result)  => {
            if (!error && result != undefined) {
                inputShort = result.short + 1;
            }
            if (!error) {
                Url.findOneAndUpdate({ original: inputUrl }, { original: inputUrl, short: inputShort }, { new: true, upsert: true },
                    (error, savedUrl) => {
                        if (!error) {
                            resObj["short_url"] = savedUrl.short
                            res.json(resObj)
                        }
                    }
                )
            }
        })
})

app.get("/api/shorturl/:number", (req, res) => {
    let number = req.params.number
    Url.findOne({ short: number }, (err, data) => {
        if (!err && data != undefined) {
            res.redirect(data.original)
        } else {
            res.send("Couldn't find the URL")
        }
    })
})

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});