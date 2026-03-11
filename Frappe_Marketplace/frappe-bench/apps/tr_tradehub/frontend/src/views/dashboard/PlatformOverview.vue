<template>
  <div>
    <!-- Global Filter Bar -->
    <GlobalFilterBar>
      <template #actions>
        <button
          class="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
          style="background: var(--th-brand-50); color: var(--th-brand-500)"
          @click="refreshAll"
        >
          <i class="fas fa-arrows-rotate text-[10px] mr-1"></i> Yenile
        </button>
      </template>
    </GlobalFilterBar>

    <!-- Top KPI Row — Platform Aggregate -->
    <DashboardGrid>
      <KpiCard title="Toplam Gelir" value="₺12,847,390" icon="fas fa-turkish-lira-sign" iconBg="bg-violet-50" iconColor="text-violet-500" change="18.4" :changePositive="true" />
      <KpiCard title="Toplam Sipariş" value="5,248" icon="fas fa-bag-shopping" iconBg="bg-blue-50" iconColor="text-blue-500" change="12.1" :changePositive="true" />
      <KpiCard title="Aktif Satıcılar" value="847" icon="fas fa-store" iconBg="bg-emerald-50" iconColor="text-emerald-500" change="14.2" :changePositive="true" />
      <KpiCard title="Aktif Ürünler" value="12,847" icon="fas fa-cube" iconBg="bg-amber-50" iconColor="text-amber-500" change="8.3" :changePositive="true" />
    </DashboardGrid>

    <!-- ═══════════════════════════════════════════════════════
         MODULE SUMMARY CARDS — Her modülden özet veri
         ═══════════════════════════════════════════════════════ -->

    <!-- Row 1: Siparişler + Ödemeler -->
    <DashboardGrid class="mt-5">
      <!-- ── SİPARİŞLER ──────────────────────────────────── -->
      <WidgetWrapper title="Siparişler" subtitle="Sipariş akışı ve durum dağılımı" size="lg">
        <template #actions>
          <router-link to="/dashboard/orders" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">4,691</span>
            <span class="th-mini-stat-label">Tamamlanan</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-blue-500">384</span>
            <span class="th-mini-stat-label">İşlemde</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-red-500">73</span>
            <span class="th-mini-stat-label">İptal</span>
          </div>
        </div>

        <BaseChart :option="ordersDonutOption" height="200px" />
      </WidgetWrapper>

      <!-- ── ÖDEMELER ────────────────────────────────────── -->
      <WidgetWrapper title="Ödemeler" subtitle="Ödeme yöntemleri ve başarı oranı" size="lg">
        <template #actions>
          <router-link to="/dashboard/payments" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">₺10.2M</span>
            <span class="th-mini-stat-label">Başarılı</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-amber-500">₺1.8M</span>
            <span class="th-mini-stat-label">Beklemede</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-violet-500">%96.8</span>
            <span class="th-mini-stat-label">Başarı Oranı</span>
          </div>
        </div>

        <BaseChart :option="paymentsBarOption" height="200px" />
      </WidgetWrapper>
    </DashboardGrid>

    <!-- Row 2: Satıcılar + Katalog -->
    <DashboardGrid class="mt-5">
      <!-- ── SATICILAR ──────────────────────────────────── -->
      <WidgetWrapper title="Satıcılar" subtitle="Satıcı performansı ve seviye dağılımı" size="lg">
        <template #actions>
          <router-link to="/dashboard/sellers" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-4 gap-2 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-violet-500">42</span>
            <span class="th-mini-stat-label">Platin</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-amber-500">156</span>
            <span class="th-mini-stat-label">Altın</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-gray-400">312</span>
            <span class="th-mini-stat-label">Gümüş</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value" style="color:#92400e">337</span>
            <span class="th-mini-stat-label">Bronz</span>
          </div>
        </div>

        <BaseChart :option="sellersRadarOption" height="200px" />
      </WidgetWrapper>

      <!-- ── KATALOG ─────────────────────────────────────── -->
      <WidgetWrapper title="Katalog" subtitle="Ürün ve kategori dağılımı" size="lg">
        <template #actions>
          <router-link to="/dashboard/catalog" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">9,245</span>
            <span class="th-mini-stat-label">Aktif</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-gray-400">2,100</span>
            <span class="th-mini-stat-label">Pasif</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-amber-500">1,502</span>
            <span class="th-mini-stat-label">Draft</span>
          </div>
        </div>

        <BaseChart :option="catalogBarOption" height="200px" />
      </WidgetWrapper>
    </DashboardGrid>

    <!-- Row 3: Lojistik + Pazarlama + Uyumluluk -->
    <DashboardGrid class="mt-5">
      <!-- ── LOJİSTİK ────────────────────────────────────── -->
      <WidgetWrapper title="Lojistik" subtitle="Teslimat ve SLA performansı" size="md">
        <template #actions>
          <router-link to="/dashboard/logistics" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-blue-500">1,247</span>
            <span class="th-mini-stat-label">Aktif Gönderi</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">2.8 gün</span>
            <span class="th-mini-stat-label">Ort. Teslimat</span>
          </div>
        </div>

        <BaseChart :option="logisticsGaugeOption" height="180px" />
      </WidgetWrapper>

      <!-- ── PAZARLAMA ───────────────────────────────────── -->
      <WidgetWrapper title="Pazarlama" subtitle="Kampanya ROI ve kupon kullanımı" size="md">
        <template #actions>
          <router-link to="/dashboard/marketing" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-violet-500">12</span>
            <span class="th-mini-stat-label">Aktif Kampanya</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">%342</span>
            <span class="th-mini-stat-label">ROI</span>
          </div>
        </div>

        <BaseChart :option="marketingBarOption" height="180px" />
      </WidgetWrapper>

      <!-- ── UYUMLULUK ───────────────────────────────────── -->
      <WidgetWrapper title="Uyumluluk" subtitle="KYC ve risk durumu" size="md">
        <template #actions>
          <router-link to="/dashboard/compliance" class="th-module-link">
            Detay <i class="fas fa-arrow-right text-[9px] ml-1"></i>
          </router-link>
        </template>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-emerald-500">%94.2</span>
            <span class="th-mini-stat-label">KYC Tamamlama</span>
          </div>
          <div class="th-mini-stat">
            <span class="th-mini-stat-value text-blue-500">28/100</span>
            <span class="th-mini-stat-label">Risk Skoru</span>
          </div>
        </div>

        <BaseChart :option="complianceDonutOption" height="180px" />
      </WidgetWrapper>
    </DashboardGrid>

    <!-- ═══════════════════════════════════════════════════════
         BOTTOM: Gelir Trendi + Son Siparişler + Aktiviteler
         ═══════════════════════════════════════════════════════ -->
    <DashboardGrid class="mt-5">
      <!-- Gelir Trendi (Platform Geneli) -->
      <WidgetWrapper title="Platform Gelir Trendi" subtitle="Son 12 aylık toplam gelir" size="xl">
        <template #actions>
          <div class="th-tab-group">
            <button v-for="tab in ['Aylık', 'Haftalık']" :key="tab" class="th-tab-btn" :class="{ active: activeRevenueTab === tab }" @click="activeRevenueTab = tab">{{ tab }}</button>
          </div>
        </template>
        <BaseChart :option="revenueOption" height="280px" />
      </WidgetWrapper>

      <!-- Son Aktiviteler -->
      <WidgetWrapper title="Son Aktiviteler" subtitle="Platform geneli" size="md">
        <div class="relative">
          <div class="absolute left-[11px] top-2 bottom-2 w-px" style="background: var(--th-surface-border)"></div>
          <div class="space-y-4">
            <div v-for="act in activities" :key="act.text" class="flex gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10" :class="act.dotBg">
                <i :class="[act.dotIcon, act.dotColor, 'text-[9px]']"></i>
              </div>
              <div>
                <p class="text-xs" v-html="act.text"></p>
                <p class="text-[10px] mt-0.5" style="color: var(--th-neutral)">{{ act.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </WidgetWrapper>
    </DashboardGrid>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DashboardGrid from '@/components/dashboard/layout/DashboardGrid.vue'
import WidgetWrapper from '@/components/dashboard/layout/WidgetWrapper.vue'
import KpiCard from '@/components/dashboard/widgets/KpiCard.vue'
import BaseChart from '@/components/dashboard/charts/BaseChart.vue'
import GlobalFilterBar from '@/components/dashboard/filters/GlobalFilterBar.vue'
import { MONTHS_TR, CHART_PALETTE } from '@/constants/dashboard'
import { useTheme } from '@/composables/useTheme'

const { currentTheme } = useTheme()
const isDark = computed(() => currentTheme.value === 'dark')

const activeRevenueTab = ref('Aylık')

// ═══════════════════════════════════════════════════════════════
// SİPARİŞ MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const ordersDonutOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
  series: [{
    type: 'pie', radius: ['50%', '75%'], center: ['50%', '42%'],
    itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: isDark.value ? '#1e1e2e' : '#ffffff' },
    label: { show: true, position: 'center',
      formatter: '{total|5,248}\n{sub|Sipariş}',
      rich: { total: { fontSize: 20, fontWeight: 700, color: isDark.value ? '#e5e7eb' : '#1f2937', lineHeight: 28 }, sub: { fontSize: 10, color: '#9ca3af', lineHeight: 16 } },
    },
    data: [
      { value: 4691, name: 'Tamamlanan', itemStyle: { color: '#10b981' } },
      { value: 384, name: 'İşlemde', itemStyle: { color: '#3b82f6' } },
      { value: 100, name: 'Beklemede', itemStyle: { color: '#f59e0b' } },
      { value: 73, name: 'İptal', itemStyle: { color: '#ef4444' } },
    ],
  }],
}))

