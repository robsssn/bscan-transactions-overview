fs = require("fs");
const csv = require('csv-parser');

try {
  fs.readFileSync('data.csv');
} catch (error) {
  console.log('Não foi encontrado o arquivo data.csv na raiz');
  return;
}

const results = [];
fs.createReadStream('data.csv')
  .pipe(csv({
    mapHeaders: ({ header, index }) => header.toLowerCase()
  },
    { separator: '\t' }))
  .on('data', (data) => results.push({
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
    consultDolarAndProcessReport();
  });

function consultDolarAndProcessReport() {
  let totalFeeUsd = 0;
  let totalMovimentedUsd = 0;
  let totalTransferOutUsd = 0;
  let totalTransferInUsd = 0;
  let totalSwapUsd = 0;

  results.map(r => {
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
  console.log(results);

  let report = 'Data ' + results[0].dateTime
    + '\nAté ' + results[results.length - 1].dateTime + ' \n'
    + 'Quantidade de transações: ' + results.length + ' \n'
    + 'Entradas: $' + totalTransferInUsd.toFixed(2) + ' \n'
    + 'Alienações: $' + totalSwapUsd.toFixed(2) + ' \n'
    + 'Saidas: $' + totalTransferOutUsd.toFixed(2) + ' \n'
    + 'Taxa: $' + totalFeeUsd.toFixed(2) + ' \n'
    + 'Movimentado: $' + totalMovimentedUsd.toFixed(2);

  console.log(report);
  console.log('Análise completa, relatório gerado na raiz!');

  fs.writeFileSync('relatório.txt', report, (err) => {
    if (err) throw err;
  });

}



