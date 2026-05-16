import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from './dexie'

const DEFAULT_DETAIL = {
  currentBalance: 0,
  startingBalance: 0,
  interestRate: 0,
  minimumPayment: 0,
  creditLimit: 0,
  dueDate: null
}

export const useUserDebtsStore = defineStore('userDebts', () => {
  const details = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)

  // ── Planner Settings (localStorage) ─────────────────────────────────────────
  const extraPayment = ref(Number(localStorage.getItem('debt_extra_payment') ?? 500))
  const strategy = ref(localStorage.getItem('debt_strategy') ?? 'avalanche')

  function setExtraPayment(val) {
    extraPayment.value = Number(val) || 0
    localStorage.setItem('debt_extra_payment', extraPayment.value)
  }

  function setStrategy(val) {
    strategy.value = val
    localStorage.setItem('debt_strategy', val)
  }

  // ── Debt Details CRUD ────────────────────────────────────────────────────────
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
    extraPayment,
    strategy,
    setExtraPayment,
    setStrategy,
    fetchDebtDetails,
    getDetail,
    upsertDebtDetail,
    deleteDebtDetail
  }
})