// ═══════════════════════════════════════════════════════════════
// ÖDEME MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const paymentsBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 8, right: 8, bottom: 20, left: 8, containLabel: true },
  xAxis: { type: 'category', data: MONTHS_TR.slice(-6), axisLabel: { fontSize: 9 } },
  yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: '{value}K' } },
  series: [
    { name: 'Kredi Kartı', type: 'bar', stack: 'total', data: [530, 560, 580, 610, 640, 680], itemStyle: { color: CHART_PALETTE[3], borderRadius: [0, 0, 0, 0] } },
    { name: 'Havale', type: 'bar', stack: 'total', data: [360, 380, 400, 420, 450, 470], itemStyle: { color: CHART_PALETTE[1] } },
    { name: 'Escrow', type: 'bar', stack: 'total', data: [190, 210, 230, 245, 260, 280], itemStyle: { color: CHART_PALETTE[5], borderRadius: [3, 3, 0, 0] } },
  ],
}))

// ═══════════════════════════════════════════════════════════════
// SATICI MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const sellersRadarOption = computed(() => ({
  tooltip: {},
  radar: {
    indicator: [
      { name: 'Teslimat', max: 100 }, { name: 'Kalite', max: 100 },
      { name: 'Hizmet', max: 100 }, { name: 'Uyum', max: 100 },
      { name: 'Tedarik', max: 100 }, { name: 'İletişim', max: 100 },
    ],
    radius: '60%',
    axisName: { fontSize: 9 },
  },
  series: [{
    type: 'radar',
    data: [
      { value: [92, 88, 95, 78, 85, 90], name: 'Top Satıcı', areaStyle: { opacity: 0.3 } },
      { value: [75, 72, 70, 68, 71, 74], name: 'Platform Ort.', lineStyle: { type: 'dashed' }, areaStyle: { opacity: 0.1 } },
    ],
  }],
}))

