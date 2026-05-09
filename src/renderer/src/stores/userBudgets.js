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

export const useUserBudgetsStore = defineStore('userBudgets', () => {
  const budgets = ref([])

  async function fetchBudgets() {
    budgets.value = await db.budgets.toArray()
  }

  function getBudget(categoryId) {
    return budgets.value.find((b) => b.categoryId === categoryId)
  }

  async function upsertBudget(categoryId, amount) {
    const existing = await db.budgets.where('categoryId').equals(categoryId).first()
    if (existing) {
      await db.budgets.update(existing.id, { amount })
    } else {
      await db.budgets.add({
        id: crypto.randomUUID(),
        categoryId,
        amount,
        createdAt: new Date().toISOString()
      })
    }
    await fetchBudgets()
  }

  async function deleteBudget(id) {
    if (!budgets.value.some((b) => b.id === id)) return
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
