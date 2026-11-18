// Müezzinlik ve Dualar satırlarını tools/build_mz_fonetik.py için JSON'a döker: node tools/mz-satirlar.js > satirlar.json
global.window = {};
require('../www/js/muezzin.js'); require('../www/js/dualar.js');
const l = [...window.MUEZZIN.M, ...window.DUALAR.M].filter(x => x.satir).flatMap(x => x.satir.map((s, i) => ({ id: x.id, i, ar: s.ar })));
process.stdout.write(JSON.stringify(l));
