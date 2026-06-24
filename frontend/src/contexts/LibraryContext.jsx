import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const LibraryContext = createContext();

/**
 * Provedor de Biblioteca (LibraryProvider).
 * Gerencia o estado da biblioteca ativa e sincroniza as bibliotecas
 * compartilhadas com o usuário autenticado.
 */
export const LibraryProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [sharedLibraries, setSharedLibraries] = useState([]);

  useEffect(() => {
    const fetchSharedLibraries = async () => {
      // Aborta a requisição se a sessão do usuário ainda não estiver validada
      if (!user) return;

      try {
        const response = await api.get('/access/shared-with-me');
        
        // Normaliza o retorno da API para garantir que sempre teremos um array
        const dataArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.shares || []);
          
        setSharedLibraries(dataArray);
      } catch (error) {
        console.error('Erro ao buscar bibliotecas compartilhadas:', error);
      }
    };

    fetchSharedLibraries();
  }, [user]);

  return (
    <LibraryContext.Provider value={{ currentLibrary, setCurrentLibrary, sharedLibraries }}>
      {children}
    </LibraryContext.Provider>
  );
};