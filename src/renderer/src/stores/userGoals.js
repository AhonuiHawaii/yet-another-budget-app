import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import db from './dexie'

export const useUserGoalsStore = defineStore('userGoals', () => {
  const goals = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  const error = ref(null)

  const activeGoals = computed(() => goals.value.filter((goal) => goal.status !== 'completed'))
  const completedGoals = computed(() => goals.value.filter((goal) => goal.status === 'completed'))
  const totalTarget = computed(() => goals.value.reduce((sum, goal) => sum + goal.targetAmount, 0))
  const totalSaved = computed(() => goals.value.reduce((sum, goal) => sum + goal.currentAmount, 0))
  const totalRemaining = computed(() =>
    goals.value.reduce((sum, goal) => sum + Math.max(goal.targetAmount - goal.currentAmount, 0), 0)
  )

  function setError(err) {
    error.value = err?.message ?? String(err)
  }

  function normalizeGoal(goal) {
    const targetAmount = Number(goal.targetAmount) || 0
    const currentAmount = Number(goal.currentAmount) || 0
    const status = currentAmount >= targetAmount && targetAmount > 0 ? 'completed' : 'active'
    const priorityMap = { high: 1, medium: 2, low: 3 }
    const priority = priorityMap[goal.priority] || Number(goal.priority) || 999

    return {
      ...goal,
      targetAmount,
      currentAmount,
      priority: Math.max(priority, 1),
      status
    }
  }

  async function fetchGoals() {
    loadingCount.value++
    error.value = null
    try {
      const rows = await db.goals.orderBy('createdAt').toArray()
      goals.value = rows.map(normalizeGoal)
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  async function addGoal(goal) {
    loadingCount.value++
    error.value = null
    try {
      const now = new Date().toISOString()
      const row = normalizeGoal({
        id: crypto.randomUUID(),
        name: goal.name?.trim() || 'New Goal',
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        priority: Number(goal.priority) || goals.value.length + 1,
        targetDate: goal.targetDate || null,
        createdAt: now,
        updatedAt: now
      })

      await db.goals.add(row)
      await fetchGoals()
      return row
    } catch (err) {
      setError(err)
      return null
    } finally {
      loadingCount.value--
    }
  }

  async function updateGoal(id, updates = {}) {
    loadingCount.value++
    error.value = null
    try {
      const existing = await db.goals.get(id)
      if (!existing) throw new Error(`Goal not found: ${id}`)

      const next = normalizeGoal({
        ...existing,
        ...updates,
        name: updates.name === undefined ? existing.name : updates.name?.trim() || existing.name,
        updatedAt: new Date().toISOString()
      })

      await db.goals.update(id, next)
      await fetchGoals()
      return next
    } catch (err) {
      setError(err)
      return null
    } finally {
      loadingCount.value--
    }
  }

  async function deleteGoal(id) {
    loadingCount.value++
    error.value = null
    try {
      await db.goals.delete(id)
      await fetchGoals()
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  async function reorderGoals(orderedIds = []) {
    loadingCount.value++
    error.value = null
    try {
      const now = new Date().toISOString()
      await db.transaction('rw', db.goals, async () => {
        await Promise.all(
          orderedIds.map((id, index) =>
            db.goals.update(id, {
              priority: index + 1,
              updatedAt: now
            })
          )
        )
      })
      await fetchGoals()
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  function clearError() {
    error.value = null
  }

  fetchGoals()

  return {
    goals,
    activeGoals,
    completedGoals,
    totalTarget,
    totalSaved,
    totalRemaining,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    reorderGoals,
    clearError
  }
})
