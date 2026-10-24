/**
 * AutoPrime - Showroom Mobil Bekas
 * Pure Vanilla JavaScript API Fetcher & E-Commerce Logic
 * Endpoint: https://api-web.dnccudinus.org/api/mobil
 */

// State Application
const AppState = {
  cars: [],
  selectedCar: null,
  filters: {
    search: '',
    brand: 'all',
    fuel: 'all',
    status: 'all',
    sort: 'default'
  }
};

// Configuration
const API_URL = 'https://api-web.dnccudinus.org/api/mobil';
const SHOWROOM_WA = '6281234567890';
const DEFAULT_CAR_IMG = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80';

// DOM Elements
const DOM = {
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),
  emptyState: document.getElementById('emptyState'),
  resetSearchEmptyBtn: document.getElementById('resetSearchEmptyBtn'),
  carsGrid: document.getElementById('carsGrid'),
  resultCount: document.getElementById('resultCount'),
  statTotalUnit: document.getElementById('statTotalUnit'),
  
  // Controls
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  filterBrand: document.getElementById('filterBrand'),
  filterFuel: document.getElementById('filterFuel'),
  filterStatus: document.getElementById('filterStatus'),
  sortOrder: document.getElementById('sortOrder'),
  resetFilterBtn: document.getElementById('resetFilterBtn'),

  // Modal
  buyModal: document.getElementById('buyModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelOrderBtn: document.getElementById('cancelOrderBtn'),
  orderForm: document.getElementById('orderForm'),
  modalCarName: document.getElementById('modalCarName'),
  modalCarImg: document.getElementById('modalCarImg'),
  modalCarBrand: document.getElementById('modalCarBrand'),
  modalCarTitle: document.getElementById('modalCarTitle'),
  modalCarPrice: document.getElementById('modalCarPrice'),
  modalCarYear: document.getElementById('modalCarYear'),
  modalCarTransmission: document.getElementById('modalCarTransmission'),
  modalCarFuel: document.getElementById('modalCarFuel'),
  buyerName: document.getElementById('buyerName'),
  buyerPhone: document.getElementById('buyerPhone'),
  paymentMethod: document.getElementById('paymentMethod'),
  buyerNotes: document.getElementById('buyerNotes'),

  // Toast
  toast: document.getElementById('toastNotification'),
  toastTitle: document.getElementById('toastTitle'),
  toastMessage: document.getElementById('toastMessage')
};

/**
 * Format Angka menjadi Mata Uang Rupiah (IDR)
 */
function formatRupiah(number) {
  if (isNaN(number)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
}

/**
 * Mengambil data mobil dari API
 */
async function fetchCarsData() {
  showLoading();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();

    // Pastikan data berbentuk array
    let data = [];
    if (Array.isArray(json.data)) {
      data = json.data;
    } else if (Array.isArray(json)) {
      data = json;
    } else {
      throw new Error('Format data API tidak sesuai yang diharapkan.');
    }

    AppState.cars = data;
    
    // Update Quick Stats di Hero
    if (DOM.statTotalUnit) {
      DOM.statTotalUnit.textContent = `${data.length}+`;
    }

    // Populate Brand Filter Select secara dinamis
    populateBrandFilter(data);

    // Tampilkan data ke Grid
    renderCars();

  } catch (error) {
    console.error('Gagal mengambil data mobil:', error);
    showError(error.message || 'Gagal terhubung ke server API.');
  }
}

/**
 * Mengisi dropdown Brand berdasarkan data mobil yang tersedia
 */
function populateBrandFilter(cars) {
  const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();

  // Reset dropdown kecuali opsi pertama
  DOM.filterBrand.innerHTML = '<option value="all">Semua Brand</option>';

  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    DOM.filterBrand.appendChild(option);
  });
}

/**
 * Tampilkan Loading Skeleton
 */
function showLoading() {
  DOM.loadingState.style.display = 'grid';
  DOM.errorState.style.display = 'none';
  DOM.emptyState.style.display = 'none';
  DOM.carsGrid.style.display = 'none';
}

/**
 * Tampilkan Pesan Error
 */
function showError(message) {
  DOM.loadingState.style.display = 'none';
  DOM.carsGrid.style.display = 'none';
  DOM.emptyState.style.display = 'none';
  DOM.errorState.style.display = 'block';
  DOM.errorMessage.textContent = message;
}

/**
 * Filter dan Urutkan Data Mobil
 */
