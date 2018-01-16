const chance = require("chance").Chance();
const fs = require('fs');

let uspjeh = false;
let dir;
do
{
    dir = "C:/Users/DieHard/Desktop/FileHost/public/uploads/" + chance.string({
            length: 10,
            pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        }) + '/';

    if (!fs.existsSync(dir))
    {
        fs.mkdirSync(dir);
        uspjeh = true;
    }

} while (!uspjeh);

console.log("Uspjeh: " + uspjeh);