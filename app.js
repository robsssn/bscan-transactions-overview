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
    mapHeaders: ({ header, index }) => header.toLowerCase()}, 
    { separator: '\t' }))
  .on('data', (data) => results.push({dateTime:data.datetime ,
    txhash: data.txhash , 
    bnbHistoricalUsd: data['historical $price/bnb'], 
    feeUsd: parseFloat(data['txnfee(usd)']) , 
    feeBnb: parseFloat(data['txnfee(bnb)'])  ,
    valueInBnb : parseFloat(data['value_in(bnb)']) , 
    valueOutBnb : parseFloat(data['value_out(bnb)']), 
    status: data.status, 
    method: data.method}))
  .on('end', () => {
      let totalFeeUsd = 0;
      let totalMovimentedUsd = 0;
      let totalTransferOutUsd = 0;
      let totalTransferInUsd = 0;
      let totalSwapUsd = 0;

      results.map(r => {
        
        //CALCULO DAS TAXAS
        totalFeeUsd += r.feeUsd;

        //CALCULO DE DEPOSITOS
        totalTransferInUsd += r.valueInBnb * r.bnbHistoricalUsd;
  
        //CALCULO DE SAQUES
        if(r.method === "Transfer"){
          totalTransferOutUsd += r.valueOutBnb * r.bnbHistoricalUsd;    
        }

        //CALCULO DE ALIENAÇÂO
        if(r.method === "Swap"){
            totalSwapUsd += r.valueOutBnb * r.bnbHistoricalUsd;
        }

      });

      totalMovimentedUsd = totalTransferInUsd + totalSwapUsd + totalTransferOutUsd;
      //console.log(results);

   let report = 'Data ' + results[0].dateTime 
   + '\naté ' +  results[results.length-1].dateTime + ' \n'
   + 'Total de transações: ' + results.length + ' \n'
   + 'Total Movimentado: $' + totalMovimentedUsd.toFixed(2) + ' \n'
   + 'Total Swap: $'+ totalSwapUsd.toFixed(2) + ' \n'
   + 'Total Transfer OUT: $' + totalTransferOutUsd.toFixed(2) + ' \n'
   + 'Total Transfer IN: $' + totalTransferInUsd.toFixed(2) + ' \n'
   + 'Total Taxa: $' + totalFeeUsd.toFixed(2);

   console.log(report);
   console.log('Análise completa, relatório gerado na raiz!');

   fs.writeFileSync('relatório.txt',  report , (err) => {
      if (err) throw err;
    });

    process.exit();
  });

