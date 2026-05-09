import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from './dexie'

export const useUserCategoriesStore = defineStore('userCategories', () => {
  const categories = ref([])

  async function fetchCategories() {
    const [income, savings, variable, bills, debt] = await Promise.all([
      db.incomeCategories.toArray(),
      db.savingsCategories.toArray(),
      db.variableCategories.toArray(),
      db.billsCategories.toArray(),
      db.debtCategories.toArray()
    ])

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
    if (!cat) throw new Error(`Category not found: ${id}`)
    const toUpdate = { ...updates }
    delete toUpdate.type
    await db[`${cat.type}Categories`].update(id, toUpdate)
    await fetchCategories()
  }

  async function deleteCategory(id) {
    const cat = categories.value.find((c) => c.id === id)
    if (!cat) return
    await Promise.all([
      db[`${cat.type}Categories`].delete(id),
      db.budgets.where('categoryId').equals(id).delete()
    ])
    await fetchCategories()
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