function getFilteredCars() {
  let result = [...AppState.cars];

  // 1. Search Query (Nama atau Brand)
  if (AppState.filters.search) {
    const q = AppState.filters.search.toLowerCase().trim();
    result = result.filter(car => {
      const nama = (car.nama || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      const fuel = (car.bahan_bakar || '').toLowerCase();
      return nama.includes(q) || brand.includes(q) || fuel.includes(q);
    });
  }

  // 2. Filter Brand
  if (AppState.filters.brand !== 'all') {
    result = result.filter(car => car.brand === AppState.filters.brand);
  }

  // 3. Filter Bahan Bakar
  if (AppState.filters.fuel !== 'all') {
    result = result.filter(car => {
      const carFuel = (car.bahan_bakar || '').toLowerCase();
      return carFuel.includes(AppState.filters.fuel.toLowerCase());
    });
  }

  // 4. Filter Status
  if (AppState.filters.status !== 'all') {
    result = result.filter(car => (car.status || '').toLowerCase() === AppState.filters.status.toLowerCase());
  }

  // 5. Sorting
  switch (AppState.filters.sort) {
    case 'price-asc':
      result.sort((a, b) => (Number(a.harga) || 0) - (Number(b.harga) || 0));
      break;
    case 'price-desc':
      result.sort((a, b) => (Number(b.harga) || 0) - (Number(a.harga) || 0));
      break;
    case 'year-desc':
      result.sort((a, b) => (Number(b.tahun) || 0) - (Number(a.tahun) || 0));
      break;
    case 'name-asc':
      result.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      break;
    default:
      // default urutkan berdasarkan ID desc / original
      break;
  }

  return result;
}

/**
 * Render Mobil ke dalam Grid Card
 */
function renderCars() {
  DOM.loadingState.style.display = 'none';
  DOM.errorState.style.display = 'none';

  const filtered = getFilteredCars();

  // Update Result Text Counter
  DOM.resultCount.innerHTML = `Menampilkan <strong>${filtered.length}</strong> dari total <strong>${AppState.cars.length}</strong> unit mobil`;

  if (filtered.length === 0) {
    DOM.carsGrid.style.display = 'none';
    DOM.emptyState.style.display = 'block';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.carsGrid.style.display = 'grid';
  DOM.carsGrid.innerHTML = '';

  filtered.forEach(car => {
    const isSold = (car.status || '').toLowerCase() === 'sold';
    const statusText = isSold ? 'Terjual' : 'Tersedia';
    const statusClass = isSold ? 'sold' : 'tersedia';

    // Format badge bahan bakar icon
    let fuelIcon = 'fa-gas-pump';
    const fuelLower = (car.bahan_bakar || '').toLowerCase();
    if (fuelLower.includes('listrik')) fuelIcon = 'fa-bolt';
    else if (fuelLower.includes('hybrid')) fuelIcon = 'fa-leaf';

    const card = document.createElement('article');
    card.className = 'car-card';
    card.innerHTML = `
      <div class="car-card-header">
        <img 
          src="${car.foto || DEFAULT_CAR_IMG}" 
          alt="${car.nama || 'Mobil Bekas'}" 
          class="car-card-img" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${DEFAULT_CAR_IMG}';"
        >
        <span class="badge-brand">${car.brand || 'Automotive'}</span>
        <span class="badge-status ${statusClass}">
          <i class="fa-solid ${isSold ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
          ${statusText}
        </span>
        <div class="verified-stamp">
          <i class="fa-solid fa-shield-check"></i> Lulus Inspeksi
        </div>
      </div>

      <div class="car-card-body">
        <h3 class="car-title" title="${car.nama || ''}">${car.nama || 'Mobil Tanpa Nama'}</h3>
        
        <div class="car-specs">
          <div class="spec-chip" title="Tahun Pembuatan">
            <i class="fa-regular fa-calendar"></i>
            <span>${car.tahun || '-'}</span>
          </div>
          <div class="spec-chip" title="Transmisi">
            <i class="fa-solid fa-gears"></i>
            <span>${car.transmisi || '-'}</span>
          </div>
          <div class="spec-chip" title="Bahan Bakar">
            <i class="fa-solid ${fuelIcon}"></i>
            <span>${car.bahan_bakar || '-'}</span>
          </div>
        </div>

        <div class="car-card-footer">
          <div class="price-row">
            <span class="price-label">Harga OTR</span>
            <span class="price-value">${formatRupiah(car.harga)}</span>
          </div>

          <button 
            type="button"
            class="btn-buy ${isSold ? 'disabled' : ''}" 
            data-car-id="${car.id}"
            ${isSold ? 'disabled' : ''}
          >
            <i class="fa-solid ${isSold ? 'fa-ban' : 'fa-cart-shopping'}"></i>
            <span>${isSold ? 'Unit Sudah Terjual' : 'Beli Sekarang'}</span>
          </button>
        </div>
      </div>
    `;

    DOM.carsGrid.appendChild(card);
  });

  // Attach event listener to Buy buttons
  attachBuyEventListeners();
}

/**
 * Event Listener untuk tombol Beli di setiap Card
 */
function attachBuyEventListeners() {
  const buyButtons = DOM.carsGrid.querySelectorAll('.btn-buy:not(:disabled)');
  buyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const carId = Number(btn.getAttribute('data-car-id'));
      const selected = AppState.cars.find(c => c.id === carId);
      if (selected) {
        openBuyModal(selected);
      }
    });
  });
}

/**
 * Buka Modal Pemesanan Mobil
 */
