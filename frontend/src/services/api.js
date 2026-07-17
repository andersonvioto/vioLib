import axios from 'axios';
import {
  saveBooksCache,
  getBooksCache,
  saveSingleBookCache,
  deleteBookCache,
  saveCollectionsCache,
  getCollectionsCache,
  addToOutbox,
  getOutbox,
  removeFromOutbox
} from './offlineStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'
});

// ==========================================
// 1. MOTOR DE SINCRONIZAÇÃO DA BASE COMPLETA
// ==========================================
export const syncFullLibrary = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    window.dispatchEvent(new CustomEvent('violib-offline-sync', { detail: { status: 'syncing' } }));

    const response = await axios.get(`${api.defaults.baseURL}/books?limit=10000`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const allBooks = Array.isArray(response.data) ? response.data : response.data.books || [];

    await saveBooksCache(allBooks, true);

    window.dispatchEvent(new CustomEvent('violib-offline-sync', { detail: { status: 'done' } }));
  } catch (error) {
    console.error('Falha ao sincronizar base completa:', error);
    window.dispatchEvent(new CustomEvent('violib-offline-sync', { detail: { status: 'error' } }));
  }
};

// ==========================================
// 2. MOTOR DE SINCRONIZAÇÃO DE AÇÕES (OUTBOX)
// ==========================================
export const processOutbox = async () => {
  const actions = await getOutbox();
  if (actions.length === 0) return;

  console.log(`🔄 Sincronizando ${actions.length} ações pendentes com o servidor...`);

  for (const action of actions) {
    try {
      let dataToSend = action.payload;

      if (action.isFormData) {
        dataToSend = new FormData();
        for (const key in action.payload) {
          dataToSend.append(key, action.payload[key]);
        }
      }

      await axios({
        baseURL: api.defaults.baseURL,
        url: action.url,
        method: action.method,
        data: dataToSend,
        headers: {
          ...action.headers,
          ...(action.isFormData ? { 'Content-Type': undefined } : {})
        }
      });

      await removeFromOutbox(action.id);
      console.log(`✅ Ação sincronizada: ${action.method.toUpperCase()} ${action.url}`);
    } catch (err) {
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        await removeFromOutbox(action.id);
      }
    }
  }

  await syncFullLibrary();
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    const url = response.config.url || '';
    const method = response.config.method;

    try {
      if (method === 'post' && url.includes('/auth/login')) {
        if (response.data && response.data.user) {
          localStorage.setItem('violib_offline_profile', JSON.stringify(response.data.user));
        }
      }

      if (method === 'get') {
        const isSingleBook = /\/books\/-?\d+/.test(url);

        if (url.includes('/books') && !url.includes('/access/') && !isSingleBook) {
          const booksData = Array.isArray(response.data)
            ? response.data
            : response.data.books || [];
          const isPageOne = url.includes('page=1');

          // Se tiver qualquer filtro ativo na URL, nós NÃO queremos sobrescrever a base offline completa!
          const hasFilters =
            url.includes('search=') ||
            url.includes('genre=') ||
            url.includes('subgenre=') ||
            url.includes('tag=') ||
            url.includes('author=') ||
            url.includes('translator=');

          const isReset = isPageOne && !hasFilters;

          await saveBooksCache(booksData, isReset);
        } else if (url.includes('/collections') && !url.includes('/items')) {
          await saveCollectionsCache(response.data);
        } else if (url.includes('/users/profile')) {
          localStorage.setItem('violib_offline_profile', JSON.stringify(response.data));
        } else if (url.includes('/attributes') && !url.includes('/attributes/')) {
          localStorage.setItem('violib_offline_attributes', JSON.stringify(response.data));
        }
      }
    } catch (e) {
      console.error('Erro ao atualizar cache local:', e);
    }

    return response;
  },
  async (error) => {
    if (!error.response || error.code === 'ERR_NETWORK') {
      const config = error.config;

      // ==========================================
      // FALLBACK DE LEITURA (GET) - OFFLINE SEARCH
      // ==========================================
      if (config && config.method === 'get') {
        try {
          const url = config.url || '';

          if (url.includes('/books') && !url.includes('/access/')) {
            const cachedBooks = await getBooksCache();
            const bookIdMatch = url.match(/\/books\/(-?\d+)/);

            if (bookIdMatch) {
              const bookId = parseInt(bookIdMatch[1], 10);
              const foundBook = cachedBooks.find((b) => b.id === bookId);
              if (foundBook) {
                foundBook.isOwner = true;
                return Promise.resolve({
                  data: foundBook,
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config
                });
              }
              return Promise.reject(error);
            }

            // O MINI-SERVIDOR
            const dummyUrl = new URL('http://localhost' + url);
            const params = dummyUrl.searchParams;

            const page = parseInt(params.get('page')) || 1;
            const limit = parseInt(params.get('limit')) || 20;
            const search = (params.get('search') || '').toLowerCase();
            const genre = params.get('genre');
            const subgenre = params.get('subgenre');
            const tag = params.get('tag');
            const author = params.get('author');
            const translator = params.get('translator');
            const borrowed = params.get('borrowed') === 'true';
            const sortBy = params.get('sortBy') || 'title';
            const order = params.get('order') || 'ASC';

            let filtered = [...cachedBooks];

            if (search) {
              filtered = filtered.filter(
                (b) =>
                  b.title?.toLowerCase().includes(search) ||
                  b.Authors?.some((a) => a.name.toLowerCase().includes(search))
              );
            }
            if (genre) filtered = filtered.filter((b) => b.Genres?.some((g) => g.name === genre));
            if (subgenre)
              filtered = filtered.filter((b) => b.Subgenres?.some((s) => s.name === subgenre));
            if (tag) filtered = filtered.filter((b) => b.Tags?.some((t) => t.name === tag));
            if (borrowed) filtered = filtered.filter((b) => b.Loans?.some((l) => !l.returnDate));

            // Novos filtros estritos
            if (author)
              filtered = filtered.filter((b) => b.Authors?.some((a) => a.name === author));
            if (translator)
              filtered = filtered.filter((b) => b.Translators?.some((t) => t.name === translator));

            filtered.sort((a, b) => {
              let valA = a[sortBy];
              let valB = b[sortBy];
              if (sortBy === 'author') {
                valA = a.Authors?.[0]?.name || '';
                valB = b.Authors?.[0]?.name || '';
              }
              if (typeof valA === 'string') valA = valA.toLowerCase();
              if (typeof valB === 'string') valB = valB.toLowerCase();
              if (valA < valB) return order === 'ASC' ? -1 : 1;
              if (valA > valB) return order === 'ASC' ? 1 : -1;
              return 0;
            });

            const startIndex = (page - 1) * limit;
            const paginatedBooks = filtered.slice(startIndex, startIndex + limit);

            return Promise.resolve({
              data: {
                books: paginatedBooks,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / limit)
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config
            });
          }

          if (url.includes('/collections') && !url.includes('/items')) {
            const cachedCollections = await getCollectionsCache();
            return Promise.resolve({
              data: cachedCollections,
              status: 200,
              statusText: 'OK',
              headers: {},
              config
            });
          }
          if (url.includes('/users/profile')) {
            const cachedProfile = localStorage.getItem('violib_offline_profile');
            if (cachedProfile) {
              return Promise.resolve({
                data: JSON.parse(cachedProfile),
                status: 200,
                statusText: 'OK',
                headers: {},
                config
              });
            }
          }
          if (url.includes('/attributes') && !url.includes('/attributes/')) {
            const cachedAttr = localStorage.getItem('violib_offline_attributes');
            if (cachedAttr) {
              return Promise.resolve({
                data: JSON.parse(cachedAttr),
                status: 200,
                statusText: 'OK',
                headers: {},
                config
              });
            }
          }
        } catch (cacheError) {
          console.error('Erro ao ler do cache offline:', cacheError);
        }
      }

      // ==========================================
      // FALLBACK DE ESCRITA E ATUALIZAÇÃO OTIMISTA
      // ==========================================
      else if (config && ['post', 'put', 'delete'].includes(config.method)) {
        try {
          const isAuthRoute =
            config.url.includes('/auth/') || config.url.includes('/users/profile');

          if (!isAuthRoute) {
            console.warn('📡 Sem rede! Ação intercetada e guardada na Caixa de Saída.');

            let payload = config.data;
            let isFormData = false;

            if (
              config.data instanceof FormData ||
              (config.data &&
                config.data.constructor &&
                config.data.constructor.name === 'FormData')
            ) {
              isFormData = true;
              payload = {};
              for (let [key, value] of config.data.entries()) {
                payload[key] = value;
              }
            } else if (typeof config.data === 'string') {
              try {
                payload = JSON.parse(config.data);
              } catch (e) {}
            }

            await addToOutbox({
              url: config.url,
              method: config.method,
              payload: payload,
              headers: config.headers,
              isFormData: isFormData
            });

            if (config.url.includes('/books') && !config.url.includes('/access/')) {
              const parseArrayField = (fieldData) => {
                if (!fieldData) return [];
                try {
                  const arr = typeof fieldData === 'string' ? JSON.parse(fieldData) : fieldData;
                  return arr.map((item) => ({ name: item }));
                } catch (e) {
                  return [];
                }
              };

              if (config.method === 'delete') {
                const match = config.url.match(/\/books\/(-?\d+)/);
                if (match) await deleteBookCache(parseInt(match[1], 10));
              } else if (config.method === 'post') {
                const tempId = -Date.now();
                const tempBook = {
                  id: tempId,
                  title: payload.title || 'Livro Adicionado Offline',
                  isbn: payload.isbn || '',
                  publisher: payload.publisher || '',
                  releaseYear: payload.releaseYear ? parseInt(payload.releaseYear, 10) : null,
                  edition: payload.edition || '',
                  publicationLocation: payload.publicationLocation || '',
                  acquisitionDate: payload.acquisitionDate || null,
                  notes: payload.notes || '',
                  coverImage: '',
                  isOwner: true,
                  Authors: parseArrayField(payload.authors),
                  Translators: parseArrayField(payload.translators),
                  Genres: parseArrayField(payload.genres),
                  Subgenres: parseArrayField(payload.subgenres),
                  Tags: parseArrayField(payload.tags),
                  Loans: []
                };

                await saveSingleBookCache(tempBook);
              } else if (config.method === 'put') {
                const match = config.url.match(/\/books\/(-?\d+)/);
                if (match) {
                  const bookId = parseInt(match[1], 10);
                  const cachedBooks = await getBooksCache();
                  const existingBook = cachedBooks.find((b) => b.id === bookId);

                  if (existingBook) {
                    if (payload.title !== undefined) existingBook.title = payload.title;
                    if (payload.isbn !== undefined) existingBook.isbn = payload.isbn;
                    if (payload.publisher !== undefined) existingBook.publisher = payload.publisher;
                    if (payload.releaseYear !== undefined)
                      existingBook.releaseYear = payload.releaseYear
                        ? parseInt(payload.releaseYear, 10)
                        : null;
                    if (payload.edition !== undefined) existingBook.edition = payload.edition;
                    if (payload.publicationLocation !== undefined)
                      existingBook.publicationLocation = payload.publicationLocation;
                    if (payload.acquisitionDate !== undefined)
                      existingBook.acquisitionDate = payload.acquisitionDate;
                    if (payload.notes !== undefined) existingBook.notes = payload.notes;

                    if (payload.authors !== undefined)
                      existingBook.Authors = parseArrayField(payload.authors);
                    if (payload.translators !== undefined)
                      existingBook.Translators = parseArrayField(payload.translators);
                    if (payload.genres !== undefined)
                      existingBook.Genres = parseArrayField(payload.genres);
                    if (payload.subgenres !== undefined)
                      existingBook.Subgenres = parseArrayField(payload.subgenres);
                    if (payload.tags !== undefined)
                      existingBook.Tags = parseArrayField(payload.tags);

                    await saveSingleBookCache(existingBook);
                  }
                }
              }
            }

            return Promise.resolve({
              data: {
                message:
                  'Ação guardada offline. Será sincronizada automaticamente quando houver conexão.',
                isOfflineFallback: true
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config
            });
          }
        } catch (outboxError) {
          console.error('Erro ao guardar na outbox:', outboxError);
        }
      }
    }

    if (error.response && error.response.status === 401) {
      const isLoginRequest =
        error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
