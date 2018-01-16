const express        = require("express");
const app            = express();
const morgan         = require("morgan");
const mongoose       = require("mongoose");
const bodyParser     = require("body-parser");
const router         = express.Router();
const appRoutes      = require("./app/routes/api")(router);
const path           = require("path");
const fileUpload     = require('express-fileupload');
const File           = require('./app/models/file');
const chance         = require('chance').Chance();
const fs             = require('fs');

let port = process.env.PORT || 8080;

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());
app.use(express.static(__dirname + "/public"));
app.use("/api", appRoutes);

mongoose.connect("mongodb://localhost:27017/baza", function (error)
{
    if (error)
    {
        console.log("Not connected to database....");
        console.log(error);
    }
    else
    {
        console.log("Successfully connected to MongoDB");
    }
});

app.post('/upload/', function (req, res)
{
    let sampleFile;

    if (!req.files)
    {
        res.send('No files were uploaded.');
        return;
    }
    if (!req.files.sampleFile)
    {
        res.sendFile(path.join(__dirname + "/public/app/views/index.html"));
    }
    if (req.files.sampleFile === undefined)
    {
        res.send('No files were uploaded. Can not upload empty file.');
        return;
    }
    // The name of the input field is used to retrieve the uploaded file
    sampleFile = req.files.sampleFile;

    let uspjeh = false;
    let dir = __dirname + "/public/uploads/";
    let randomFolder = '';

    do
    {
        randomFolder = chance.string({
                length: 10,
                pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            }) + '/';

        if (!fs.existsSync(dir + randomFolder))
        {
            fs.mkdirSync(dir + randomFolder);
            uspjeh = true;
        }
    } while (!uspjeh);

    sampleFile.name = sampleFile.name.replace(/[\s]/g, "");

    let newFile = File();

    newFile.name = sampleFile.name;
    newFile.username = req.body.username;
    /*console.log("Username:");
    console.log(req.body.username);*/
    newFile.fileLocation = randomFolder;

    // Use the mv() method to place the file somewhere on server
    sampleFile.mv(dir + randomFolder + sampleFile.name, function (err)
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            newFile.save(function (err)
            {
                if (err) throw err;

                let link = "http://localhost:8080/uploads/" + randomFolder;

                res.send("<div><h1>Your file is uploaded to: <a href='" + link + "'>" + link + "</a></h1></div>");
            });
        }
    });
});

app.get("*", function (req, res)
{
    res.sendFile(path.join(__dirname + "/public/app/views/index.html"));
});

app.listen(port, function ()
{
    console.log("Running server on http://localhost:" + port);
});