const csv = require('csv-parser')
const fetch = require("node-fetch");
const multer = require('multer');
const Papa = require('papaparse');
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const APIKEY = process.env.FIXER_API_KEY || 'fe9aa5d258e61ff822869d8bd5ebcb09';
// console.log(APIKEY)

const upload = multer({ dest: 'public/' })
app.post('/', upload.single('input.csv'), (req, res) => {
  let currencyCodes = []
  fs.createReadStream('public/input.csv').pipe(csv()).on('data', (row) => {
    currencyCodes.push(row)
  }).on('end', () => {
    const symbols = currencyCodes.map(d => d.code).join(',');
    fetch(`http://data.fixer.io/api/latest?access_key=${APIKEY}&symbols=${symbols}`)
      .then((resp) => resp.json())
      .then((data) => data.rates)
      .then(data => {
        return Object.keys(data)
          .map((curr) => ({ code: curr, amount: 1 / data[curr] }))
          .sort((a, b) => a.amount - b.amount)
      })
      .then(data => {
        let csv = Papa.unparse(data);
        fs.writeFile('curr.csv', csv, (data) => {
          res.download('./curr.csv');
        })
        return csv;
      })
      .catch(err => console.error({ err }))
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))