function openBuyModal(car) {
  AppState.selectedCar = car;

  DOM.modalCarName.textContent = `Pesan: ${car.nama}`;
  DOM.modalCarTitle.textContent = car.nama;
  DOM.modalCarBrand.textContent = car.brand || 'Showroom AutoPrime';
  DOM.modalCarPrice.textContent = formatRupiah(car.harga);
  DOM.modalCarYear.textContent = car.tahun || '-';
  DOM.modalCarTransmission.textContent = car.transmisi || '-';
  DOM.modalCarFuel.textContent = car.bahan_bakar || '-';
  
  DOM.modalCarImg.src = car.foto || DEFAULT_CAR_IMG;
  DOM.modalCarImg.onerror = () => { DOM.modalCarImg.src = DEFAULT_CAR_IMG; };

  // Tampilkan Modal
  DOM.buyModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Kunci scroll halaman
}

/**
 * Tutup Modal Pemesanan Mobil
 */
function closeBuyModal() {
  DOM.buyModal.classList.remove('active');
  document.body.style.overflow = ''; // Kembalikan scroll
  DOM.orderForm.reset();
  AppState.selectedCar = null;
}

/**
 * Menampilkan Toast Notifikasi
 */
let toastTimeout;
function showToast(title, message) {
  DOM.toastTitle.textContent = title;
  DOM.toastMessage.textContent = message;

  DOM.toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 4000);
}

/**
 * Handle Submit Form Booking Mobil
 */
function handleOrderSubmit(e) {
  e.preventDefault();

  if (!AppState.selectedCar) return;

  const name = DOM.buyerName.value.trim();
  const phone = DOM.buyerPhone.value.trim();
  const payment = DOM.paymentMethod.value;
  const notes = DOM.buyerNotes.value.trim();

  const car = AppState.selectedCar;

  // Generate WhatsApp Message
  const waMessage = 
`Halo AutoPrime Showroom! 🚗
Saya tertarik dan ingin membeli/booking unit mobil bekas berikut:

*Detail Mobil:*
- Nama Unit : *${car.nama}*
- Brand : ${car.brand}
- Tahun : ${car.tahun}
- Transmisi : ${car.transmisi}
- Bahan Bakar : ${car.bahan_bakar}
- Harga OTR : *${formatRupiah(car.harga)}*

*Data Pemesan:*
- Nama : *${name}*
- No. WhatsApp : ${phone}
- Rencana Pembayaran : *${payment}*
${notes ? `- Catatan : "${notes}"` : ''}

Mohon informasi ketersediaan unit dan jadwal kunjungan cek fisik. Terima kasih!`;

  const waUrl = `https://wa.me/${SHOWROOM_WA}?text=${encodeURIComponent(waMessage)}`;

  // Buka WhatsApp di tab baru
  window.open(waUrl, '_blank');

  // Berikan feedback visual
  closeBuyModal();
  showToast('Booking Terkirim!', `Pemesanan ${car.nama} berhasil diteruskan ke WhatsApp Sales.`);
}

/**
 * Reset Semua Filter
 */
function resetAllFilters() {
  AppState.filters.search = '';
  AppState.filters.brand = 'all';
  AppState.filters.fuel = 'all';
  AppState.filters.status = 'all';
  AppState.filters.sort = 'default';

  DOM.searchInput.value = '';
  DOM.clearSearchBtn.style.display = 'none';
  DOM.filterBrand.value = 'all';
  DOM.filterFuel.value = 'all';
  DOM.filterStatus.value = 'all';
  DOM.sortOrder.value = 'default';

  renderCars();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // 1. Search Input (Real-time with debounce)
  let searchTimer;
  DOM.searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.clearSearchBtn.style.display = val.length > 0 ? 'flex' : 'none';

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      AppState.filters.search = val;
      renderCars();
    }, 250);
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    AppState.filters.search = '';
    renderCars();
    DOM.searchInput.focus();
  });

  // 2. Filter Selects
  DOM.filterBrand.addEventListener('change', (e) => {
    AppState.filters.brand = e.target.value;
    renderCars();
  });

  DOM.filterFuel.addEventListener('change', (e) => {
    AppState.filters.fuel = e.target.value;
    renderCars();
  });

  DOM.filterStatus.addEventListener('change', (e) => {
    AppState.filters.status = e.target.value;
    renderCars();
  });

  DOM.sortOrder.addEventListener('change', (e) => {
    AppState.filters.sort = e.target.value;
    renderCars();
  });

  // 3. Reset Filter
  DOM.resetFilterBtn.addEventListener('click', resetAllFilters);
  DOM.resetSearchEmptyBtn.addEventListener('click', resetAllFilters);

  // 4. Retry Fetch API
  DOM.retryBtn.addEventListener('click', fetchCarsData);

  // 5. Modal Close Actions
  DOM.closeModalBtn.addEventListener('click', closeBuyModal);
  DOM.cancelOrderBtn.addEventListener('click', closeBuyModal);

  DOM.buyModal.addEventListener('click', (e) => {
    if (e.target === DOM.buyModal) {
      closeBuyModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.buyModal.classList.contains('active')) {
      closeBuyModal();
    }
  });

  // 6. Form Submit
  DOM.orderForm.addEventListener('submit', handleOrderSubmit);
}

// Inisialisasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchCarsData();
});
