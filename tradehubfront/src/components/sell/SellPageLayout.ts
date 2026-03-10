/**
 * SellPageLayout Component
 * Landing page for seller registration with hero, benefits, how-it-works, form, testimonials
 */

import { t } from '../../i18n';

export function SellPageLayout(): string {
  const benefits = [
    { icon: '<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>', title: t('sellPage.benefit1Title'), desc: t('sellPage.benefit1Desc') },
    { icon: '<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>', title: t('sellPage.benefit2Title'), desc: t('sellPage.benefit2Desc') },
    { icon: '<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>', title: t('sellPage.benefit3Title'), desc: t('sellPage.benefit3Desc') },
    { icon: '<svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>', title: t('sellPage.benefit4Title'), desc: t('sellPage.benefit4Desc') },
  ];

  const howItWorks = [
    { num: '1', title: t('sellPage.step1Title'), desc: t('sellPage.step1Desc') },
    { num: '2', title: t('sellPage.step2Title'), desc: t('sellPage.step2Desc') },
    { num: '3', title: t('sellPage.step3Title'), desc: t('sellPage.step3Desc') },
  ];

  const testimonials = [
    { name: t('sellPage.testimonial1Name'), company: t('sellPage.testimonial1Company'), quote: t('sellPage.testimonial1Quote'), metric: t('sellPage.testimonial1Metric') },
    { name: t('sellPage.testimonial2Name'), company: t('sellPage.testimonial2Company'), quote: t('sellPage.testimonial2Quote'), metric: t('sellPage.testimonial2Metric') },
    { name: t('sellPage.testimonial3Name'), company: t('sellPage.testimonial3Company'), quote: t('sellPage.testimonial3Quote'), metric: t('sellPage.testimonial3Metric') },
  ];

  const stepLabels = [
    t('sellPage.stepBusinessInfo'),
    t('sellPage.stepContact'),
    t('sellPage.stepProducts'),
    t('sellPage.stepVerification'),
  ];

  return `
    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-primary-600 via-primary-500 to-orange-500 py-16 sm:py-24 overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 left-10 w-64 h-64 bg-yellow-300 rounded-full blur-3xl"></div>
      </div>
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 text-center relative z-10">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">${t('sellPage.heroTitle')}</h1>
        <p class="text-white/80 text-base sm:text-lg max-w-[600px] mx-auto mb-8">${t('sellPage.heroDesc')}</p>
        <a href="#register-form" class="inline-block px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-base shadow-lg">${t('sellPage.heroCta')}</a>
      </div>
    </section>

    <!-- Benefits -->
    <section class="py-14 sm:py-20">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">${t('sellPage.benefitsTitle')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${benefits.map(b => `
            <div class="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div class="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">${b.icon}</div>
              <h3 class="text-base font-semibold text-gray-900 mb-2">${b.title}</h3>
              <p class="text-sm text-gray-500 leading-relaxed">${b.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-14 sm:py-20 bg-gray-50">
      <div class="max-w-[900px] mx-auto px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">${t('sellPage.howItWorksTitle')}</h2>
        <div class="flex flex-col md:flex-row items-start gap-6 md:gap-4">
          ${howItWorks.map((step, i) => `
            <div class="flex md:flex-col items-start md:items-center gap-4 md:gap-0 flex-1 text-center">
              <div class="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold shrink-0">${step.num}</div>
              <div class="md:mt-4">
                <h3 class="text-base font-semibold text-gray-900">${step.title}</h3>
                <p class="text-sm text-gray-500 mt-1">${step.desc}</p>
              </div>
            </div>
            ${i < howItWorks.length - 1 ? '<div class="hidden md:block flex-shrink-0 w-full h-0.5 bg-primary-200 mt-7 mx-2" style="max-width:100px"></div>' : ''}
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Registration Form -->
    <section id="register-form" class="py-14 sm:py-20 scroll-mt-20">
      <div class="max-w-[700px] mx-auto px-4 sm:px-6" x-data="sellPage()">
        <template x-if="!submitted">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">${t('sellPage.formTitle')}</h2>

            <!-- Step Indicator -->
            <div class="flex items-center justify-center mb-6">
              ${[1,2,3,4].map((s, i) => `
                <div class="flex items-center ${i < 3 ? 'flex-1' : ''}">
                  <div class="flex flex-col items-center">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors"
                      :class="currentStep > ${s} ? 'bg-primary-500 text-white' : currentStep === ${s} ? 'border-2 border-primary-500 text-primary-500 bg-white' : 'border-2 border-gray-300 text-gray-400 bg-white'">
                      <template x-if="currentStep > ${s}"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></template>
                      <template x-if="currentStep <= ${s}"><span>${s}</span></template>
                    </div>
                    <span class="hidden sm:block text-xs mt-1.5 text-center whitespace-nowrap" :class="currentStep === ${s} ? 'text-primary-600 font-medium' : 'text-gray-500'">${stepLabels[i]}</span>
                  </div>
                  ${i < 3 ? `<div class="flex-1 h-0.5 mx-2 sm:mx-3 transition-colors" :class="currentStep > ${s} ? 'bg-primary-500' : 'bg-gray-300'"></div>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <!-- Step 1: Business Info -->
              <div x-show="currentStep === 1">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('sellPage.businessInfoTitle')}</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.companyNameLabel')}</label>
                    <input type="text" x-model="formData.companyName" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.companyName ? 'border-red-400' : 'border-gray-300'">
                    <p x-show="formErrors.companyName" x-text="formErrors.companyName" class="text-xs text-red-500 mt-1"></p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.businessTypeLabel')}</label>
                    <select x-model="formData.businessType" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.businessType ? 'border-red-400' : 'border-gray-300'">
                      <option value="">${t('sellPage.selectPlaceholder')}</option>
                      <template x-for="bt in businessTypes" :key="bt"><option :value="bt" x-text="bt"></option></template>
                    </select>
                    <p x-show="formErrors.businessType" x-text="formErrors.businessType" class="text-xs text-red-500 mt-1"></p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.taxNumberLabel')}</label>
                    <input type="text" x-model="formData.taxNumber" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.taxNumber ? 'border-red-400' : 'border-gray-300'">
                    <p x-show="formErrors.taxNumber" x-text="formErrors.taxNumber" class="text-xs text-red-500 mt-1"></p>
                  </div>
                </div>
              </div>

              <!-- Step 2: Contact -->
              <div x-show="currentStep === 2">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('sellPage.contactInfoTitle')}</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.contactNameLabel')}</label>
                    <input type="text" x-model="formData.contactName" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.contactName ? 'border-red-400' : 'border-gray-300'">
                    <p x-show="formErrors.contactName" x-text="formErrors.contactName" class="text-xs text-red-500 mt-1"></p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.emailLabel')}</label>
                    <input type="email" x-model="formData.email" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.email ? 'border-red-400' : 'border-gray-300'">
                    <p x-show="formErrors.email" x-text="formErrors.email" class="text-xs text-red-500 mt-1"></p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.phoneLabel')}</label>
                    <input type="tel" x-model="formData.phone" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" :class="formErrors.phone ? 'border-red-400' : 'border-gray-300'" placeholder="+90 5XX XXX XXXX">
                    <p x-show="formErrors.phone" x-text="formErrors.phone" class="text-xs text-red-500 mt-1"></p>
                  </div>
                </div>
              </div>

              <!-- Step 3: Products -->
              <div x-show="currentStep === 3">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('sellPage.productInfoTitle')}</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">${t('sellPage.mainCategoriesLabel')} <span class="text-gray-400 font-normal">${t('sellPage.mainCategoriesHint')}</span></label>
                    <div class="grid grid-cols-2 gap-2">
                      <template x-for="cat in categoryOptions" :key="cat">
                        <label class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors" :class="formData.mainCategories.includes(cat) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'">
                          <input type="checkbox" :checked="formData.mainCategories.includes(cat)" @change="toggleCategory(cat)" class="sr-only">
                          <div class="w-4 h-4 rounded border flex items-center justify-center shrink-0" :class="formData.mainCategories.includes(cat) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'">
                            <svg x-show="formData.mainCategories.includes(cat)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </div>
                          <span class="text-sm text-gray-700" x-text="cat"></span>
                        </label>
                      </template>
                    </div>
                    <p x-show="formErrors.mainCategories" x-text="formErrors.mainCategories" class="text-xs text-red-500 mt-1"></p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t('sellPage.estimatedProductCount')}</label>
                    <select x-model="formData.productCount" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">${t('sellPage.selectPlaceholder')}</option>
                      <option value="1-50">1-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-1000">201-1.000</option>
                      <option value="1000+">1.000+</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Step 4: Verification -->
              <div x-show="currentStep === 4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${t('sellPage.verificationTitle')}</h3>
                <div class="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-6">
                  <p><span class="text-gray-500">${t('sellPage.summaryCompany')}</span> <span x-text="formData.companyName || '-'" class="font-medium"></span></p>
                  <p><span class="text-gray-500">${t('sellPage.summaryBusinessType')}</span> <span x-text="formData.businessType || '-'"></span></p>
                  <p><span class="text-gray-500">${t('sellPage.summaryContact')}</span> <span x-text="formData.contactName || '-'"></span></p>
                  <p><span class="text-gray-500">${t('sellPage.summaryEmail')}</span> <span x-text="formData.email || '-'"></span></p>
                  <p><span class="text-gray-500">${t('sellPage.summaryCategories')}</span> <span x-text="formData.mainCategories.join(', ') || '-'"></span></p>
                </div>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" x-model="formData.termsAccepted" class="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500">
                  <span class="text-sm text-gray-600">${t('sellPage.termsText')}<a href="/pages/legal/terms.html" class="text-primary-500 hover:underline">${t('sellPage.termsLink')}</a> ${t('sellPage.termsAnd')} <a href="/pages/legal/privacy.html" class="text-primary-500 hover:underline">${t('sellPage.privacyLink')}</a>${t('sellPage.termsSuffix')}</span>
                </label>
                <p x-show="formErrors.termsAccepted" x-text="formErrors.termsAccepted" class="text-xs text-red-500 mt-1"></p>
              </div>

              <!-- Navigation -->
              <div class="flex justify-between mt-8">
                <button x-show="currentStep > 1" @click="prevStep()" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">${t('sellPage.btnBack')}</button>
                <div x-show="currentStep === 1"></div>
                <button x-show="currentStep < 4" @click="nextStep()" class="th-btn cursor-pointer ml-auto">${t('sellPage.btnNext')}</button>
                <button x-show="currentStep === 4" @click="submitForm()" class="th-btn cursor-pointer ml-auto">${t('sellPage.btnSubmit')}</button>
              </div>
            </div>
          </div>
        </template>

        <!-- Success -->
        <template x-if="submitted">
          <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${t('sellPage.successTitle')}</h3>
            <p class="text-sm text-gray-500 mb-4">${t('sellPage.successDesc')}</p>
            <a href="/" class="th-btn inline-block">${t('sellPage.successCta')}</a>
          </div>
        </template>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-14 sm:py-20 bg-gray-50">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">${t('sellPage.testimonialsTitle')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${testimonials.map(tm => `
            <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">${tm.name[0]}</div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">${tm.name}</p>
                  <p class="text-xs text-gray-500">${tm.company}</p>
                </div>
              </div>
              <p class="text-sm text-gray-600 leading-relaxed mb-4">"${tm.quote}"</p>
              <div class="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full inline-block">${tm.metric}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Pricing CTA -->
    <section class="py-14 sm:py-20">
      <div class="max-w-[600px] mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-3">${t('sellPage.pricingCtaTitle')}</h2>
        <p class="text-gray-500 mb-6">${t('sellPage.pricingCtaDesc')}</p>
        <a href="/pages/seller/sell-pricing.html" class="th-btn inline-block">${t('sellPage.pricingCtaBtn')}</a>
      </div>
    </section>
  `;
}
