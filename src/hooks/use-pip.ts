import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para manejar la API Document Picture-in-Picture
 * Permite abrir una ventana flotante que se queda "siempre arriba".
 */
export function usePiP() {
  const [isPipActive, setIsPipActive] = useState(false);
  const pipWindowRef = useRef<any>(null);

  const closePiP = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
  }, []);

  const requestPiP = useCallback(async (onClose?: () => void) => {
    if (!('documentPictureInPicture' in window)) {
      console.error('Document Picture-in-Picture no es soportado por este navegador.');
      return null;
    }

    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 150,
      });

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      pipWindow.addEventListener('pagehide', () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
        if (onClose) onClose();
      });

      // Copiar estilos para que se vea igual que la app
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.cssRules) {
            const newStyle = pipWindow.document.createElement('style');
            [...styleSheet.cssRules].forEach((rule) => {
              newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
            });
            pipWindow.document.head.appendChild(newStyle);
          } else if (styleSheet.href) {
            const newLink = pipWindow.document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = styleSheet.href;
            pipWindow.document.head.appendChild(newLink);
          }
        } catch (e) {
          // Ignorar errores de CORS en hojas de estilo externas
        }
      });

      return pipWindow;
    } catch (err) {
      console.error('Error al abrir PiP:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => closePiP();
  }, [closePiP]);

  return {
    isPipActive,
    requestPiP,
    closePiP,
    pipWindow: pipWindowRef.current
  };
}
