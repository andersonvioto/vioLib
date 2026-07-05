import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropperModal.css';

/**
 * Helper para centralizar a área de corte inicialmente com a proporção correta
 */
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
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
  const imgRef = useRef(null);

  // Assim que a imagem carrega na tela, define a caixa de corte com a proporção de um livro (2/3)
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, 2 / 3);
    setCrop(initialCrop);
    
    // CORREÇÃO 1: Força o registro do crop em pixels imediatamente para o caso 
    // do usuário clicar em "Aplicar" sem mover a caixa de corte.
    setCompletedCrop(convertToPixelCrop(initialCrop, width, height));
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

    // LÓGICA DE COMPRESSÃO: Limite máximo de resolução (800px)
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
        
        // CORREÇÃO 2: Transformar o Blob genérico num Arquivo (File) legítimo.
        // O backend exige que o arquivo tenha um nome e extensão para aceitar o upload.
        const file = new File([blob], 'capa_recortada_comprimida.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(file);
        
        // Devolve o arquivo final limpo e pequeno para o formulário
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
            aspect={2 / 3} /* Trava a proporção perfeita para capas de livro */
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