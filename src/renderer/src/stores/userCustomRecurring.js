import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ipc = window.electron.ipcRenderer

export const useUserCustomRecurringStore = defineStore('userCustomRecurring', () => {
  const entries = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
  const error = ref(null)

  function clearError() {
    error.value = null
  }

  async function fetchCustomRecurring() {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('customRecurring:fetch')
      if (!result.success) throw new Error(result.error)
      entries.value = result.data
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function createEntry(entry) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('customRecurring:create', entry)
      if (!result.success) throw new Error(result.error)
      await fetchCustomRecurring()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function editEntry(id, updates) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('customRecurring:update', id, updates)
      if (!result.success) throw new Error(result.error)
      await fetchCustomRecurring()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  async function removeEntry(id) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('customRecurring:delete', id)
      if (!result.success) throw new Error(result.error)
      await fetchCustomRecurring()
      return result
    } catch (e) {
      error.value = e.message
    } finally {
      loadingCount.value--
    }
  }

  return {
    entries,
    loading,
    error,
    clearError,
    fetchCustomRecurring,
    createEntry,
    editEntry,
    removeEntry
  }
})
