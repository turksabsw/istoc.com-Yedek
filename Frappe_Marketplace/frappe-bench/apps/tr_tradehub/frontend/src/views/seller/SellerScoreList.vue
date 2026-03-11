<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-[15px] font-bold text-gray-900">Seller Score</h1>
        <p class="text-xs text-gray-400">{{ totalCount }} kayıt bulundu</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="hdr-btn-outlined" @click="loadData()">
          <i class="fas fa-refresh mr-1.5 text-xs"></i>Yenile
        </button>
        <button class="hdr-btn-primary">
          <i class="fas fa-plus mr-1.5 text-xs"></i>Yeni Ekle
        </button>
      </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 flex-wrap mb-4">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        class="status-pill"
        :class="[{ active: activeStatus === s.value }, s.colorClass || '']"
        @click="activeStatus = s.value; currentPage = 1; loadData()"
      >
        <span class="w-2 h-2 rounded-full mr-2" :class="s.dot"></span>
        {{ s.label }}
      </button>
    </div>

    <!-- Search -->
    <div class="card mb-5 !p-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="relative flex-1 min-w-0">
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Seller Score ara..."
            class="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          >
        </div>
        <select v-model="scoreTypeFilter" class="form-input-sm w-auto" @change="currentPage = 1; loadData()">
          <option value="">Tüm Tipler</option>
          <option v-for="t in scoreTypes" :key="t" :value="t">{{ t }}</option>
        </select>
        <select v-model="sortBy" class="form-input-sm w-auto" @change="currentPage = 1; loadData()">
          <option value="calculation_date desc">Son Hesaplama</option>
          <option value="overall_score desc">En Yüksek Puan</option>
          <option value="overall_score asc">En Düşük Puan</option>
          <option value="modified desc">Son Düzenlenen</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl text-violet-500"></i>
      <p class="text-sm text-gray-400 mt-3">Yükleniyor...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="card text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
        <i class="fas fa-inbox text-2xl text-gray-500 dark:text-gray-300"></i>
      </div>
      <h3 class="text-sm font-bold text-gray-700 mb-1">Henüz kayıt yok</h3>
      <p class="text-xs text-gray-400">Bu filtrelere uygun Seller Score kaydı bulunamadı</p>
    </div>

    <!-- Rich Table -->
    <div v-else class="card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="tbl-th">SATICI</th>
              <th class="tbl-th">SKOR TİPİ</th>
              <th class="tbl-th">DURUM</th>
              <th class="tbl-th text-center">GENEL SKOR</th>
              <th class="tbl-th text-center">TESLİMAT</th>
              <th class="tbl-th text-center">KALİTE</th>
              <th class="tbl-th text-center">HİZMET</th>
              <th class="tbl-th">HESAPLAMA</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.name"
              class="tbl-row border-b border-gray-50 cursor-pointer transition-colors hover:bg-violet-50/30"
              @click="$router.push(`/app/seller-score/${encodeURIComponent(item.name)}`)"
            >
              <td class="tbl-td">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" :class="getSellerColor(item.seller)">
                    {{ (item.seller || '?')[0] }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold truncate">{{ item.seller }}</p>
                    <p class="text-[10px] text-gray-400 truncate">{{ item.score_period || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="tbl-td">
                <span class="score-type-badge" :class="'type-' + (item.score_type || '').toLowerCase()">
                  <i :class="getTypeIcon(item.score_type)" class="mr-1 text-[8px]"></i>
                  {{ item.score_type }}
                </span>
              </td>
              <td class="tbl-td">
                <span class="status-badge" :class="'st-' + (item.status || '').toLowerCase().replace(/\s+/g, '-')">
                  <span class="st-dot"></span>
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td class="tbl-td text-center">
                <span class="text-sm font-bold" :style="{ color: getScoreColor(item.overall_score) }">
                  {{ formatScore(item.overall_score) }}
                </span>
              </td>
              <td class="tbl-td text-center">
                <span class="text-xs text-gray-500">{{ formatScore(item.delivery_score) }}</span>
              </td>
              <td class="tbl-td text-center">
                <span class="text-xs text-gray-500">{{ formatScore(item.quality_score) }}</span>
              </td>
              <td class="tbl-td text-center">
                <span class="text-xs text-gray-500">{{ formatScore(item.service_score) }}</span>
              </td>
              <td class="tbl-td">
                <span class="text-xs text-gray-400">{{ formatDate(item.calculation_date) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">{{ items.length }} / {{ totalCount }} kayıt</span>
        <div class="flex items-center gap-1">
          <button class="hdr-btn text-xs" :disabled="currentPage === 1" @click="currentPage--; loadData()">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="text-xs text-gray-600 px-2">{{ currentPage }}</span>
          <button class="hdr-btn text-xs" :disabled="items.length < pageSize" @click="currentPage++; loadData()">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '@/utils/api'

const items = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchQuery = ref('')
const activeStatus = ref('')
const scoreTypeFilter = ref('')
const sortBy = ref('calculation_date desc')
const currentPage = ref(1)
const pageSize = 20

const statusFilters = [
  { value: '', label: 'Tümü', dot: 'bg-violet-400' },
  { value: 'Draft', label: 'Taslak', dot: 'bg-gray-400' },
  { value: 'Calculating', label: 'Hesaplanıyor', dot: 'bg-blue-400' },
  { value: 'Pending Review', label: 'İncelemede', dot: 'bg-amber-400' },
  { value: 'Finalized', label: 'Onaylandı', dot: 'bg-emerald-400' },
  { value: 'Revised', label: 'Revize', dot: 'bg-purple-400' },
  { value: 'Appealed', label: 'İtiraz', dot: 'bg-red-400' },
]

const scoreTypes = ['Weekly', 'Monthly', 'Periodic', 'Annual', 'Daily', 'Lifetime', 'Manual']

const listFields = [
  'name', 'seller', 'score_type', 'score_period', 'status',
  'overall_score', 'delivery_score', 'quality_score', 'service_score',
  'calculation_date', 'modified',
]

async function loadData() {
  loading.value = true
  try {
    const filters = []
    if (activeStatus.value) filters.push(['status', '=', activeStatus.value])
    if (scoreTypeFilter.value) filters.push(['score_type', '=', scoreTypeFilter.value])
    if (searchQuery.value) filters.push(['name', 'like', `%${searchQuery.value}%`])

    const res = await api.getList('Seller Score', {
      fields: listFields,
      filters,
      order_by: sortBy.value,
      limit_start: (currentPage.value - 1) * pageSize,
      limit_page_length: pageSize,
    })
    items.value = res.data || []

    const countRes = await api.getCount('Seller Score', filters)
    totalCount.value = countRes.message || 0
  } catch {
    items.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

function formatScore(val) {
  if (val == null) return '-'
  return Number(val).toFixed(2).replace(/\.?0+$/, '')
}

function getScoreColor(score) {
  if (score >= 4000) return '#10b981'
  if (score >= 3000) return '#3b82f6'
  if (score >= 2000) return '#f59e0b'
  return '#ef4444'
}

function getSellerColor(seller) {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
  const idx = (seller || '').charCodeAt(seller?.length - 1 || 0) % colors.length
  return colors[idx]
}

function getTypeIcon(type) {
  const map = {
    Weekly: 'fas fa-calendar-week', Monthly: 'fas fa-calendar', Annual: 'fas fa-calendar-check',
    Daily: 'fas fa-calendar-day', Periodic: 'fas fa-clock-rotate-left', Lifetime: 'fas fa-infinity', Manual: 'fas fa-pen',
  }
  return map[type] || 'fas fa-chart-simple'
}

function getStatusClass(status) {
  const map = {
    Draft: 'bg-gray-100 text-gray-600',
    Calculating: 'bg-blue-50 text-blue-600',
    'Pending Review': 'bg-amber-50 text-amber-600',
    Finalized: 'bg-emerald-50 text-emerald-600',
    Revised: 'bg-purple-50 text-purple-600',
    Appealed: 'bg-red-50 text-red-600',
  }
  return map[status] || 'bg-gray-50 text-gray-500'
}

function getStatusLabel(status) {
  const map = {
    Draft: 'Taslak', Calculating: 'Hesaplanıyor', 'Pending Review': 'İncelemede',
    Finalized: 'Onaylandı', Revised: 'Revize', Appealed: 'İtiraz',
  }
  return map[status] || status
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('tr-TR')
}

// Debounced search
let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { currentPage.value = 1; loadData() }, 400)
})

onMounted(loadData)
</script>

<style scoped>
/* Status filter pills — RFQ style dark pills with colored dots */
.status-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--th-surface-card, #1e1e2e);
  color: var(--th-text-secondary, #9ca3af);
  border: 1px solid var(--th-surface-border, #2d2d3d);
}
.status-pill:hover {
  border-color: #a78bfa;
  color: #c4b5fd;
}
.status-pill.active {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

/* Score type badges — uses global --th-type-* vars */
.score-type-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.type-weekly   { background: var(--th-type-weekly-bg);   color: var(--th-type-weekly-fg); }
.type-monthly  { background: var(--th-type-monthly-bg);  color: var(--th-type-monthly-fg); }
.type-annual   { background: var(--th-type-annual-bg);   color: var(--th-type-annual-fg); }
.type-daily    { background: var(--th-type-daily-bg);    color: var(--th-type-daily-fg); }
.type-periodic { background: var(--th-type-periodic-bg); color: var(--th-type-periodic-fg); }
.type-lifetime { background: var(--th-type-lifetime-bg); color: var(--th-type-lifetime-fg); }
.type-manual   { background: var(--th-type-manual-bg);   color: var(--th-type-manual-fg); }

/* Status badges — uses global --th-st-* vars */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  white-space: nowrap;
}
.status-badge .st-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}
.st-draft          { background: var(--th-st-draft-bg);          color: var(--th-st-draft-fg); }
.st-draft .st-dot  { background: var(--th-st-draft-dot); }
.st-calculating          { background: var(--th-st-calculating-bg);    color: var(--th-st-calculating-fg); }
.st-calculating .st-dot  { background: var(--th-st-calculating-dot); }
.st-pending-review          { background: var(--th-st-pending-review-bg); color: var(--th-st-pending-review-fg); }
.st-pending-review .st-dot  { background: var(--th-st-pending-review-dot); }
.st-finalized          { background: var(--th-st-finalized-bg);      color: var(--th-st-finalized-fg); }
.st-finalized .st-dot  { background: var(--th-st-finalized-dot); }
.st-revised          { background: var(--th-st-revised-bg);        color: var(--th-st-revised-fg); }
.st-revised .st-dot  { background: var(--th-st-revised-dot); }
.st-appealed          { background: var(--th-st-appealed-bg);       color: var(--th-st-appealed-fg); }
.st-appealed .st-dot  { background: var(--th-st-appealed-dot); }
</style>
