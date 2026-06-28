import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './BarcodeScanner.css';

/**
 * Componente leitor de código de barras customizado.
 * Utiliza a API de baixo nível para controle total da UI e traduções.
 */
const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode('scanner-preview-zone');
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('traseira') ||
            d.label.toLowerCase().includes('ambiente')
          );
          
          const selectedId = backCam ? backCam.id : devices[0].id;
          setActiveCameraId(selectedId);
          startCamera(scanner, selectedId);
        } else {
          setError('Nenhuma câmera detectada no seu dispositivo.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('A permissão para acessar a câmera foi recusada.');
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = (scannerInstance, cameraId) => {
    scannerInstance.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 150 }
      },
      (decodedText) => {
        scannerInstance.stop()
          .then(() => onScanSuccess(decodedText))
          .catch(() => onScanSuccess(decodedText));
      },
      () => {
        // Ignora erros de varredura de frames vazios
      }
    ).catch((err) => {
      console.error(err);
      setError('Falha ao iniciar o fluxo de vídeo da câmera.');
    });
  };

  const handleCameraChange = async (e) => {
    const id = e.target.value;
    setActiveCameraId(id);
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      startCamera(scannerRef.current, id);
    }
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <span className="material-symbols-rounded">qr_code_scanner</span>
          <h3>Leitor de Código de Barras</h3>
        </div>

        <div className="scanner-view-wrapper">
          <div id="scanner-preview-zone"></div>
          <div className="scanner-target-box">
            <div className="scanner-laser"></div>
          </div>
        </div>

        {cameras.length > 1 && (
          <div className="scanner-controls">
            <label htmlFor="camera-select">Câmera ativa:</label>
            <select 
              id="camera-select" 
              value={activeCameraId} 
              onChange={handleCameraChange}
              className="form-select"
            >
              {cameras.map((cam, idx) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Câmera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="scanner-error-alert">{error}</div>}

        <div className="scanner-actions">
          <button type="button" onClick={onClose} className="btn-action btn-scanner-cancel">
            Cancelar e Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;