<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-[15px] font-bold text-gray-900">KPI Şablonları</h1>
        <p class="text-xs text-gray-400">{{ totalCount }} kayıt bulundu</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="hdr-btn-outlined" @click="loadData()"><i class="fas fa-refresh mr-1.5 text-xs"></i>Yenile</button>
        <button class="hdr-btn-primary"><i class="fas fa-plus mr-1.5 text-xs"></i>Yeni Ekle</button>
      </div>
    </div>

    <!-- Status Filter -->
    <div class="flex items-center gap-2 flex-wrap mb-4">
      <button v-for="s in statusFilters" :key="s.value" class="status-pill" :class="{ active: activeStatus === s.value }" @click="activeStatus = s.value; currentPage = 1; loadData()">
        <span class="w-2 h-2 rounded-full mr-2" :class="s.dot"></span>{{ s.label }}
      </button>
    </div>

    <!-- Search -->
    <div class="card mb-5 !p-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="relative flex-1 min-w-0">
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input v-model="searchQuery" type="text" placeholder="Şablon ara..." class="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
        </div>
        <select v-model="sortBy" class="form-input-sm w-auto" @change="currentPage = 1; loadData()">
          <option value="modified desc">Son Düzenlenen</option>
          <option value="name asc">İsim (A-Z)</option>
          <option value="usage_count desc">En Çok Kullanılan</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-12"><i class="fas fa-spinner fa-spin text-2xl text-violet-500"></i></div>
    <div v-else-if="items.length === 0" class="card text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center"><i class="fas fa-inbox text-2xl text-gray-500 dark:text-gray-300"></i></div>
      <h3 class="text-sm font-bold text-gray-700 mb-1">Henüz kayıt yok</h3>
    </div>

    <!-- Table -->
    <div v-else class="card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="tbl-th">ŞABLON ADI</th>
              <th class="tbl-th">DURUM</th>
              <th class="tbl-th">HEDEF TİPİ</th>
              <th class="tbl-th text-center">DÖNEM</th>
              <th class="tbl-th text-center">SIKLIK</th>
              <th class="tbl-th text-center">AĞIRLIK</th>
              <th class="tbl-th text-center">GEÇ. PUAN</th>
              <th class="tbl-th text-center">KULLANIM</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.name"
              class="tbl-row border-b border-gray-50 cursor-pointer transition-colors hover:bg-violet-50/30"
              @click="$router.push(`/app/kpi-template/${encodeURIComponent(item.name)}`)"
            >
              <td class="tbl-td">
                <div class="min-w-0">
                  <p class="text-xs font-semibold truncate max-w-[280px]">{{ item.template_name || item.name }}</p>
                  <p class="text-[10px] text-gray-400 truncate">{{ item.template_code || item.name }}</p>
                </div>
              </td>
              <td class="tbl-td">
                <span class="tpl-status-badge" :class="getTplStatusCls(item.status)">
                  <span class="tpl-dot"></span>{{ getTplStatusLabel(item.status) }}
                </span>
              </td>
              <td class="tbl-td"><span class="text-xs text-gray-500 dark:text-gray-300">{{ item.target_type || '-' }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-medium text-gray-400">{{ getPeriodLabel(item.evaluation_period) }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-medium text-gray-400">{{ getFreqLabel(item.evaluation_frequency) }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-bold text-gray-500 dark:text-gray-300">{{ item.weight || 0 }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-bold text-violet-400">{{ item.passing_score || 0 }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-semibold text-gray-400">{{ item.usage_count || 0 }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">{{ items.length }} / {{ totalCount }}</span>
        <div class="flex items-center gap-1">
          <button class="hdr-btn text-xs" :disabled="currentPage === 1" @click="currentPage--; loadData()"><i class="fas fa-chevron-left"></i></button>
          <span class="text-xs text-gray-600 px-2">{{ currentPage }}</span>
          <button class="hdr-btn text-xs" :disabled="items.length < pageSize" @click="currentPage++; loadData()"><i class="fas fa-chevron-right"></i></button>
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
const sortBy = ref('modified desc')
const currentPage = ref(1)
const pageSize = 20

const statusFilters = [
  { value: '', label: 'Tümü', dot: 'bg-violet-400' },
  { value: 'Active', label: 'Aktif', dot: 'bg-emerald-400' },
  { value: 'Inactive', label: 'Pasif', dot: 'bg-gray-400' },
  { value: 'Deprecated', label: 'Kullanım Dışı', dot: 'bg-red-400' },
]

const listFields = ['name','template_name','template_code','status','target_type','evaluation_period','evaluation_frequency','weight','passing_score','usage_count','modified']

async function loadData() {
  loading.value = true
  try {
    const filters = []
    if (activeStatus.value) filters.push(['status', '=', activeStatus.value])
    if (searchQuery.value) filters.push(['name', 'like', `%${searchQuery.value}%`])
    const res = await api.getList('KPI Template', { fields: listFields, filters, order_by: sortBy.value, limit_start: (currentPage.value - 1) * pageSize, limit_page_length: pageSize })
    items.value = res.data || []
    const c = await api.getCount('KPI Template', filters)
    totalCount.value = c.message || 0
  } catch { items.value = []; totalCount.value = 0 } finally { loading.value = false }
}

function getTplStatusCls(s) { return { Active: 'tpl-active', Inactive: 'tpl-inactive', Deprecated: 'tpl-deprecated' }[s] || 'tpl-inactive' }
function getTplStatusLabel(s) { return { Active: 'Aktif', Inactive: 'Pasif', Deprecated: 'Kullanım Dışı' }[s] || s || '-' }
function getPeriodLabel(p) { return { Daily: 'Günlük', Weekly: 'Haftalık', Monthly: 'Aylık', Quarterly: 'Çeyreklik', Yearly: 'Yıllık' }[p] || p || '-' }
function getFreqLabel(f) { return { Daily: 'Günlük', Weekly: 'Haftalık', Monthly: 'Aylık', Quarterly: 'Çeyreklik' }[f] || f || '-' }

let t; watch(searchQuery, () => { clearTimeout(t); t = setTimeout(() => { currentPage.value = 1; loadData() }, 400) })
onMounted(loadData)
</script>

<style scoped>
.status-pill {
  display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.15s;
  background: var(--th-surface-card, #1e1e2e); color: var(--th-text-secondary, #9ca3af); border: 1px solid var(--th-surface-border, #2d2d3d);
}
.status-pill:hover { border-color: #a78bfa; color: #c4b5fd; }
.status-pill.active { background: #7c3aed; color: white; border-color: #7c3aed; }

.tpl-status-badge {
  display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 6px; white-space: nowrap;
}
.tpl-status-badge .tpl-dot { width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; flex-shrink: 0; }
.tpl-active { background: var(--th-kpi-active-bg); color: var(--th-kpi-active-fg); }
.tpl-active .tpl-dot { background: var(--th-kpi-active-dot); }
.tpl-inactive { background: var(--th-kpi-draft-bg); color: var(--th-kpi-draft-fg); }
.tpl-inactive .tpl-dot { background: var(--th-kpi-draft-dot); }
.tpl-deprecated { background: var(--th-kpi-critical-bg); color: var(--th-kpi-critical-fg); }
.tpl-deprecated .tpl-dot { background: var(--th-kpi-critical-dot); }
</style>
