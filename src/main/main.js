import { extractAccountData, extractTransactionData } from './ofx.js'

export async function importAccount(ofxData) {
  const accountData = await extractAccountData(ofxData)
  return accountData
}

export async function importTransactions(ofxData) {
  const transactionData = await extractTransactionData(ofxData)
  return transactionData
  // TODO: Integrate with db.js to save the transaction data
}
