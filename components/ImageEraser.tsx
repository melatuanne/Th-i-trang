import React, { useRef, useState, useEffect } from 'react';
import { X, Undo, Save, Eraser, Loader2 } from 'lucide-react';
import { reconstructErasedArea } from '../services/geminiService';

interface ImageEraserProps {
  imageUrl: string;
  onSave: (newImageUrl: string) => void;
  onClose: () => void;
}

const ImageEraser: React.FC<ImageEraserProps> = ({ imageUrl, onSave, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string>(imageUrl);
  
  const [circle, setCircle] = useState({ x: 150, y: 150, radius: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ offsetX: 0, offsetY: 0 });
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    setHistory([imageUrl]);
  }, [imageUrl]);

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prevState = newHistory[newHistory.length - 1];
    setCurrentImage(prevState);
    setHistory(newHistory);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    setDragStart({
      offsetX: clickX - circle.x,
      offsetY: clickY - circle.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setCircle(prev => ({
      ...prev,
      x: currentX - dragStart.offsetX,
      y: currentY - dragStart.offsetY
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    setCircle(prev => ({ ...prev, x: clickX, y: clickY }));
  };

  const executeErase = async () => {
    const container = containerRef.current;
    if (!container) return;
    setIsErasing(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const newImgDataUrl = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("No context"));
            return;
          }

          ctx.drawImage(img, 0, 0);

          const rect = container.getBoundingClientRect();
          const scaleX = img.width / rect.width;
          const scaleY = img.height / rect.height;

          const imgX = circle.x * scaleX;
          const imgY = circle.y * scaleY;
          const imgRadius = circle.radius * scaleX;

          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(imgX, imgY, imgRadius, 0, Math.PI * 2);
          ctx.fill();

          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = currentImage;
      });

      // Call AI to reconstruct the erased area
      const reconstructedImage = await reconstructErasedArea(newImgDataUrl);
      
      setCurrentImage(reconstructedImage);
      setHistory(prev => [...prev, reconstructedImage]);
    } catch (error) {
      console.error("Erase error:", error);
      alert("Có lỗi khi dùng AI xóa vật thể. Vui lòng thử lại.");
    } finally {
      setIsErasing(false);
    }
  };

  const handleSave = () => {
    onSave(currentImage);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <h3 className="text-white font-bold flex items-center gap-2"><Eraser size={20}/> Xóa vật thể</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={24} /></button>
      </div>
      
      <div className="relative flex-1 w-full max-w-4xl bg-black/50 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-4">
        <div 
          className="relative inline-block shadow-2xl" 
          ref={containerRef}
          onPointerDown={handleContainerPointerDown}
          style={{ touchAction: 'none' }}
        >
          <img 
            src={currentImage} 
            alt="Target" 
            className="max-w-full max-h-[60vh] object-contain pointer-events-none rounded-lg" 
          />
          <div 
            style={{
              position: 'absolute',
              left: circle.x,
              top: circle.y,
              width: circle.radius * 2,
              height: circle.radius * 2,
              borderRadius: '50%',
              border: '2px dashed #ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              cursor: isDragging ? 'grabbing' : 'grab',
              transform: 'translate(-50%, -50%)',
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      <div className="w-full max-w-4xl mt-6 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4 flex-1">
          <label className="text-xs font-bold text-white/70 whitespace-nowrap">Cỡ ô xóa:</label>
          <input 
            type="range" 
            min="10" 
            max="300" 
            value={circle.radius} 
            onChange={(e) => setCircle(prev => ({ ...prev, radius: Number(e.target.value) }))}
            className="w-48 accent-red-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={executeErase}
            disabled={isErasing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-black"
          >
            {isErasing ? <Loader2 size={16} className="animate-spin" /> : <Eraser size={16} />} 
            {isErasing ? 'Đang tái tạo...' : 'Thực hiện xóa'}
          </button>
          <button 
            onClick={handleUndo}
            disabled={history.length <= 1 || isErasing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-white"
          >
            <Undo size={16} /> Hoàn tác
          </button>
          <button 
            onClick={handleSave}
            disabled={isErasing}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-white"
          >
            <Save size={16} /> Lưu ảnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEraser;
