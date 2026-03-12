import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useDocTypeStore = defineStore('doctype', () => {
  const metaCache = ref({})
  const loadingMeta = ref(false)

  async function getMeta(doctype) {
    if (metaCache.value[doctype]) return metaCache.value[doctype]
    loadingMeta.value = true
    try {
      const res = await api.getMeta(doctype)
      metaCache.value[doctype] = res.message || {}
      return metaCache.value[doctype]
    } finally {
      loadingMeta.value = false
    }
  }

  function clearMeta(doctype) {
    if (doctype) delete metaCache.value[doctype]
    else metaCache.value = {}
  }

  return { metaCache, loadingMeta, getMeta, clearMeta }
})
