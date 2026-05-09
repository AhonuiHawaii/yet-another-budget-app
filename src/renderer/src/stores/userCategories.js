import { defineStore } from 'pinia'
import { ref } from 'vue'
import Dexie from 'dexie'

const db = new Dexie('BudgetAppFrontendDB')
db.version(1).stores({
  categories: 'id, name, type, createdAt',
  budgets: 'id, categoryId, period, amount, createdAt'
})

export const useUserCategoriesStore = defineStore('userCategories', () => {
  const categories = ref([])

  async function fetchCategories() {
    categories.value = await db.categories.toArray()
  }

  function getCategoriesByType(type) {
    return categories.value.filter((c) => c.type === type)
  }

  async function addCategory(category) {
    const newCategory = {
      id: crypto.randomUUID(),
      ...category,
      createdAt: new Date().toISOString()
    }
    await db.categories.add(newCategory)
    await fetchCategories()
    return newCategory
  }

  async function updateCategory(id, updates) {
    await db.categories.update(id, updates)
    await fetchCategories()
  }

  async function deleteCategory(id) {
    await db.categories.delete(id)
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
