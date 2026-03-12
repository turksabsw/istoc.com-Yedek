<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 dark:bg-[#2a2a35] dark:text-gray-300 dark:hover:bg-[#35354a] transition-colors flex-shrink-0">
          <AppIcon name="arrow-left" :size="14" />
        </button>
        <div class="min-w-0">
          <h1 class="text-[15px] font-bold text-gray-900 dark:text-gray-100 truncate">
            {{ isNew ? `Yeni ${doctypeLabel}` : docName }}
          </h1>
          <p class="text-xs text-gray-400">{{ doctypeLabel }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button class="hdr-btn-outlined" @click="goBack">Geri</button>
        <button class="hdr-btn-primary" :disabled="saving" @click="saveDoc">
          <AppIcon v-if="saving" name="loader" :size="13" class="animate-spin" />
          <AppIcon v-else name="save" :size="13" />
          <span>{{ isNew ? 'Oluştur' : 'Kaydet' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card text-center py-12">
      <AppIcon name="loader" :size="24" class="text-violet-500 animate-spin mx-auto" />
      <p class="text-sm text-gray-400 mt-3">Yükleniyor...</p>
    </div>

    <!-- Document Fields -->
    <div v-else class="space-y-5">
      <div class="card">
        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
          <AppIcon name="file-text" :size="14" class="text-violet-500 inline mr-2" />
          Döküman Bilgileri
        </h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div v-for="field in visibleFields" :key="field.fieldname">
            <label class="form-label">
              {{ field.label }}
              <span v-if="field.reqd" class="text-red-500 ml-0.5">*</span>
            </label>

            <!-- Textarea -->
            <textarea
              v-if="field.fieldtype === 'Text' || field.fieldtype === 'Long Text' || field.fieldtype === 'Small Text'"
              v-model="formData[field.fieldname]"
              rows="3"
              class="form-input resize-none"
              :placeholder="field.label"
            />

            <!-- Checkbox -->
            <div v-else-if="field.fieldtype === 'Check'" class="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                v-model="formData[field.fieldname]"
                class="form-checkbox rounded text-violet-600"
              />
            </div>

            <!-- Select -->
            <select
              v-else-if="field.fieldtype === 'Select'"
              v-model="formData[field.fieldname]"
              class="form-input"
            >
              <option value="">Seçiniz...</option>
              <option v-for="opt in (field.options || '').split('\n').filter(Boolean)" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>

            <!-- Date -->
            <input
              v-else-if="field.fieldtype === 'Date'"
              v-model="formData[field.fieldname]"
              type="date"
              class="form-input"
            />

            <!-- Datetime -->
            <input
              v-else-if="field.fieldtype === 'Datetime'"
              v-model="formData[field.fieldname]"
              type="datetime-local"
              class="form-input"
            />

            <!-- Number types -->
            <input
              v-else-if="field.fieldtype === 'Int' || field.fieldtype === 'Float' || field.fieldtype === 'Currency' || field.fieldtype === 'Percent'"
              v-model.number="formData[field.fieldname]"
              type="number"
              class="form-input"
              :placeholder="field.label"
            />

            <!-- Read-only system fields -->
            <input
              v-else-if="READONLY_FIELDS.includes(field.fieldname)"
              :value="formData[field.fieldname]"
              type="text"
              class="form-input opacity-60"
              readonly
            />

            <!-- Default: text/link/data -->
            <input
              v-else
              v-model="formData[field.fieldname]"
              type="text"
              class="form-input"
              :placeholder="field.label"
            />
          </div>

          <!-- Fallback: mevcut kayıt için meta yüklenemezse ham veriler -->
          <template v-if="visibleFields.length === 0 && !isNew">
            <div v-for="(value, key) in docData" :key="key">
              <label class="form-label">{{ formatFieldLabel(key) }}</label>
              <input
                :value="value"
                type="text"
                class="form-input"
                :readonly="READONLY_FIELDS.includes(key)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useDocTypeStore } from '@/stores/doctype'
import api from '@/utils/api'
import AppIcon from '@/components/common/AppIcon.vue'

const READONLY_FIELDS = ['name', 'creation', 'modified', 'modified_by', 'owner', 'docstatus', 'idx', 'parent', 'parenttype', 'parentfield']
const SKIP_FIELDTYPES = ['Section Break', 'Column Break', 'Tab Break', 'HTML', 'Button', 'Fold', 'Heading', 'Table', 'Table MultiSelect']

const route = useRoute()
const router = useRouter()
const toast = useToast()
const doctypeStore = useDocTypeStore()

const loading = ref(false)
const saving = ref(false)
const docData = ref({})
const formData = ref({})
const metaFields = ref([])

const doctype = computed(() => decodeURIComponent(route.params.doctype || ''))
const doctypeLabel = computed(() => doctype.value || 'Döküman')
const docName = computed(() => decodeURIComponent(route.params.name || ''))
const isNew = computed(() => docName.value === 'new')

const visibleFields = computed(() => {
  return metaFields.value.filter(f =>
    !SKIP_FIELDTYPES.includes(f.fieldtype) &&
    !f.hidden &&
    f.fieldname
  )
})

function formatFieldLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(`/app/${encodeURIComponent(doctype.value)}`)
  }
}

async function loadMeta() {
  try {
    const meta = await doctypeStore.getMeta(doctype.value)
    metaFields.value = meta.fields || []
    // Boş form verisi oluştur
    const empty = {}
    for (const f of metaFields.value) {
      if (f.fieldname && !SKIP_FIELDTYPES.includes(f.fieldtype)) {
        empty[f.fieldname] = f.default || (f.fieldtype === 'Check' ? 0 : '')
      }
    }
    return empty
  } catch {
    return {}
  }
}

async function loadDoc() {
  loading.value = true
  try {
    const emptyFromMeta = await loadMeta()

    if (isNew.value) {
      formData.value = emptyFromMeta
    } else {
      try {
        const res = await api.getDoc(doctype.value, docName.value)
        docData.value = res.data || {}
        formData.value = { ...emptyFromMeta, ...docData.value }
      } catch {
        docData.value = { name: docName.value, doctype: doctype.value }
        formData.value = docData.value
      }
    }
  } finally {
    loading.value = false
  }
}

async function saveDoc() {
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.createDoc(doctype.value, formData.value)
      const newName = res.data?.name
      toast.success(`${doctypeLabel.value} oluşturuldu`)
      if (newName) {
        router.replace(`/app/${encodeURIComponent(doctype.value)}/${encodeURIComponent(newName)}`)
      } else {
        router.push(`/app/${encodeURIComponent(doctype.value)}`)
      }
    } else {
      await api.updateDoc(doctype.value, docName.value, formData.value)
      toast.success('Kayıt güncellendi')
    }
  } catch (err) {
    toast.error(err.message || 'Kayıt sırasında hata oluştu')
  } finally {
    saving.value = false
  }
}

watch(() => route.params.name, loadDoc)
onMounted(loadDoc)
</script>
