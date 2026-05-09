import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

db.version(2).stores({
  incomeCategories: 'id, name, createdAt',
  savingsCategories: 'id, name, createdAt',
  variableCategories: 'id, name, createdAt',
  billsCategories: 'id, name, createdAt',
  debtCategories: 'id, name, createdAt',
  budgets: 'id, categoryId, amount, createdAt',
  goals: 'id, name, targetDate, status, createdAt'
})

db.version(3).stores({
  incomeCategories: 'id, name, createdAt',
  savingsCategories: 'id, name, createdAt',
  variableCategories: 'id, name, createdAt',
  billsCategories: 'id, name, createdAt',
  debtCategories: 'id, name, createdAt',
  budgets: 'id, categoryId, amount, createdAt',
  goals: 'id, name, targetDate, status, createdAt',
  debtDetails: 'id, updatedAt'
})

const DEFAULT_DETAIL = {
  currentBalance: 0,
  startingBalance: 0,
  interestRate: 0,
  minimumPayment: 0,
  creditLimit: 0
}

export const useUserDebtsStore = defineStore('userDebts', () => {
  const details = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)

  async function fetchDebtDetails() {
    loadingCount.value++
    try {
      details.value = await db.debtDetails.toArray()
    } finally {
      loadingCount.value--
    }
  }

  function getDetail(id) {
    return details.value.find((d) => d.id === id) ?? { id, ...DEFAULT_DETAIL }
  }

  async function upsertDebtDetail(id, updates) {
    loadingCount.value++
    try {
      const existing = await db.debtDetails.get(id)
      const now = new Date().toISOString()
      const normalized = Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [k, Number(v) || 0])
      )
      if (existing) {
        await db.debtDetails.update(id, { ...normalized, updatedAt: now })
      } else {
        await db.debtDetails.put({ id, ...DEFAULT_DETAIL, ...normalized, updatedAt: now })
      }
      await fetchDebtDetails()
    } finally {
      loadingCount.value--
    }
  }

  async function deleteDebtDetail(id) {
    loadingCount.value++
    try {
      await db.debtDetails.delete(id)
      await fetchDebtDetails()
    } finally {
      loadingCount.value--
    }
  }

  fetchDebtDetails()

  return {
    details,
    loading,
    fetchDebtDetails,
    getDetail,
    upsertDebtDetail,
    deleteDebtDetail
  }
})
