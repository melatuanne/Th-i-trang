
import { SaleConfig, SaleItem, TextStyle } from "../types";

export const exportItemAsImage = async (item: SaleItem, config: SaleConfig): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = item.image || "";

      await new Promise((res) => (img.onload = res));

      // Xác định kích thước ảnh xuất (High Resolution)
      const baseWidth = 2048;
      let canvasHeight = baseWidth;
      const ratio = config.aspectRatio;
      
      if (ratio === '3:4') canvasHeight = baseWidth * (4/3);
      else if (ratio === '4:3') canvasHeight = baseWidth * (3/4);
      else if (ratio === '16:9') canvasHeight = baseWidth * (9/16);
      else if (ratio === '9:16') canvasHeight = baseWidth * (16/9);

      const canvas = document.createElement('canvas');
      canvas.width = baseWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context not available");

      // 1. Vẽ ảnh gốc
      ctx.drawImage(img, 0, 0, baseWidth, canvasHeight);

      // 2. Vẽ Gradient overlay phía dưới để text rõ hơn
      const showContent = item.showContent !== false;
      
      if (showContent) {
        const gradient = ctx.createLinearGradient(0, canvasHeight * 0.7, 0, canvasHeight);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, baseWidth, canvasHeight);
      }

      // Helper để tính toán vị trí theo %
      const getX = (pct: number) => (pct / 100) * baseWidth;
      const getY = (pct: number) => (pct / 100) * canvasHeight;
      const getS = (size: number) => (size / 100) * baseWidth; // Cqw equivalent

      // Đảm bảo font đã load
      try {
        await document.fonts.load('100px Montserrat');
        await document.fonts.load('100px "Cormorant Garamond"');
        await document.fonts.load('100px Inter');
        await document.fonts.load('100px "Playfair Display"');
        await document.fonts.load('100px Oswald');
        await document.fonts.load('100px "Bodoni Moda"');
        await document.fonts.load('100px Cinzel');
        await document.fonts.load('100px Italiana');
        await document.fonts.load('100px Marcellus');
        await document.fonts.load('100px Prata');
        await document.fonts.load('100px "Tenor Sans"');
        await document.fonts.load('100px Jost');
        await document.fonts.load('100px Syne');
      } catch (e) {
        console.warn("Some fonts failed to load", e);
      }

      const drawText = (
        text: string, 
        x: number, 
        y: number, 
        styleOrKey: keyof SaleConfig['styles'] | TextStyle, 
        baseSize: number, 
        opacity: number = 1,
        isItalic: boolean = false,
        hasShadow: boolean = false
      ) => {
        const style = typeof styleOrKey === 'string' ? config.styles[styleOrKey] : styleOrKey;
        if (style.visible === false) return;

        ctx.save();
        ctx.textAlign = style.align || 'center';
        ctx.textBaseline = 'middle';
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = style.color;
        
        const italicStr = isItalic ? 'italic ' : '';
        ctx.font = `${italicStr}${style.weight} ${baseSize}px ${style.fontFamily}`;
        
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = `${style.spacing}em`;
        }

        text = text.toUpperCase();

        if (style.bg) {
          ctx.save();
          ctx.fillStyle = style.bgColor;
          const metrics = ctx.measureText(text);
          const padX = baseSize * 0.5;
          const padY = baseSize * 0.2;
          const bgWidth = metrics.width + padX * 2;
          const bgHeight = baseSize * 1.2 + padY * 2;
          
          let startX = x - bgWidth/2;
          if (style.align === 'left') startX = x - padX;
          if (style.align === 'right') startX = x - bgWidth + padX;

          ctx.fillRect(startX, y - bgHeight/2, bgWidth, bgHeight);
          ctx.restore();
        }

        if (hasShadow) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'black';
        }

        ctx.fillText(text, x, y);
        ctx.restore();
      };

      if (showContent) {
        // 3. Vẽ Logo
        if (config.logo) {
          drawText(config.logo, getX(config.logoX), getY(config.logoY), 'logo', getS(3) * config.logoScale);
        }

        // 4. Vẽ Tên Brand
        drawText(config.brandName, getX(config.brandNameX), getY(config.brandNameY), 'brandName', getS(1.4) * config.brandNameScale, 0.8, true);

        // 5. Vẽ Headline (Promotion Subtitle)
        const headFontSize = getS(1.3) * config.headlineScale;
        const headX = getX(config.headlineX);
        const headY = getY(config.headlineY);
        
        drawText(config.promotionSubtitle, headX, headY, 'headline', headFontSize, 1, true);
        
        // Vẽ line 2 bên headline nếu không có nền
        if (config.styles.headline.visible !== false && !config.styles.headline.bg) {
          ctx.save();
          ctx.font = `italic ${config.styles.headline.weight} ${headFontSize}px ${config.styles.headline.fontFamily}`;
          if ('letterSpacing' in ctx) (ctx as any).letterSpacing = `${config.styles.headline.spacing}em`;
          const textWidth = ctx.measureText(config.promotionSubtitle.toUpperCase()).width;
          const lineWidth = getS(3);
          ctx.strokeStyle = config.styles.headline.color;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          let centerX = headX;
          if (config.styles.headline.align === 'left') centerX = headX + textWidth/2;
          if (config.styles.headline.align === 'right') centerX = headX - textWidth/2;

          ctx.moveTo(centerX - textWidth/2 - lineWidth - 10, headY);
          ctx.lineTo(centerX - textWidth/2 - 10, headY);
          ctx.moveTo(centerX + textWidth/2 + 10, headY);
          ctx.lineTo(centerX + textWidth/2 + lineWidth + 10, headY);
          ctx.stroke();
          ctx.restore();
        }

        // 6. Vẽ Promo Text (Headline lớn)
        drawText(config.promotionText, getX(config.promoTextX), getY(config.promoTextY), 'promoText', getS(5) * config.promoTextScale, 1, true, true);

        // 7.1 Vẽ Bottom Note
        if (config.bottomNote) {
          drawText(config.bottomNote, getX(config.bottomNoteX), getY(config.bottomNoteY), 'bottomNote', getS(0.9) * config.bottomNoteScale, 0.8, true);
        }

        // 8. Vẽ SKU/Code
        if (item.productCode) {
          drawText(item.productCode, getX(config.codeX), getY(config.codeY), 'code', getS(1) * config.codeScale, 0.6);
        }

        // 9. Vẽ Custom Texts
        config.customTexts?.forEach(ct => {
          drawText(ct.text, getX(ct.x), getY(ct.y), ct.style, getS(2) * ct.scale);
        });
      }

      // 9. Download
      const link = document.createElement('a');
      link.download = `SALE_${item.productCode || 'IMAGE'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
