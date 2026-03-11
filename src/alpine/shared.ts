import Alpine from 'alpinejs'

Alpine.data('floatingPanel', () => ({
  showScrollTop: false,
  chatOpen: false,
  lensOpen: false,

  init() {
    this.showScrollTop = window.scrollY > 300;
    window.addEventListener('scroll', () => {
      this.showScrollTop = window.scrollY > 300;
    }, { passive: true });
  },

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
}));

Alpine.data('stickyHeaderSearch', () => ({
  expanded: false,

  init() {
    this.$watch('expanded', (isExpanded: boolean) => {
      const el = this.$el as HTMLElement;
      el.querySelectorAll<HTMLElement>('[data-compact-expanded-interactive]').forEach((interEl) => {
        if (isExpanded) {
          interEl.removeAttribute('tabindex');
        } else {
          interEl.setAttribute('tabindex', '-1');
        }
      });
    });

    window.addEventListener('resize', () => {
      if (this.expanded) {
        this.syncDropdownOffset();
      }
    }, { passive: true });

    document.addEventListener('istoc:close-search', () => {
      this.close();
      const input = (this.$refs as Record<string, HTMLInputElement>).searchInput;
      if (input && document.activeElement === input) {
        input.blur();
      }
    });
  },

  open() {
    if (this.expanded) return;
    this.expanded = true;
    this.$nextTick(() => {
      this.syncDropdownOffset();
    });
  },

  close() {
    if (!this.expanded) return;
    this.expanded = false;
  },

  syncDropdownOffset() {
    // Top position is now handled purely via Tailwind CSS classes
  },

  pickValue(value: string) {
    if (!value) return;
    const input = (this.$refs as Record<string, HTMLInputElement>).searchInput;
    if (input) {
      input.value = value;
      input.focus();
    }
  },
}));

Alpine.data('checkbox', () => ({
  checked: false,
  indeterminate: false,
  inputId: '',
  handlerId: null as string | null,

  init() {
    const input = (this.$refs as Record<string, HTMLInputElement>).input;
    if (!input) return;

    this.inputId = input.id;
    this.checked = input.checked;
    this.handlerId = input.dataset.onchange || null;

    if (input.dataset.indeterminate === 'true') {
      this.indeterminate = true;
    }
  },

  handleChange() {
    const input = (this.$refs as Record<string, HTMLInputElement>).input;
    if (!input) return;

    this.checked = input.checked;
    this.indeterminate = false;

    if (this.handlerId) {
      this.$dispatch('checkbox-change', {
        id: this.inputId,
        checked: this.checked,
        handlerId: this.handlerId,
      });
    }
  },
}));

Alpine.data('quantityInput', (props: { value: number; min: number; max: number; step: number; id: string }) => ({
  value: props.value,
  min: props.min,
  max: props.max,
  step: props.step,
  id: props.id,

  decrement() {
    const current = this.value || this.min;
    this.value = Math.min(Math.max(current - this.step, this.min), this.max);
    this.$dispatch('quantity-change', { id: this.id, value: this.value });
  },

  increment() {
    const current = this.value || this.min;
    this.value = Math.min(Math.max(current + this.step, this.min), this.max);
    this.$dispatch('quantity-change', { id: this.id, value: this.value });
  },

  clampAndDispatch() {
    const input = (this.$refs as Record<string, HTMLInputElement>).input;
    const raw = Number(input.value);
    this.value = Math.min(Math.max(Number.isNaN(raw) ? this.min : raw, this.min), this.max);
    this.$dispatch('quantity-change', { id: this.id, value: this.value });
  },
}));
