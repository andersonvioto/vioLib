import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './BarcodeScanner.css';

/**
 * Componente leitor de código de barras.
 * Utiliza a câmera do dispositivo para ler o ISBN (Padrão EAN-13).
 */
const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'isbn-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // A biblioteca dispara erros a cada frame que não contém um código legível.
        // Ignoramos silenciosamente para não inundar o console.
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error('Erro ao limpar a instância da câmera:', error);
      });
    };
  }, [onScanSuccess]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <h2 className="scanner-title">
          <span className="material-symbols-rounded">barcode_reader</span>
          Escanear ISBN
        </h2>
        
        <div id="isbn-reader"></div>
        
        <button onClick={onClose} className="btn-action btn-danger scanner-close-btn">
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;