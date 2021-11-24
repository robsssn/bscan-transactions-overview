fs = require("fs");
const csv = require('csv-parser');
let results = {};
let report = '';

try {
  scanDir();
} catch (error) {
  console.log(error);
  return;
}

function scanDir(){
  fs.readdirSync('exports').forEach(file => {
    readCsv(file);
  });
}

function readCsv(path){
  let pathAtrib = path.split('.')[0];

  Object.assign(results, {[pathAtrib]: []});

  //console.log(results);

  fs.createReadStream('exports/'+ path)
    .pipe(csv({
      mapHeaders: ({ header, index }) => header.toLowerCase()
    },
      { separator: '\t' }))
    .on('data', (data) => results[pathAtrib].push({
      dateTime: data.datetime,
      txhash: data.txhash,
      bnbHistoricalUsd: data['historical $price/bnb'],
      feeUsd: parseFloat(data['txnfee(usd)']),
      feeBnb: parseFloat(data['txnfee(bnb)']),
      valueInBnb: parseFloat(data['value_in(bnb)']),
      valueOutBnb: parseFloat(data['value_out(bnb)']),
      status: data.status,
      method: data.method
    }))
    .on('end', () => {
      consultDolarAndProcessReport(path, pathAtrib);
    });
}

function consultDolarAndProcessReport(path, pathAtrib) {

  //CASO ENCONTRE ARQUIVO SEM TRANSAÇOES
  if(results[pathAtrib].length < 1){
    return;
  }

  let totalFeeUsd = 0;
  let totalMovimentedUsd = 0;
  let totalTransferOutUsd = 0;
  let totalTransferInUsd = 0;
  let totalSwapUsd = 0;

  results[pathAtrib].map(r => {
    //CALCULO DE TRANSFEFRENCIAS
    if (r.method === "Transfer") {

      //CALCULO DE DEPOSITOS/ENTRADAS
      if (r.valueInBnb > 0) {
        totalTransferInUsd += r.valueInBnb * r.bnbHistoricalUsd;

        //CALCULO DE SAQUES/SAIDAS  
      } else {
        totalTransferOutUsd += r.valueOutBnb * r.bnbHistoricalUsd;
      }

    }

    //CALCULO DE ALIENAÇÂO
    if (r.method === "Swap") {
      totalSwapUsd += r.valueOutBnb * r.bnbHistoricalUsd;
    }

    //CALCULO DAS TAXAS
    totalFeeUsd += r.feeUsd;

  });

  totalMovimentedUsd = totalTransferInUsd + totalSwapUsd + totalTransferOutUsd;

  //console.log(results);

  report += 'Arquivo: '+ path + ' \n'
    + 'De: ' + results[pathAtrib][0].dateTime
    + '\nAté: ' + results[pathAtrib][results[pathAtrib].length - 1].dateTime + ' \n'
    + 'Quantidade de transações: ' + results[pathAtrib].length + ' \n'
    + 'Entradas: $' + totalTransferInUsd.toFixed(2) + ' \n'
    + 'Alienações: $' + totalSwapUsd.toFixed(2) + ' \n'
    + 'Saidas: $' + totalTransferOutUsd.toFixed(2) + ' \n'
    + 'Taxa: $' + totalFeeUsd.toFixed(2) + ' \n'
    + 'Movimentado: $' + totalMovimentedUsd.toFixed(2)+ ' \n\n';

  console.log(report); 

  fs.writeFileSync('Relatório Transações Bscan.txt', report, (err) => {
    if (err) throw err;
  });

}



