import { defineStore } from 'pinia'
import { ref } from 'vue'
import Dexie from 'dexie'

const db = new Dexie('BudgetAppFrontendDB')
db.version(1).stores({
  categories: 'id, name, type, createdAt',
  budgets: 'id, categoryId, period, amount, createdAt'
})

export const useUserBudgetsStore = defineStore('userBudgets', () => {
  const budgets = ref([])

  async function fetchBudgets() {
    budgets.value = await db.budgets.toArray()
  }

  function getBudget(categoryId, period) {
    return budgets.value.find((b) => b.categoryId === categoryId && b.period === period)
  }

  async function upsertBudget(categoryId, period, amount) {
    const existing = budgets.value.find((b) => b.categoryId === categoryId && b.period === period)
    if (existing) {
      await db.budgets.update(existing.id, { amount })
    } else {
      await db.budgets.add({
        id: crypto.randomUUID(),
        categoryId,
        period,
        amount,
        createdAt: new Date().toISOString()
      })
    }
    await fetchBudgets()
  }

  async function deleteBudget(id) {
    await db.budgets.delete(id)
    await fetchBudgets()
  }

  // Initial load
  fetchBudgets()

  return {
    budgets,
    fetchBudgets,
    getBudget,
    upsertBudget,
    deleteBudget
  }
})
