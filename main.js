'use strict';

const Nightmare = require('nightmare'),
      fs        = require('fs'),
      request   = require('superagent');

const nightmare = Nightmare({ show: false });
const FILE_NAME = './latest-version';

nightmare
  .goto('https://www.sublimetext.com/3dev')
  .wait('#dl_linux_64')
  .evaluate(() => {
    return document.querySelector('#dl_linux_64 a:nth-child(2)').href
  })
  .end()
  .then(href => {
    let version_actual = parseInt(/build_(\d+)/.exec(href)[1], 10);
    fs.readFile(FILE_NAME, (err, data) => {
      let version_anterior = 0;
      if (!err) {
        version_anterior = parseInt(data, 10);
      }

      // comparar versiones
      if (version_anterior < version_actual) {
        console.log(`There is a new version ${version_actual} available: ${href}`);

        fs.writeFile(FILE_NAME, version_actual, err => {
          if (err) {
            console.log(err);
          }
        });

        // https://download.sublimetext.com/sublime_text_3_build_3109_x64.tar.bz2
        console.log('Downloading...')
        let file_name = /\/([^\/]+)$/.exec(href)[1];
        let out = fs.createWriteStream('./' + file_name);
        request.get(href).pipe(out);
      }
      else {
        console.log(`There's no a newer version than ${version_anterior}`);
      }
    });
  });