// ═══════════════════════════════════════════════════════════════
// KATALOG MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const catalogBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 8, right: 30, bottom: 8, left: 8, containLabel: true },
  xAxis: { type: 'value', axisLabel: { fontSize: 9 } },
  yAxis: { type: 'category', data: ['Kimyasallar', 'Yapı Malz.', 'Hammadde', 'Ambalaj'], inverse: true, axisLabel: { fontSize: 9 } },
  series: [{
    type: 'bar', data: [3200, 2800, 2100, 1500], barWidth: 12,
    itemStyle: { borderRadius: [0, 5, 5, 0], color: (p) => CHART_PALETTE[p.dataIndex] },
    label: { show: true, position: 'right', fontSize: 9, fontWeight: 600 },
  }],
}))

// ═══════════════════════════════════════════════════════════════
// LOJİSTİK MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const logisticsGaugeOption = computed(() => ({
  series: [{
    type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 100, radius: '85%',
    axisLine: { lineStyle: { width: 10, color: [[0.7, '#ef4444'], [0.9, '#f59e0b'], [1, '#10b981']] } },
    axisTick: { show: false }, splitLine: { show: false },
    axisLabel: { distance: 10, fontSize: 8 },
    pointer: { length: '55%', width: 4, itemStyle: { color: '#6c5dd3' } },
    anchor: { show: true, size: 6, itemStyle: { color: '#6c5dd3', borderWidth: 2 } },
    title: { show: true, offsetCenter: [0, '72%'], fontSize: 10, fontWeight: 600 },
    detail: { valueAnimation: true, fontSize: 20, fontWeight: 700, color: isDark.value ? '#e5e7eb' : '#1f2937', offsetCenter: [0, '42%'], formatter: '{value}%' },
    data: [{ value: 94.2, name: 'SLA Uyumu' }],
  }],
}))

// ═══════════════════════════════════════════════════════════════
// PAZARLAMA MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const marketingBarOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 9 } },
  grid: { top: 10, right: 8, bottom: 28, left: 8, containLabel: true },
  xAxis: { type: 'category', data: MONTHS_TR.slice(-6), axisLabel: { fontSize: 8 } },
  yAxis: [
    { type: 'value', axisLabel: { fontSize: 8, formatter: '{value}K' } },
    { type: 'value', axisLabel: { fontSize: 8, formatter: '{value}%' } },
  ],
  series: [
    { name: 'Harcama', type: 'bar', data: [45, 52, 48, 62, 58, 72], itemStyle: { borderRadius: [3, 3, 0, 0], color: CHART_PALETTE[0] }, barWidth: 8 },
    { name: 'ROI', type: 'line', yAxisIndex: 1, data: [267, 279, 288, 298, 307, 342], smooth: true, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 4 },
  ],
}))

