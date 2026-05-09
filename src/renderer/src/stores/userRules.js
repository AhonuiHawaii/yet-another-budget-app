import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ipc = window.electron.ipcRenderer

export const useUserRulesStore = defineStore('userRules', () => {
  const rules = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  const error = ref(null)

  function clearError() {
    error.value = null
  }

  async function fetchRules() {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('rules:fetch')
      if (!result.success) throw new Error(result.error)
      rules.value = result.data
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function createRule(rule) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('rules:create', rule)
      if (!result.success) throw new Error(result.error)
      await fetchRules()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function editRule(id, updates) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('rules:update', id, updates)
      if (!result.success) throw new Error(result.error)
      await fetchRules()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function removeRule(id) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('rules:delete', id)
      if (!result.success) throw new Error(result.error)
      await fetchRules()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function applyToMonth(yyyymm) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('rules:applyToMonth', yyyymm)
      if (!result.success) throw new Error(result.error)
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  return { rules, loading, error, clearError, fetchRules, createRule, editRule, removeRule, applyToMonth }
})
