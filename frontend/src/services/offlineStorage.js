import { openDB } from 'idb';

const DB_NAME = 'violib-offline-db';
const DB_VERSION = 1;

/**
 * Inicializa a conexão com o banco local e cria a estrutura das tabelas.
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tabela para cache dos livros (Leitura Offline)
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }

      // Tabela para cache das coleções
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      // Fila de Sincronização (Outbox) - Ações feitas offline para enviar depois
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    }
  });
};

// ==========================================
// OPERAÇÕES DE CACHE (LEITURA E ATUALIZAÇÃO OTIMISTA)
// ==========================================

export const saveBooksCache = async (books, isReset = false) => {
  const db = await initDB();
  const tx = db.transaction('books', 'readwrite');
  const store = tx.objectStore('books');

  if (isReset) {
    await store.clear();
  }

  for (const book of books) {
    await store.put(book);
  }
  await tx.done;
};

export const getBooksCache = async () => {
  const db = await initDB();
  return db.getAll('books');
};

// NOVO: Adiciona ou atualiza um único livro (Usado na UI Otimista)
export const saveSingleBookCache = async (book) => {
  const db = await initDB();
  await db.put('books', book);
};

// NOVO: Remove um único livro do cache (Usado na UI Otimista)
export const deleteBookCache = async (id) => {
  const db = await initDB();
  await db.delete('books', id);
};

export const saveCollectionsCache = async (collections) => {
  const db = await initDB();
  const tx = db.transaction('collections', 'readwrite');
  const store = tx.objectStore('collections');

  await store.clear();
  for (const col of collections) {
    await store.put(col);
  }
  await tx.done;
};

export const getCollectionsCache = async () => {
  const db = await initDB();
  return db.getAll('collections');
};

// ==========================================
// OPERAÇÕES DA FILA DE SINCRONIZAÇÃO (OUTBOX)
// ==========================================

export const addToOutbox = async (action) => {
  const db = await initDB();
  await db.add('outbox', {
    ...action,
    timestamp: Date.now()
  });
};

export const getOutbox = async () => {
  const db = await initDB();
  return db.getAll('outbox');
};

export const removeFromOutbox = async (id) => {
  const db = await initDB();
  await db.delete('outbox', id);
};

export const clearOutbox = async () => {
  const db = await initDB();
  await db.clear('outbox');
};
