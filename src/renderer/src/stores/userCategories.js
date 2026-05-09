import { defineStore } from 'pinia'
import { ref } from 'vue'
import Dexie from 'dexie'

const db = new Dexie('BudgetAppFrontendDB')

db.version(1).stores({
  incomeCategories: 'id, name, createdAt',
  savingsCategories: 'id, name, createdAt',
  variableCategories: 'id, name, createdAt',
  billsCategories: 'id, name, createdAt',
  debtCategories: 'id, name, createdAt',
  budgets: 'id, categoryId, amount, createdAt'
})

export const useUserCategoriesStore = defineStore('userCategories', () => {
  const categories = ref([])

  async function fetchCategories() {
    const income = await db.incomeCategories.toArray()
    const savings = await db.savingsCategories.toArray()
    const variable = await db.variableCategories.toArray()
    const bills = await db.billsCategories.toArray()
    const debt = await db.debtCategories.toArray()

    categories.value = [
      ...income.map((c) => ({ ...c, type: 'income' })),
      ...savings.map((c) => ({ ...c, type: 'savings' })),
      ...variable.map((c) => ({ ...c, type: 'variable' })),
      ...bills.map((c) => ({ ...c, type: 'bills' })),
      ...debt.map((c) => ({ ...c, type: 'debt' }))
    ]
  }

  function getCategoriesByType(type) {
    return categories.value.filter((c) => c.type === type)
  }

  async function addCategory(category) {
    const type = category.type
    const table = db[`${type}Categories`]
    if (!table) throw new Error(`Unknown category type: ${type}`)

    const newCategory = {
      id: crypto.randomUUID(),
      name: category.name,
      createdAt: new Date().toISOString()
    }

    await table.add(newCategory)
    await fetchCategories()
    return { ...newCategory, type }
  }

  async function updateCategory(id, updates) {
    const cat = categories.value.find((c) => c.id === id)
    if (!cat) return
    const table = db[`${cat.type}Categories`]
    if (table) {
      const toUpdate = { ...updates }
      delete toUpdate.type // Don't persist type to the DB since it's implied by the table
      await table.update(id, toUpdate)
      await fetchCategories()
    }
  }

  async function deleteCategory(id) {
    const cat = categories.value.find((c) => c.id === id)
    if (!cat) return
    const table = db[`${cat.type}Categories`]
    if (table) {
      await table.delete(id)
      await fetchCategories()
    }
  }

  // Initial load
  fetchCategories()

  return {
    categories,
    fetchCategories,
    getCategoriesByType,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
