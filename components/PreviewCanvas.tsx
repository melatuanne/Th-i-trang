
import React, { useState, useRef, useEffect } from 'react';
import { SaleConfig, SaleItem } from '../types';

interface PreviewCanvasProps {
  image: string;
  config: SaleConfig;
  item: SaleItem;
  onUpdateOverlay?: (updates: Partial<SaleConfig>) => void;
  onClick?: () => void;
}

type DragTarget = 'logo' | 'brand' | 'headline' | 'promoText' | 'code' | 'bottomNote' | string;

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ image, config, item, onUpdateOverlay, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, target: DragTarget) => {
    if (!containerRef.current || !onUpdateOverlay) return;
    
    e.stopPropagation();
    setDragTarget(target);
    const rect = containerRef.current.getBoundingClientRect();
    
    let currentX = 0, currentY = 0;
    switch(target) {
      case 'logo': currentX = config.logoX; currentY = config.logoY; break;
      case 'brand': currentX = config.brandNameX; currentY = config.brandNameY; break;
      case 'headline': currentX = config.headlineX; currentY = config.headlineY; break;
      case 'promoText': currentX = config.promoTextX; currentY = config.promoTextY; break;
      case 'code': currentX = config.codeX; currentY = config.codeY; break;
      case 'bottomNote': currentX = config.bottomNoteX; currentY = config.bottomNoteY; break;
    }
    
    const targetXpx = (currentX / 100) * rect.width;
    const targetYpx = (currentY / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - targetXpx,
      y: e.clientY - rect.top - targetYpx
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragTarget || !containerRef.current || !onUpdateOverlay) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newXpx = e.clientX - rect.left - dragOffset.x;
      const newYpx = e.clientY - rect.top - dragOffset.y;

      const newXpct = Math.min(Math.max((newXpx / rect.width) * 100, 0), 100);
      const newYpct = Math.min(Math.max((newYpx / rect.height) * 100, 0), 100);

      const updates: Partial<SaleConfig> = {};
      if (dragTarget.startsWith('custom-')) {
        const id = dragTarget.replace('custom-', '');
        const updatedCustomTexts = config.customTexts.map(ct => ct.id === id ? { ...ct, x: newXpct, y: newYpct } : ct);
        onUpdateOverlay({ customTexts: updatedCustomTexts });
        return;
      }

      switch(dragTarget) {
        case 'logo': updates.logoX = newXpct; updates.logoY = newYpct; break;
        case 'brand': updates.brandNameX = newXpct; updates.brandNameY = newYpct; break;
        case 'headline': updates.headlineX = newXpct; updates.headlineY = newYpct; break;
        case 'promoText': updates.promoTextX = newXpct; updates.promoTextY = newYpct; break;
        case 'code': updates.codeX = newXpct; updates.codeY = newYpct; break;
        case 'bottomNote': updates.bottomNoteX = newXpct; updates.bottomNoteY = newYpct; break;
      }
      onUpdateOverlay(updates);
    };

    const handleMouseUp = () => setDragTarget(null);

    if (dragTarget) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragTarget, dragOffset, onUpdateOverlay]);

  const getCommonStyle = (x: number, y: number, scale: number, target: DragTarget, align: 'left'|'center'|'right' = 'center'): React.CSSProperties => {
    let transformX = '-50%';
    if (align === 'left') transformX = '0%';
    if (align === 'right') transformX = '-100%';
    return {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(${transformX}, -50%) scale(${scale})`,
      cursor: dragTarget === target ? 'grabbing' : 'grab',
      userSelect: 'none',
      pointerEvents: 'auto',
      zIndex: dragTarget === target ? 100 : 50,
    };
  };

  const getAspectClass = () => {
    switch (config.aspectRatio) {
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      case '16:9': return 'aspect-[16/9]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-[3/4]';
    }
  };

  const getTextStyle = (styleKey: keyof SaleConfig['styles'] | string, baseSize: string, customStyle?: any): React.CSSProperties => {
    const style = customStyle || config.styles[styleKey as keyof SaleConfig['styles']];
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.weight,
      letterSpacing: `${style.spacing}em`,
      backgroundColor: style.bg ? style.bgColor : 'transparent',
      padding: style.bg ? '0.2em 0.5em' : '0',
      borderRadius: style.bg ? '4px' : '0',
      color: style.color,
      fontSize: baseSize,
      whiteSpace: 'nowrap',
      textAlign: style.align || 'center',
      textTransform: 'uppercase'
    };
  };

  const showContent = item.showContent !== false;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full mx-auto rounded-[5%] overflow-hidden shadow-2xl bg-[#0f1115] ${getAspectClass()} border border-white/5 transition-all duration-500 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ containerType: 'inline-size' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClick) {
          onClick();
        }
      }}
    >
      {image ? <img src={image || undefined} alt="Fashion" className="w-full h-full object-cover select-none pointer-events-none" /> : null}
      
      {showContent && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
          
          {config.logo && config.styles.logo.visible !== false && (
            <div 
              style={{
                ...getCommonStyle(config.logoX, config.logoY, config.logoScale, 'logo', config.styles.logo.align),
                ...getTextStyle('logo', '3cqw')
              }} 
              onMouseDown={(e) => handleMouseDown(e, 'logo')}
            >
              {config.logo}
            </div>
          )}

          {config.styles.brandName.visible !== false && (
            <div 
              style={{
                ...getCommonStyle(config.brandNameX, config.brandNameY, config.brandNameScale, 'brand', config.styles.brandName.align),
                ...getTextStyle('brandName', '1.4cqw'),
                opacity: 0.8
              }} 
              onMouseDown={(e) => handleMouseDown(e, 'brand')}
            >
              <span className="drop-shadow-sm italic">
                {config.brandName}
              </span>
            </div>
          )}

          {config.styles.headline.visible !== false && (
            <div 
              onMouseDown={(e) => handleMouseDown(e, 'headline')}
              className="flex items-center"
              style={{ ...getCommonStyle(config.headlineX, config.headlineY, config.headlineScale, 'headline', config.styles.headline.align), gap: '1cqw' }}
            >
              {!config.styles.headline.bg && <div style={{ height: '1px', width: '3cqw', backgroundColor: config.styles.headline.color, opacity: 0.4 }}></div>}
              <span style={getTextStyle('headline', '1.3cqw')} className="drop-shadow-lg italic">
                {config.promotionSubtitle}
              </span>
              {!config.styles.headline.bg && <div style={{ height: '1px', width: '3cqw', backgroundColor: config.styles.headline.color, opacity: 0.4 }}></div>}
            </div>
          )}

          {config.styles.promoText.visible !== false && (
            <div 
              style={{
                ...getCommonStyle(config.promoTextX, config.promoTextY, config.promoTextScale, 'promoText', config.styles.promoText.align),
                ...getTextStyle('promoText', '5cqw')
              }}
              onMouseDown={(e) => handleMouseDown(e, 'promoText')}
            >
              <h2 className="drop-shadow-2xl italic">
                {config.promotionText}
              </h2>
            </div>
          )}

          {config.bottomNote && config.styles.bottomNote.visible !== false && (
            <div 
              style={{
                ...getCommonStyle(config.bottomNoteX, config.bottomNoteY, config.bottomNoteScale, 'bottomNote', config.styles.bottomNote.align),
                ...getTextStyle('bottomNote', '0.9cqw'),
                opacity: 0.8
              }}
              onMouseDown={(e) => handleMouseDown(e, 'bottomNote')}
            >
              <span className="drop-shadow-md italic">
                {config.bottomNote}
              </span>
            </div>
          )}

          {item.productCode && config.styles.code.visible !== false && (
            <div 
              style={{
                ...getCommonStyle(config.codeX, config.codeY, config.codeScale, 'code', config.styles.code.align),
                ...getTextStyle('code', '1cqw'),
                opacity: 0.6
              }} 
              onMouseDown={(e) => handleMouseDown(e, 'code')}
            >
              <span className="drop-shadow-sm">
                {item.productCode}
              </span>
            </div>
          )}

          {config.customTexts?.map(ct => {
            if (ct.style.visible === false) return null;
            return (
              <div 
                key={ct.id}
                style={{
                  ...getCommonStyle(ct.x, ct.y, ct.scale, `custom-${ct.id}`, ct.style.align),
                  ...getTextStyle('', '2cqw', ct.style)
                }}
                onMouseDown={(e) => handleMouseDown(e, `custom-${ct.id}`)}
              >
                <span className="drop-shadow-md">
                  {ct.text}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default PreviewCanvas;