// ═══════════════════════════════════════════════════════════════
// UYUMLULUK MODÜLÜnden özet data
// ═══════════════════════════════════════════════════════════════
const complianceDonutOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 9 } },
  series: [{
    type: 'pie', radius: ['48%', '72%'], center: ['50%', '40%'],
    itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: isDark.value ? '#1e1e2e' : '#ffffff' },
    label: { show: true, position: 'center',
      formatter: '{total|847}\n{sub|Satıcı}',
      rich: { total: { fontSize: 18, fontWeight: 700, color: isDark.value ? '#e5e7eb' : '#1f2937', lineHeight: 24 }, sub: { fontSize: 9, color: '#9ca3af', lineHeight: 14 } },
    },
    data: [
      { value: 798, name: 'KYC Onaylı', itemStyle: { color: '#10b981' } },
      { value: 18, name: 'Beklemede', itemStyle: { color: '#f59e0b' } },
      { value: 31, name: 'Eksik/Red', itemStyle: { color: '#ef4444' } },
    ],
  }],
}))

// ═══════════════════════════════════════════════════════════════
// PLATFORM GELİR TRENDİ (tüm modüller)
// ═══════════════════════════════════════════════════════════════
const revenueOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } },
  grid: { top: 20, right: 16, bottom: 36, left: 48 },
  xAxis: { type: 'category', data: MONTHS_TR },
  yAxis: { type: 'value', axisLabel: { formatter: '₺{value}K' } },
  series: [
    {
      name: 'Sipariş Geliri', type: 'line', smooth: true,
      data: [580, 620, 610, 680, 720, 760, 740, 810, 850, 890, 940, 1020],
      lineStyle: { width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.15)' }, { offset: 1, color: 'rgba(99,102,241,0)' }] } },
    },
    {
      name: 'Komisyon', type: 'line', smooth: true,
      data: [42, 48, 45, 52, 56, 58, 55, 62, 68, 72, 78, 85],
      lineStyle: { width: 2, type: 'dashed' },
    },
  ],
  animationDuration: 1000,
}))

// ═══════════════════════════════════════════════════════════════
// AKTİVİTELER (7 modülden karışık)
// ═══════════════════════════════════════════════════════════════
const activities = [
  { text: '<b>Sipariş</b> — #ORD-7291 tamamlandı · Mega Yapı A.Ş.', time: '5 dk önce', dotBg: 'bg-emerald-100', dotIcon: 'fas fa-check', dotColor: 'text-emerald-500' },
  { text: '<b>Ödeme</b> — ₺245,000 escrow serbest bırakıldı', time: '12 dk önce', dotBg: 'bg-violet-100', dotIcon: 'fas fa-lock-open', dotColor: 'text-violet-500' },
  { text: '<b>Lojistik</b> — #SHP-2891 İstanbul deposundan yola çıktı', time: '23 dk önce', dotBg: 'bg-blue-100', dotIcon: 'fas fa-truck', dotColor: 'text-blue-500' },
  { text: '<b>Satıcı</b> — Delta Kimya Ltd. "Altın" seviyeye yükseldi', time: '1 saat önce', dotBg: 'bg-amber-100', dotIcon: 'fas fa-medal', dotColor: 'text-amber-500' },
  { text: '<b>Katalog</b> — 12 yeni ürün onaylandı', time: '2 saat önce', dotBg: 'bg-purple-100', dotIcon: 'fas fa-box', dotColor: 'text-purple-500' },
  { text: '<b>Pazarlama</b> — "Bahar Kampanyası" aktif edildi', time: '3 saat önce', dotBg: 'bg-pink-100', dotIcon: 'fas fa-rocket', dotColor: 'text-pink-500' },
  { text: '<b>Uyumluluk</b> — 3 satıcının KYC belgesi yenilendi', time: '4 saat önce', dotBg: 'bg-green-100', dotIcon: 'fas fa-shield-halved', dotColor: 'text-green-500' },
]

function refreshAll() {
  console.log('[Dashboard] Refresh all module widgets')
}
</script>

<style scoped>
.th-module-link {
  font-size: 11px;
  font-weight: 600;
  color: var(--th-brand-500);
  transition: opacity 0.15s;
}
.th-module-link:hover {
  opacity: 0.7;
}

.th-mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 8px;
  background: var(--th-surface-elevated);
}
.th-mini-stat-value {
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.th-mini-stat-label {
  font-size: 10px;
  color: var(--th-neutral);
  white-space: nowrap;
}
</style>
