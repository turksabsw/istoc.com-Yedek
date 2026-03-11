<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 class="text-[15px] font-bold text-gray-900">Satıcı Metrikleri</h1>
        <p class="text-xs text-gray-400">{{ totalCount }} kayıt bulundu</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="hdr-btn-outlined" @click="loadData()"><i class="fas fa-refresh mr-1.5 text-xs"></i>Yenile</button>
        <button class="hdr-btn-primary"><i class="fas fa-plus mr-1.5 text-xs"></i>Yeni Ekle</button>
      </div>
    </div>

    <!-- Search & Sort -->
    <div class="card mb-5 !p-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="relative flex-1 min-w-0">
          <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input v-model="searchQuery" type="text" placeholder="Satıcı veya kod ara..." class="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
        </div>
        <select v-model="sortBy" class="form-input-sm w-auto" @change="currentPage = 1; loadData()">
          <option value="modified desc">Son Düzenlenen</option>
          <option value="total_orders desc">En Çok Sipariş</option>
          <option value="avg_rating desc">En Yüksek Puan</option>
          <option value="total_sales_amount desc">En Yüksek Satış</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl text-violet-500"></i>
      <p class="text-sm text-gray-400 mt-3">Yükleniyor...</p>
    </div>

    <!-- Empty -->
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
              <th class="tbl-th">SATICI</th>
              <th class="tbl-th text-center">SİPARİŞ</th>
              <th class="tbl-th text-center">SATIŞ</th>
              <th class="tbl-th text-center">PUAN</th>
              <th class="tbl-th text-center">TESLİMAT</th>
              <th class="tbl-th text-center">İPTAL</th>
              <th class="tbl-th text-center">İADE</th>
              <th class="tbl-th">TARİH</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items" :key="item.name"
              class="tbl-row border-b border-gray-50 cursor-pointer transition-colors hover:bg-violet-50/30"
              @click="$router.push(`/app/seller-metrics/${encodeURIComponent(item.name)}`)"
            >
              <td class="tbl-td">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" :class="getColor(item.seller)">{{ (item.seller || '?')[0] }}</div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold truncate">{{ item.seller || item.name }}</p>
                    <p class="text-[10px] text-gray-400">{{ item.name }}</p>
                  </div>
                </div>
              </td>
              <td class="tbl-td text-center"><span class="text-xs font-bold text-gray-700 dark:text-gray-200">{{ item.total_orders || 0 }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-semibold text-emerald-500">{{ formatCurrency(item.total_sales_amount) }}</span></td>
              <td class="tbl-td text-center">
                <div class="flex items-center justify-center gap-0.5">
                  <i class="fas fa-star text-[9px] text-yellow-400"></i>
                  <span class="text-xs font-bold text-gray-700 dark:text-gray-200">{{ (item.avg_rating || 0).toFixed(1) }}</span>
                </div>
              </td>
              <td class="tbl-td text-center"><span class="text-xs font-semibold" :style="{ color: getRateColor(item.on_time_delivery_rate, true) }">%{{ (item.on_time_delivery_rate || 0).toFixed(1) }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-semibold" :style="{ color: getRateColor(item.cancellation_rate, false) }">%{{ (item.cancellation_rate || 0).toFixed(1) }}</span></td>
              <td class="tbl-td text-center"><span class="text-xs font-semibold" :style="{ color: getRateColor(item.return_rate, false) }">%{{ (item.return_rate || 0).toFixed(1) }}</span></td>
              <td class="tbl-td"><span class="text-[10px] text-gray-500">{{ formatDate(item.calculation_date) }}</span></td>
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
const sortBy = ref('modified desc')
const currentPage = ref(1)
const pageSize = 20

const listFields = ['name','seller','seller_name','calculation_date','total_orders','total_sales_amount','avg_rating','return_rate','on_time_delivery_rate','cancellation_rate','modified']

async function loadData() {
  loading.value = true
  try {
    const filters = []
    if (searchQuery.value) filters.push(['seller', 'like', `%${searchQuery.value}%`])
    const res = await api.getList('Seller Metrics', { fields: listFields, filters, order_by: sortBy.value, limit_start: (currentPage.value - 1) * pageSize, limit_page_length: pageSize })
    items.value = res.data || []
    const c = await api.getCount('Seller Metrics', filters)
    totalCount.value = c.message || 0
  } catch { items.value = []; totalCount.value = 0 } finally { loading.value = false }
}

function formatCurrency(v) { if (v == null) return '-'; return Number(v).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }) }
function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('tr-TR') }
function getColor(s) { const c = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500']; return c[(s||'').charCodeAt((s||'').length-1||0) % c.length] }
function getRateColor(v, higherBetter) { if (higherBetter) return v >= 90 ? '#10b981' : v >= 70 ? '#f59e0b' : '#ef4444'; return v <= 5 ? '#10b981' : v <= 15 ? '#f59e0b' : '#ef4444' }

let t; watch(searchQuery, () => { clearTimeout(t); t = setTimeout(() => { currentPage.value = 1; loadData() }, 400) })
onMounted(loadData)
</script>
