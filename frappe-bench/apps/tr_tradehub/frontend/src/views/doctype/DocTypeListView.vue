<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-[15px] font-bold text-gray-900 dark:text-gray-100">{{ doctypeLabel }}</h1>
        <p class="text-xs text-gray-400 dark:text-gray-500">{{ totalCount }} kayıt bulundu</p>
      </div>
      <div class="flex items-center gap-2">
        <ViewModeToggle v-model="viewMode" />
        <button class="hdr-btn-outlined" @click="refreshList">
          <AppIcon name="refresh-cw" :size="14" />
          <span>Yenile</span>
        </button>
        <button class="hdr-btn-primary" @click="showCreateModal = true">
          <AppIcon name="plus" :size="14" />
          <span>Yeni Ekle</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="card mb-5 !p-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div class="relative flex-1 min-w-0 sm:min-w-[200px]">
          <AppIcon name="search" :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="`${doctypeLabel} ara...`"
            class="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          >
        </div>
        <div class="flex items-center gap-2">
          <AppIcon name="filter" :size="13" class="text-gray-400 dark:text-gray-500" />
          <select v-model="statusFilter" class="form-input-sm w-auto">
            <option value="">Tüm Durumlar</option>
            <option value="Active">Aktif</option>
            <option value="Draft">Taslak</option>
            <option value="Disabled">Pasif</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <AppIcon name="arrow-down-wide-narrow" :size="13" class="text-gray-400 dark:text-gray-500" />
          <select v-model="sortBy" class="form-input-sm w-auto">
            <option value="modified desc">Son Düzenlenen</option>
            <option value="creation desc">Son Oluşturulan</option>
            <option value="name asc">İsim (A-Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card text-center py-12">
      <AppIcon name="loader" :size="24" class="text-violet-500 animate-spin mx-auto" />
      <p class="text-sm text-gray-400 mt-3">Yükleniyor...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="card text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
        <AppIcon name="inbox" :size="24" class="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Henüz kayıt yok</h3>
      <p class="text-xs text-gray-400 mb-4">İlk {{ doctypeLabel }} kaydınızı oluşturun</p>
      <button class="hdr-btn-primary" @click="showCreateModal = true">
        <AppIcon name="plus" :size="14" />
        <span>Yeni Ekle</span>
      </button>
    </div>

    <!-- Content -->
    <div v-else class="card p-0 overflow-hidden">

      <!-- TABLE VIEW -->
      <div v-if="viewMode === 'table'" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="tbl-th w-8"><input type="checkbox" class="form-checkbox rounded text-violet-600"></th>
              <th class="tbl-th">İSİM</th>
              <th class="tbl-th">DURUM</th>
              <th class="tbl-th">OLUŞTURULMA</th>
              <th class="tbl-th">DÜZENLEME</th>
              <th class="tbl-th w-12"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.name"
              class="tbl-row border-b border-gray-50 cursor-pointer"
              @click="openDoc(item.name)"
            >
              <td class="tbl-td" @click.stop><input type="checkbox" class="form-checkbox rounded text-violet-600"></td>
              <td class="tbl-td font-semibold text-gray-900">{{ item.name }}</td>
              <td class="tbl-td">
                <span class="badge" :class="getStatusClass(item.docstatus)">
                  {{ getStatusLabel(item.docstatus) }}
                </span>
              </td>
              <td class="tbl-td text-gray-400">{{ formatDate(item.creation) }}</td>
              <td class="tbl-td text-gray-400">{{ formatDate(item.modified) }}</td>
              <td class="tbl-td">
                <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click.stop>
                  <AppIcon name="more-vertical" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- LIST VIEW (compact) -->
      <div v-else-if="viewMode === 'list'">
        <div
          v-for="item in items"
          :key="item.name"
          class="list-compact-item"
          @click="openDoc(item.name)"
        >
          <input type="checkbox" class="form-checkbox rounded text-violet-600 flex-shrink-0" @click.stop>
          <span class="list-compact-name">{{ item.name }}</span>
          <span class="badge" :class="getStatusClass(item.docstatus)">
            {{ getStatusLabel(item.docstatus) }}
          </span>
          <span class="list-compact-date">{{ formatDate(item.modified) }}</span>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0" @click.stop>
            <AppIcon name="more-vertical" :size="14" />
          </button>
        </div>
      </div>

      <!-- GRID VIEW (cards) -->
      <div v-else-if="viewMode === 'grid'" class="list-grid">
        <div
          v-for="item in items"
          :key="item.name"
          class="list-grid-card"
          @click="openDoc(item.name)"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="list-grid-card-title">{{ item.name }}</span>
            <span class="badge text-[10px]" :class="getStatusClass(item.docstatus)">
              {{ getStatusLabel(item.docstatus) }}
            </span>
          </div>
          <div class="list-grid-card-meta">
            <span>{{ formatDate(item.creation) }}</span>
            <span>{{ formatDate(item.modified) }}</span>
          </div>
        </div>
      </div>

      <!-- KANBAN VIEW -->
      <div v-else-if="viewMode === 'kanban'" class="list-kanban">
        <div
          v-for="col in kanbanColumns"
          :key="col.status"
          class="kanban-col"
        >
          <div class="kanban-col-header" :style="{ borderColor: col.color }">
            <span>{{ col.label }}</span>
            <span class="kanban-col-count">{{ col.items.length }}</span>
          </div>
          <div class="kanban-col-body">
            <div
              v-for="item in col.items"
              :key="item.name"
              class="kanban-card"
              @click="openDoc(item.name)"
            >
              <div class="kanban-card-title">{{ item.name }}</div>
              <div class="kanban-card-meta">{{ formatDate(item.modified) }}</div>
            </div>
            <div v-if="col.items.length === 0" class="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
              Kayıt yok
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <ListPagination
        v-model="currentPage"
        :total="totalCount"
        :page-size="pageSize"
        @update:model-value="loadData()"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import AppIcon from '@/components/common/AppIcon.vue'
import ListPagination from '@/components/common/ListPagination.vue'
import ViewModeToggle from '@/components/common/ViewModeToggle.vue'

const route = useRoute()
const router = useRouter()

const items = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('modified desc')
const currentPage = ref(1)
const pageSize = 12
const showCreateModal = ref(false)
const viewMode = ref('table')

const doctype = computed(() => {
  const raw = route.params.doctype || ''
  return decodeURIComponent(raw)
})

const doctypeLabel = computed(() => doctype.value || 'Döküman')

// Kanban columns derived from items
const kanbanColumns = computed(() => {
  const cols = [
    { status: 0, label: 'Taslak', color: '#f59e0b', items: [] },
    { status: 1, label: 'Onaylı', color: '#10b981', items: [] },
    { status: 2, label: 'İptal', color: '#ef4444', items: [] },
  ]
  for (const item of items.value) {
    const col = cols.find(c => c.status === item.docstatus)
    if (col) col.items.push(item)
    else cols[0].items.push(item)
  }
  return cols
})

async function loadData() {
  loading.value = true
  try {
    const filters = []
    if (searchQuery.value) {
      filters.push(['name', 'like', `%${searchQuery.value}%`])
    }
    if (statusFilter.value) {
      filters.push(['status', '=', statusFilter.value])
    }

    const res = await api.getList(doctype.value, {
      filters,
      order_by: sortBy.value,
      limit_start: (currentPage.value - 1) * pageSize,
      limit_page_length: pageSize,
    })
    items.value = res.data || []

    const countRes = await api.getCount(doctype.value, filters)
    totalCount.value = countRes.message || 0
  } catch {
    items.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function refreshList() {
  currentPage.value = 1
  loadData()
}

function openDoc(name) {
  router.push(`/app/${encodeURIComponent(doctype.value)}/${encodeURIComponent(name)}`)
}

function getStatusClass(docstatus) {
  const map = { 0: 'bg-amber-50 text-amber-600', 1: 'bg-emerald-50 text-emerald-600', 2: 'bg-red-50 text-red-600' }
  return map[docstatus] || 'bg-gray-50 text-gray-600'
}

function getStatusLabel(docstatus) {
  const map = { 0: 'Taslak', 1: 'Aktif', 2: 'İptal' }
  return map[docstatus] || 'Bilinmiyor'
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('tr-TR')
}

watch(() => route.params.doctype, () => {
  currentPage.value = 1
  loadData()
})

let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadData()
  }, 400)
})

watch([statusFilter, sortBy], () => {
  currentPage.value = 1
  loadData()
})

onMounted(loadData)
</script>
