import Dexie from 'dexie'

const db = new Dexie('BudgetAppFrontendDB')

db.version(1).stores({
  incomeCategories: 'id, name, createdAt',
  savingsCategories: 'id, name, createdAt',
  variableCategories: 'id, name, createdAt',
  billsCategories: 'id, name, createdAt',
  debtCategories: 'id, name, createdAt',
  budgets: 'id, categoryId, period, amount, createdAt'
})

export default db
