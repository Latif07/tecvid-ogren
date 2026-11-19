// Android uygulama adını capacitor.config.json'dan strings.xml'e yazar; kesme işaretini (Kur'an) Android'in istediği gibi kaçırır.
const fs = require('fs'), yol = 'android/app/src/main/res/values/strings.xml';
const ad = require('../capacitor.config.json').appName.replace(/\\?'/g, "\\'").replace(/&/g, '&amp;');
let x = fs.readFileSync(yol, 'utf8');
x = x.replace(/(<string name="(app_name|title_activity_main)">)[^<]*(<\/string>)/g, `$1${ad}$3`);
fs.writeFileSync(yol, x); console.log(x.match(/<string name="app_name">[^<]*<\/string>/)[0]);
