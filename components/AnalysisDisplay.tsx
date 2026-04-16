
import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { Info, Target, Sparkles, Layers, User, ShoppingBag, MessageSquare, Hash, Edit2, Check, X } from 'lucide-react';

interface AnalysisDisplayProps {
  analysis: ImageAnalysis;
  onUpdateAnalysis?: (updatedAnalysis: ImageAnalysis) => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, onUpdateAnalysis }) => {
  const [isEditingStyle, setIsEditingStyle] = useState(false);
  const [editedStyle, setEditedStyle] = useState(analysis.styleDna.modelOutfitStyle);

  const handleSaveStyle = () => {
    if (onUpdateAnalysis) {
      onUpdateAnalysis({
        ...analysis,
        styleDna: {
          ...analysis.styleDna,
          modelOutfitStyle: editedStyle
        }
      });
    }
    setIsEditingStyle(false);
  };

  const handleCancelStyle = () => {
    setEditedStyle(analysis.styleDna.modelOutfitStyle);
    setIsEditingStyle(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Fashion/Model DNA */}
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <User size={20} className="text-slate-300" />
            <h3 className="font-bold uppercase tracking-[0.3em] text-[11px]">Phân tích mẫu & trang phục</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-black/40 p-5 rounded-3xl border border-white/5 relative group">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Kiểu dáng / Chất liệu</p>
                 {!isEditingStyle && onUpdateAnalysis && (
                   <button 
                     onClick={() => setIsEditingStyle(true)}
                     className="text-white/30 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
                     title="Sửa phân tích"
                   >
                     <Edit2 size={12} />
                   </button>
                 )}
               </div>
               
               {isEditingStyle ? (
                 <div className="space-y-3">
                   <textarea 
                     value={editedStyle}
                     onChange={(e) => setEditedStyle(e.target.value)}
                     className="w-full bg-black/40 border border-slate-300/30 rounded-xl p-3 text-xs text-white outline-none focus:border-slate-300 min-h-[100px] resize-y"
                   />
                   <div className="flex justify-end gap-2">
                     <button 
                       onClick={handleCancelStyle}
                       className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                     >
                       <X size={14} />
                     </button>
                     <button 
                       onClick={handleSaveStyle}
                       className="p-1.5 rounded-lg bg-slate-300/20 text-slate-300 hover:bg-slate-300/30 transition-colors"
                     >
                       <Check size={14} />
                     </button>
                   </div>
                 </div>
               ) : (
                 <p className="text-sm text-white/70 italic leading-relaxed">"{analysis.styleDna.modelOutfitStyle}"</p>
               )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-slate-300/10 text-slate-300 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300/20">{analysis.styleDna.fashionType}</span>
              <span className="bg-white/5 text-white/40 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">{analysis.styleDna.mood}</span>
            </div>
          </div>
        </div>

        {/* Background DNA */}
        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Layers size={20} className="text-blue-500" />
            <h3 className="font-bold uppercase tracking-[0.3em] text-[11px]">ADN bối cảnh hiện tại</h3>
          </div>
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                 <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Ánh sáng</p>
                 <p className="text-sm text-white/80">{analysis.backgroundDna.lighting}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Độ sâu trường ảnh</p>
                 <p className="text-sm text-white/80">{analysis.backgroundDna.depthOfField}</p>
               </div>
             </div>
             <div className="bg-blue-500/5 p-5 rounded-3xl border border-blue-500/20 italic text-blue-400/80 text-xs leading-relaxed">
               <p className="text-[9px] text-blue-400 font-black uppercase not-italic mb-2 tracking-tighter flex items-center gap-2">
                 <Target size={12} /> Chiến lược đồng nhất
               </p>
               "{analysis.backgroundDna.consistencyNote}"
             </div>
          </div>
        </div>
      </div>

      {/* Marketing & Styling Suggestions */}
      {analysis.marketing && (
        <div className="space-y-8">
          <div className="bg-emerald-500/10 p-6 rounded-[32px] border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium leading-relaxed text-center">
              Đề xuất các cách phối đồ, caption bán hàng chuyên nghiệp và nội dung xây dựng thương hiệu (Branding) thu hút.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Styling Tips */}
            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag size={20} className="text-emerald-500" />
                <h3 className="font-bold uppercase tracking-[0.3em] text-[11px]">Gợi ý phối đồ (Styling)</h3>
              </div>
              <div className="space-y-3">
                {analysis.marketing.stylingTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Captions */}
            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare size={20} className="text-purple-500" />
                <h3 className="font-bold uppercase tracking-[0.3em] text-[11px]">Caption bán hàng chuyên nghiệp</h3>
              </div>
              <div className="space-y-4">
                {analysis.marketing.captions.map((cap, idx) => (
                  <div key={idx} className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{cap.title}</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(`${cap.title}\n\n${cap.content}\n\n${cap.hashtags.join(' ')}`)}
                        className="text-[9px] text-white/30 hover:text-white transition-colors uppercase font-bold"
                      >
                        Sao chép
                      </button>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{cap.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {cap.hashtags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] text-purple-400/60 font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branding & Storytelling Captions */}
          <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={20} className="text-slate-300" />
              <h3 className="font-bold uppercase tracking-[0.3em] text-[11px]">Xây dựng thương hiệu (Storytelling)</h3>
            </div>
            <div className="space-y-4">
              {analysis.marketing.brandingCaptions.map((cap, idx) => (
                <div key={idx} className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{cap.title}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`${cap.title}\n\n${cap.content}\n\n${cap.hashtags.join(' ')}`)}
                      className="text-[9px] text-white/30 hover:text-white transition-colors uppercase font-bold"
                    >
                      Sao chép
                    </button>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap flex-grow italic">"{cap.content}"</p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {cap.hashtags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[9px] text-slate-300/40 font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
