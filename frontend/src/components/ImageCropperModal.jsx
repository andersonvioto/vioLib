import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropperModal.css';

/**
 * Helper para centralizar a área de corte inicialmente com a proporção correta,
 * garantindo matematicamente que não ultrapassa as margens da imagem original.
 */
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  const imageAspect = mediaWidth / mediaHeight;
  let cropWidthPercent = 90; // Valor base: 90% da largura

  // Se a imagem for mais "larga" do que a proporção que queremos (ex: modo paisagem),
  // forçar 90% da largura fará com que a altura da caixa passe dos 100% da imagem,
  // o que quebra a biblioteca. Neste caso, calculamos a largura baseada em 90% da altura.
  if (imageAspect > aspect) {
    cropWidthPercent = (90 * mediaHeight * aspect) / mediaWidth;
  }

  return centerCrop(
    makeAspectCrop({ unit: '%', width: cropWidthPercent }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Componente Modal que permite ao usuário cortar e comprimir a capa do livro.
 */
const ImageCropperModal = ({ imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const imgRef = useRef(null);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, 3 / 4);
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, width, height));
  };

  const handleToggleAspect = () => {
    const newAspectLocked = !isAspectLocked;
    setIsAspectLocked(newAspectLocked);

    // Se o usuário reativar a trava, re-centralizamos e forçamos a proporção 3:4 perfeitamente
    if (newAspectLocked && imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, 3 / 4);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  };

  const handleConfirm = () => {
    const image = imgRef.current;

    // Validação de segurança
    if (!image || !completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0) {
      onCancel();
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Lógica de compressão: Limite máximo de resolução (800px)
    const MAX_DIMENSION = 800;
    let targetWidth = completedCrop.width * scaleX;
    let targetHeight = completedCrop.height * scaleY;

    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      if (targetWidth > targetHeight) {
        targetHeight = (MAX_DIMENSION / targetWidth) * targetHeight;
        targetWidth = MAX_DIMENSION;
      } else {
        targetWidth = (MAX_DIMENSION / targetHeight) * targetWidth;
        targetHeight = MAX_DIMENSION;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Melhora a qualidade do redimensionamento no canvas
    ctx.imageSmoothingQuality = 'high';

    // Desenha apenas a área cortada no canvas já redimensionado
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Converte o canvas para um arquivo comprimido com 80% de qualidade
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Falha ao gerar a imagem comprimida');
          onCancel();
          return;
        }

        // Transforma o Blob num Arquivo (File) legítimo para o backend aceitar o upload
        const file = new File([blob], 'capa_recortada_comprimida.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(file);

        onComplete(file, previewUrl);
      },
      'image/jpeg',
      0.8
    );
  };

  return (
    <div className="cropper-overlay">
      <div className="cropper-card">
        <div className="cropper-header">
          <h3 className="cropper-title">
            <span className="material-symbols-rounded">crop</span> Ajustar Capa
          </h3>
          <p className="cropper-subtitle">
            Arraste as bordas para cortar. A imagem será automaticamente otimizada e comprimida.
          </p>
        </div>

        <div className="cropper-wrap">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={isAspectLocked ? 3 / 4 : undefined}
          >
            <img
              ref={imgRef}
              alt="Área de corte"
              src={imageSrc}
              onLoad={onImageLoad}
              className="cropper-image"
            />
          </ReactCrop>
        </div>

        <div className="cropper-options">
          <label className="cropper-aspect-toggle">
            <input type="checkbox" checked={isAspectLocked} onChange={handleToggleAspect} />
            <span>Manter proporção de livro (3:4)</span>
          </label>
        </div>

        <div className="cropper-actions">
          <button type="button" className="btn-action" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn-action btn-primary" onClick={handleConfirm}>
            Aplicar e Comprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
