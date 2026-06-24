import { useRef } from 'react';

/**
 * Custom hook para adicionar funcionalidade de arrasto (drag-to-scroll)
 * e navegação por botões em containers de rolagem horizontal.
 * * @returns {Object} Contém a referência do elemento, os tratadores de eventos de mouse e a função de rolagem.
 */
export const useDragScroll = () => {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e) => {
    if (!ref.current) return;
    isDragging.current = true;
    ref.current.classList.add('grabbing');
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const onMouseLeaveOrUp = () => {
    isDragging.current = false;
    if (ref.current) ref.current.classList.remove('grabbing');
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = x - startX.current;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const scrollShelf = (direction, amount = 300) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };

  return {
    ref,
    events: {
      onMouseDown,
      onMouseLeave: onMouseLeaveOrUp,
      onMouseUp: onMouseLeaveOrUp,
      onMouseMove
    },
    scrollShelf
  };
};