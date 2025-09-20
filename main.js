const Nightmare = require('nightmare')
const fs = require('fs')
const http = require('https')

const LAST_VERSION_FILENAME = './.latest-version'
const SUBLIME_URL = 'https://www.sublimetext.com/dev'

Nightmare({ show: false })
  .goto(SUBLIME_URL)
  .wait('.dl_linux')
  .evaluate(() => {
    return document.querySelector('#direct-downloads li:nth-child(4) a').href
  })
  .end()
  .then(href => {
    const versionActual = parseInt(/build_(\d+)/.exec(href)[1], 10)

    fs.readFile(LAST_VERSION_FILENAME, (err, data) => {
      let versionAnterior = 0
      if (!err) {
        versionAnterior = parseInt(data.toString(), 10)
      }

      // comparar versiones
      if (versionAnterior < versionActual) {
        console.log(`There is a new version ${versionActual} available!`)

        fs.writeFileSync(LAST_VERSION_FILENAME, versionActual + '')

        const fileName = /\/([^\/]+)$/.exec(href)[1]
        const downloadStream = fs.createWriteStream(`./${fileName}`)
        console.info(`Downloading "${fileName}" (version ${versionActual})...`)

        let percentage = 0
        let progress = 0
        http.get(href, res => {
          // number of bytes to be downloaded
          const contentLength = parseInt(res.headers['content-length'], 10)

          res.pipe(downloadStream)

          res
            .on('data', chunk => {
              const chunkSize = Buffer.byteLength(chunk)
              progress += chunkSize

              const currentPercentage = Math.trunc(
                (progress / contentLength) * 100
              )
              if (percentage !== currentPercentage) {
                if (percentage % 4 === 0) {
                  process.stdout.write('#')
                }

                percentage = currentPercentage
              }
            })
            .on('end', () => {
              console.info(`\n"${fileName}" successfully downloaded!`)
            })
            .on('error', err => console.error(err))
        })
      } else {
        console.warn(`There's no newer version than ${versionAnterior}`)
        process.exit(1)
      }
    })
  })
