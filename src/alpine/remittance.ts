import Alpine from 'alpinejs'

Alpine.data('remittanceComponent', () => ({
  step: 'upload' as 'upload' | 'form' | 'submitting' | 'success',
  dragging: false,

  // File state
  file: null as File | null,
  fileName: '',
  fileSize: '',
  filePreviewUrl: '' as string,
  fileType: '' as string,

  // Form data — ready for API binding
  form: {
    beneficiaryAccount: '',
    remittanceDate: '',
    currency: 'USD',
    amount: '',
    bankName: '',
    senderName: '',
  },

  // Validation
  errors: {} as Record<string, string>,
  submitted: false,

  // Computed
  get isFormValid(): boolean {
    const f = this.form;
    return !!(f.beneficiaryAccount && f.remittanceDate && f.currency && f.amount && f.bankName && f.senderName);
  },

  get hasFile(): boolean {
    return this.file !== null;
  },

  // File handling
  handleFiles(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    if (!allowed.includes(file.type)) {
      this.errors = { file: 'Unsupported file format' };
      return;
    }
    if (file.size > maxSize) {
      this.errors = { file: 'File size exceeds 20MB' };
      return;
    }

    this.file = file;
    this.fileName = file.name;
    this.fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    this.fileType = file.type;
    this.errors = {};

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => { this.filePreviewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    } else {
      this.filePreviewUrl = '';
    }
  },

  removeFile() {
    this.file = null;
    this.fileName = '';
    this.fileSize = '';
    this.filePreviewUrl = '';
    this.fileType = '';
    this.step = 'upload';
  },

  goToForm() {
    if (!this.file) return;
    this.step = 'form';
  },

  // Validation
  validateField(field: string) {
    const val = (this.form as any)[field];
    if (!val || !String(val).trim()) {
      this.errors[field] = 'required';
    } else {
      delete this.errors[field];
    }
  },

  validateAll(): boolean {
    this.errors = {};
    const required = ['beneficiaryAccount', 'remittanceDate', 'currency', 'amount', 'bankName', 'senderName'];
    required.forEach(f => this.validateField(f));
    return Object.keys(this.errors).length === 0;
  },

  // Submit — placeholder for API integration
  async submitRemittance() {
    this.submitted = true;
    if (!this.validateAll()) return;

    this.step = 'submitting';

    // TODO: Replace with POST /api/remittance (FormData with file + form fields)
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    this.step = 'success';
  },

  // Reset everything
  reset() {
    this.step = 'upload';
    this.file = null;
    this.fileName = '';
    this.fileSize = '';
    this.filePreviewUrl = '';
    this.fileType = '';
    this.form = { beneficiaryAccount: '', remittanceDate: '', currency: 'USD', amount: '', bankName: '', senderName: '' };
    this.errors = {};
    this.submitted = false;
    this.dragging = false;
  },

  clearForm() {
    this.form = { beneficiaryAccount: '', remittanceDate: '', currency: 'USD', amount: '', bankName: '', senderName: '' };
    this.errors = {};
  },
}));
