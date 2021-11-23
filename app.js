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
    feeUsd: data['txnfee(usd)'] , feeBnb: data['txnfee(bnb)']  ,
    valueInBnb : data['value_in(bnb)'] , 
    valueOutBnb : data['value_out(bnb)'], 
    status: data.status, 
    method: data.method}))
  .on('end', () => {
      let totalFeeUsd = 0;
      let totalMovimentedUsd = 0;
      let totalTransferUsd = 0;
      let totalSwapUsd = 0;
      let transactionsMore0 = 0;

      results.map(r => {
        totalFeeUsd += parseFloat(r.feeUsd);
        if(r.valueOutBnb > 0){
            transactionsMore0 += 1;
            totalMovimentedUsd += parseFloat(r.valueOutBnb) * parseFloat(r.bnbHistoricalUsd);
            if(r.method === "Transfer"){
                totalTransferUsd += parseFloat(r.valueOutBnb) * parseFloat(r.bnbHistoricalUsd);
            }
            if(r.method === "Swap"){
                totalSwapUsd += parseFloat(r.valueOutBnb) * parseFloat(r.bnbHistoricalUsd);
            }
        }
       
      });

   console.log(results);

   let report = 'Data ' + results[0].dateTime + ' até ' +  results[results.length-1].dateTime + ' \n'
   + 'Total de transações: ' + results.length + ' \n'
   + 'Total transacões valor de saida BNB maior que 0: '+ transactionsMore0 + ' \n'
   + 'Total movimentado USD$: ' + totalMovimentedUsd.toFixed(2) + ' \n'
   + 'Total Swap USD$: '+ totalSwapUsd.toFixed(2) + ' \n'
   + 'Total Transfer USD$: ' + totalTransferUsd.toFixed(2) + ' \n'
   + 'Total taxa USD$: ' + totalFeeUsd.toFixed(2) ;

   console.log(report);
   console.log('Análise completa, relatório gerado na raiz!');

   fs.writeFileSync('relatório.txt',  report , (err) => {
      if (err) throw err;
    });

    process.exit();
  });

