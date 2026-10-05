const API_BASE = 'https://ws-public.interpol.int/notices/v1/red';
let currentPage = 1;
let resultPerPage = 10;

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const gridEl = document.getElementById('notices-grid');
const totalBadge = document.getElementById('total-badge');
const pageInfoCurrent = document.getElementById('current-page');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

async function fetchNotices(page = 1) {
    // Reiniciar vista
    loadingEl.classList.remove('hidden');
    gridEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    btnPrev.disabled = true;
    btnNext.disabled = true;

    try {
        const response = await fetch(`${API_BASE}?resultPerPage=${resultPerPage}&page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        renderNotices(data);
    } catch (err) {
        console.error('Fetch error:', err);
        document.getElementById('error-message').textContent = err.message || 'Error de conexión o bloqueo CORS de la API.';
        errorEl.classList.remove('hidden');
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function renderNotices(data) {
    gridEl.innerHTML = '';

    const notices = data._embedded?.notices || [];
    totalBadge.textContent = `${data.total ? data.total.toLocaleString() : 0} Registros totales`;
    pageInfoCurrent.textContent = data.query?.page || currentPage;

    if (notices.length === 0) {
        gridEl.innerHTML = `<p class="col-span-full text-center text-slate-400 py-10">No se encontraron notificaciones en esta página.</p>`;
    } else {
        notices.forEach(notice => {
            const card = createCard(notice);
            gridEl.appendChild(card);
        });
    }

    // Control de paginación
    const hasNext = !!data._links?.next;
    const hasPrev = !!data._links?.prev || currentPage > 1;

    btnPrev.disabled = !hasPrev;
    btnNext.disabled = !hasNext;

    gridEl.classList.remove('hidden');
}

function createCard(notice) {
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden hover:border-red-500/50 hover:shadow-lg hover:shadow-red-950/30 transition flex flex-col';

    // Imagen Thumbnail
    const thumbnailUrl = notice._links?.thumbnail?.href;
    const fallbackImage = 'https://via.placeholder.com/300x400/1e293b/94a3b8?text=Sin+Foto';

    const nationalities = notice.nationalities ? notice.nationalities.join(', ') : 'N/A';
    const fullName = `${notice.forename || ''} ${notice.name || ''}`.trim() || 'Desconocido';

    card.innerHTML = `
        <div class="relative w-full h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
          <img 
            src="${thumbnailUrl || fallbackImage}" 
            alt="${fullName}"
            class="w-full h-full object-cover object-top transition duration-300 hover:scale-105"
            onerror="this.onerror=null; this.src='${fallbackImage}';"
          />
          <span class="absolute top-2 right-2 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
            RED NOTICE
          </span>
        </div>
        
        <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
          <div>
            <h3 class="font-bold text-slate-100 text-lg leading-snug line-clamp-2" title="${fullName}">
              ${fullName}
            </h3>
            <p class="text-xs text-slate-400 mt-1">ID: <span class="font-mono text-slate-300">${notice.entity_id}</span></p>
          </div>

          <div class="space-y-1 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
            <div class="flex justify-between">
              <span class="text-slate-400">Nacimiento:</span>
              <span class="font-medium">${notice.date_of_birth || 'Desconocida'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Nacionalidad:</span>
              <span class="font-medium bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-200">${nationalities}</span>
            </div>
          </div>

          <a 
            href="${notice._links?.self?.href || '#'}" 
            target="_blank" 
            class="mt-2 w-full text-center py-2 bg-slate-700/80 hover:bg-red-600 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition"
          >
            Ver Ficha JSON
          </a>
        </div>
      `;

    return card;
}

function changePage(delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    fetchNotices(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Carga inicial
fetchNotices(currentPage);
