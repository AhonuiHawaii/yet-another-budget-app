import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
  const loading = ref(false)
  const error = ref(null)

  const monthlyBudgets = computed(() =>
    budgets.value.filter((budget) => !budget.period || budget.period === 'monthly')
  )

  function setError(err) {
    error.value = err?.message ?? String(err)
  }

  async function fetchBudgets() {
    loading.value = true
    error.value = null
    try {
      budgets.value = await db.budgets.toArray()
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  function getBudget(categoryId, period = 'monthly') {
    return budgets.value.find(
      (budget) => budget.categoryId === categoryId && (budget.period || 'monthly') === period
    )
  }

  async function upsertBudget(categoryId, amount, period = 'monthly') {
    loading.value = true
    error.value = null
    try {
      const existingRows = await db.budgets.where('categoryId').equals(categoryId).toArray()
      const existing = existingRows.find((budget) => (budget.period || 'monthly') === period)

      const normalizedAmount = Number(amount) || 0
      const now = new Date().toISOString()

      if (existing) {
        await db.budgets.update(existing.id, { amount: normalizedAmount, period, updatedAt: now })
      } else {
        await db.budgets.add({
          id: crypto.randomUUID(),
          categoryId,
          period,
          amount: normalizedAmount,
          createdAt: now,
          updatedAt: now
        })
      }
      await fetchBudgets()
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  async function deleteBudget(id) {
    loading.value = true
    error.value = null
    try {
      if (!budgets.value.some((budget) => budget.id === id)) return
      await db.budgets.delete(id)
      await fetchBudgets()
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  // Initial load
  fetchBudgets()

  return {
    budgets,
    monthlyBudgets,
    loading,
    error,
    fetchBudgets,
    getBudget,
    upsertBudget,
    deleteBudget,
    clearError
  }
})
