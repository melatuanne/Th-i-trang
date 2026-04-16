
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, Settings2, Palette, Sparkles, Loader2, Wand2, RefreshCcw, Camera, Layout, Store, Scissors, Type as FontIcon, Maximize, ImageIcon, Hash, Tag, CircleDollarSign, Move, SearchCode, Plus, Layers, Package, ListPlus, Files, ToggleLeft, ToggleRight, CheckCircle2, AlignCenter, Eye, EyeOff, RotateCcw, Sparkle, XCircle, AlignLeft, AlignCenter as AlignCenterIcon, AlignRight, ShoppingBag, MessageSquare, Eraser, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppState, SaleConfig, SaleItem, TextStyle, CustomText, TextColorTheme } from './types';
import { analyzeFashionImage, redesignBackground, suggestAccessories, generateVideoPrompts } from './services/geminiService';
import { exportItemAsImage } from './services/exportService';
import PreviewCanvas from './components/PreviewCanvas';
import AnalysisDisplay from './components/AnalysisDisplay';
import ImageEraser from './components/ImageEraser';

const INITIAL_CONFIG: SaleConfig = {
  brandName: "CLOTHING",
  logo: null,
  logoColor: 'white',
  promotionText: "TRÊN TOÀN HỆ THỐNG",
  promotionSubtitle: "SPECIAL OFFER",
  bottomNote: "(*) SỐ LƯỢNG CÓ HẠN",
  theme: 'luxury',
  aspectRatio: '1:1',
  
  logoX: 5, logoY: 5, logoScale: 1.0,
  brandNameX: 5, brandNameY: 10, brandNameScale: 1.0,
  headlineX: 50, headlineY: 65, headlineScale: 1.0,
  promoTextX: 50, promoTextY: 72, promoTextScale: 1.0,
  bottomNoteX: 50, bottomNoteY: 90, bottomNoteScale: 1.0,
  codeX: 95, codeY: 95, codeScale: 1.0,

  textColorTheme: 'white',
  customTexts: [],
  selectedModelId: null,
  referenceModelImage: null,
  autoSelectModel: false,
  enhanceImage: false,
  selectedAccessories: [],
  backgroundOnlyMode: false,
  enableClothingTag: false,
  clothingTagBrand: "",
  clothingTagColor: "white",
  styles: {
    logo: { fontFamily: 'Montserrat', weight: '800', spacing: 0, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
    brandName: { fontFamily: '"Cormorant Garamond"', weight: '900', spacing: 0.4, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
    headline: { fontFamily: '"Cormorant Garamond"', weight: '700', spacing: 0.6, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
    promoText: { fontFamily: '"Cormorant Garamond"', weight: '900', spacing: 0, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
    bottomNote: { fontFamily: 'Inter', weight: '700', spacing: 0.2, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
    code: { fontFamily: '"Times New Roman", Times, serif', weight: '700', spacing: 0.5, color: '#ffffff', bg: false, bgColor: 'rgba(0,0,0,0.5)', align: 'center', visible: true },
  }
};

const DEFAULT_ITEM: SaleItem = {
  id: '1',
  productCode: "FSH-2025",
};

interface TextLayoutPreset {
  name: string;
  description: string;
  config: Partial<SaleConfig>;
  alignments: {
    logo: 'left' | 'center' | 'right';
    brandName: 'left' | 'center' | 'right';
    headline: 'left' | 'center' | 'right';
    promoText: 'left' | 'center' | 'right';
    bottomNote: 'left' | 'center' | 'right';
    code: 'left' | 'center' | 'right';
  };
}

const getTextLayouts = (aspectRatio: string): TextLayoutPreset[] => {
  const isWide = aspectRatio === '16:9' || aspectRatio === '4:3';
  const isTall = aspectRatio === '9:16' || aspectRatio === '3:4';

  // Safe margins to prevent text cutoff based on aspect ratio
  const marginX = isTall ? 12 : 8;
  const marginY = isWide ? 15 : 8;
  const rightX = 100 - marginX;
  const bottomY = 100 - marginY;
  const centerX = 50;

  return [
    {
      name: "Trung tâm cổ điển",
      description: "Cân bằng, truyền thống",
      config: {
        logoX: centerX, logoY: marginY,
        brandNameX: centerX, brandNameY: marginY + 6,
        headlineX: centerX, headlineY: 45,
        promoTextX: centerX, promoTextY: 55,
        codeX: centerX, codeY: bottomY - 6,
        bottomNoteX: centerX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'center', brandName: 'center', headline: 'center', promoText: 'center', code: 'center', bottomNote: 'center' }
    },
    {
      name: "Góc trái tối giản",
      description: "Căn trái, hiện đại",
      config: {
        logoX: marginX, logoY: marginY,
        brandNameX: marginX, brandNameY: marginY + 6,
        headlineX: marginX, headlineY: 70,
        promoTextX: marginX, promoTextY: 80,
        codeX: marginX, codeY: bottomY - 6,
        bottomNoteX: marginX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'left', brandName: 'left', headline: 'left', promoText: 'left', code: 'left', bottomNote: 'left' }
    },
    {
      name: "Tạp chí thời trang",
      description: "Phá cách, ấn tượng",
      config: {
        logoX: centerX, logoY: marginY,
        brandNameX: centerX, brandNameY: marginY + 6,
        headlineX: marginX, headlineY: 75,
        promoTextX: rightX, promoTextY: 75,
        codeX: rightX, codeY: bottomY - 6,
        bottomNoteX: centerX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'center', brandName: 'center', headline: 'left', promoText: 'right', code: 'right', bottomNote: 'center' }
    },
    {
      name: "Góc phải thanh lịch",
      description: "Căn phải, tinh tế",
      config: {
        logoX: rightX, logoY: marginY,
        brandNameX: rightX, brandNameY: marginY + 6,
        headlineX: rightX, headlineY: 25,
        promoTextX: rightX, promoTextY: 35,
        codeX: rightX, codeY: bottomY - 6,
        bottomNoteX: rightX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'right', brandName: 'right', headline: 'right', promoText: 'right', code: 'right', bottomNote: 'right' }
    },
    {
      name: "Chia đôi màn hình",
      description: "Trái phải cân xứng",
      config: {
        logoX: marginX, logoY: marginY,
        brandNameX: marginX, brandNameY: marginY + 6,
        headlineX: marginX, headlineY: 50,
        promoTextX: rightX, promoTextY: 50,
        codeX: rightX, codeY: 60,
        bottomNoteX: centerX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'left', brandName: 'left', headline: 'left', promoText: 'right', code: 'right', bottomNote: 'center' }
    },
    {
      name: "Khung viền",
      description: "Bao quanh ảnh",
      config: {
        logoX: marginX, logoY: marginY,
        brandNameX: marginX, brandNameY: marginY + 6,
        headlineX: centerX, headlineY: 50,
        promoTextX: rightX, promoTextY: marginY,
        codeX: marginX, codeY: bottomY,
        bottomNoteX: rightX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'left', brandName: 'left', headline: 'center', promoText: 'right', code: 'left', bottomNote: 'right' }
    },
    {
      name: "Điện ảnh",
      description: "Tập trung dưới cùng",
      config: {
        logoX: centerX, logoY: 60,
        brandNameX: centerX, brandNameY: 66,
        headlineX: centerX, headlineY: 75,
        promoTextX: centerX, promoTextY: 83,
        codeX: centerX, codeY: bottomY - 6,
        bottomNoteX: centerX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'center', brandName: 'center', headline: 'center', promoText: 'center', code: 'center', bottomNote: 'center' }
    },
    {
      name: "Góc trái trên",
      description: "Tập trung trên cùng",
      config: {
        logoX: marginX, logoY: marginY,
        brandNameX: marginX, brandNameY: marginY + 6,
        headlineX: marginX, headlineY: marginY + 16,
        promoTextX: marginX, promoTextY: marginY + 26,
        codeX: marginX, codeY: 45,
        bottomNoteX: marginX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'left', brandName: 'left', headline: 'left', promoText: 'left', code: 'left', bottomNote: 'left' }
    },
    {
      name: "Bố cục chéo",
      description: "Trái trên - Phải dưới",
      config: {
        logoX: marginX, logoY: marginY,
        brandNameX: marginX, brandNameY: marginY + 6,
        headlineX: centerX, headlineY: 50,
        promoTextX: rightX, promoTextY: bottomY - 16,
        codeX: rightX, codeY: bottomY - 8,
        bottomNoteX: rightX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'left', brandName: 'left', headline: 'center', promoText: 'right', code: 'right', bottomNote: 'right' }
    },
    {
      name: "Tiêu đề lớn",
      description: "Nhấn mạnh Headline",
      config: {
        logoX: centerX, logoY: marginY,
        brandNameX: centerX, brandNameY: marginY + 6,
        headlineX: centerX, headlineY: 40,
        promoTextX: centerX, promoTextY: 65,
        codeX: centerX, codeY: bottomY - 6,
        bottomNoteX: centerX, bottomNoteY: bottomY,
      },
      alignments: { logo: 'center', brandName: 'center', headline: 'center', promoText: 'center', code: 'center', bottomNote: 'center' }
    }
  ];
};

const App: React.FC = () => {
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
  const [state, setState] = useState<AppState>({
    image: null,
    productImages: [],
    analysis: null,
    isAnalyzing: false,
    config: INITIAL_CONFIG,
    items: [DEFAULT_ITEM],
    selectedItemId: '1',
    showAIDashboard: true,
    generationMode: 'six_separate',
    error: null,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVideoPrompts, setIsGeneratingVideoPrompts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isEraserOpen, setIsEraserOpen] = useState(false);
  const [videoPromptsText, setVideoPromptsText] = useState("");

  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateVideoPrompts = async () => {
    const selectedItems = state.items.filter(item => item.selectedForVideo && item.image);
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ảnh để tạo prompt video.");
      return;
    }

    setIsGeneratingVideoPrompts(true);
    try {
      const images = selectedItems.map(item => item.image!);
      const prompts = await generateVideoPrompts(images, state.analysis);
      
      // Update each selected item with its prompt
      selectedItems.forEach((item, index) => {
        if (prompts[index]) {
          updateItem(item.id, { videoPrompt: prompts[index] });
        }
      });

      // Aggregate prompts for the text area
      setVideoPromptsText(prompts.join('\n\n'));
    } catch (error) {
      console.error("Error generating video prompts:", error);
      alert("Có lỗi xảy ra khi tạo prompt video.");
    } finally {
      setIsGeneratingVideoPrompts(false);
    }
  };

  const handleReplaceOriginalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      updateItem(state.selectedItemId, { originalImage: base64, image: base64 });
      if (state.selectedItemId === state.items[0].id) {
        setState(prev => ({ ...prev, image: base64, isAnalyzing: true, error: null }));
        try {
          const result = await analyzeFashionImage(base64, state.productImages);
          setState(prev => ({ ...prev, analysis: result, isAnalyzing: false }));
        } catch (error: any) {
          console.error("Analysis error:", error);
          setState(prev => ({ ...prev, isAnalyzing: false, error: "Lỗi phân tích ảnh mới." }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const updateConfig = (updates: Partial<SaleConfig>) => {
    setState(prev => ({ ...prev, config: { ...prev.config, ...updates } }));
  };

  const updateItem = (id: string, updates: Partial<SaleItem>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const handleToggleAllContent = (show: boolean) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => ({ ...item, showContent: show }))
    }));
  };

  const handleGlobalColorChange = (color: string) => {
    updateConfig({
      textColorTheme: color as TextColorTheme,
      styles: {
        logo: { ...state.config.styles.logo, color },
        brandName: { ...state.config.styles.brandName, color },
        headline: { ...state.config.styles.headline, color },
        promoText: { ...state.config.styles.promoText, color },
        bottomNote: { ...state.config.styles.bottomNote, color },
        code: { ...state.config.styles.code, color },
      }
    });
  };

  const applyTextLayout = (preset: TextLayoutPreset) => {
    updateConfig({
      ...preset.config,
      styles: {
        ...state.config.styles,
        logo: { ...state.config.styles.logo, align: preset.alignments.logo },
        brandName: { ...state.config.styles.brandName, align: preset.alignments.brandName },
        headline: { ...state.config.styles.headline, align: preset.alignments.headline },
        promoText: { ...state.config.styles.promoText, align: preset.alignments.promoText },
        bottomNote: { ...state.config.styles.bottomNote, align: preset.alignments.bottomNote },
        code: { ...state.config.styles.code, align: preset.alignments.code },
      }
    });
  };

  const handleAddCustomText = () => {
    const newText: CustomText = {
      id: Date.now().toString(),
      text: "NỘI DUNG MỚI",
      x: 50,
      y: 50,
      scale: 1.0,
      style: {
        fontFamily: 'Montserrat',
        weight: '700',
        spacing: 0,
        color: state.config.textColorTheme === 'white' ? '#ffffff' : (state.config.textColorTheme === 'black' ? '#000000' : '#5C4033'),
        bg: false,
        bgColor: 'rgba(0,0,0,0.5)',
        align: 'center',
        visible: true
      }
    };
    updateConfig({ customTexts: [...state.config.customTexts, newText] });
  };

  const updateCustomText = (id: string, updates: Partial<CustomText>) => {
    updateConfig({
      customTexts: state.config.customTexts.map(ct => ct.id === id ? { ...ct, ...updates } : ct)
    });
  };

  const removeCustomText = (id: string) => {
    updateConfig({
      customTexts: state.config.customTexts.filter(ct => ct.id !== id)
    });
  };

  const renderCustomTextStyleEditor = (ct: CustomText) => {
    if (activeEditor !== `custom-${ct.id}`) return null;
    const style = ct.style;
    const updateStyle = (updates: Partial<TextStyle>) => {
      updateCustomText(ct.id, { style: { ...style, ...updates } });
    };
    return (
      <div className="mt-2 p-3 bg-black/20 rounded-xl border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
        {/* Font Family */}
        <div className="flex justify-between items-center">
          <label className="text-[8px] uppercase text-white/50">Font</label>
          <select value={style.fontFamily} onChange={e => updateStyle({fontFamily: e.target.value})} className="bg-transparent text-[10px] text-white outline-none border-b border-white/20 w-32">
            <option className="bg-[#0f1115] text-white" value="Montserrat">Montserrat</option>
            <option className="bg-[#0f1115] text-white" value='"Cormorant Garamond"'>Cormorant Garamond</option>
            <option className="bg-[#0f1115] text-white" value='"Playfair Display"'>Playfair Display</option>
            <option className="bg-[#0f1115] text-white" value='"Bodoni Moda"'>Bodoni Moda</option>
            <option className="bg-[#0f1115] text-white" value="Cinzel">Cinzel</option>
            <option className="bg-[#0f1115] text-white" value="Italiana">Italiana</option>
            <option className="bg-[#0f1115] text-white" value="Marcellus">Marcellus</option>
            <option className="bg-[#0f1115] text-white" value="Prata">Prata</option>
            <option className="bg-[#0f1115] text-white" value='"Tenor Sans"'>Tenor Sans</option>
            <option className="bg-[#0f1115] text-white" value="Jost">Jost</option>
            <option className="bg-[#0f1115] text-white" value="Syne">Syne</option>
            <option className="bg-[#0f1115] text-white" value="Inter">Inter</option>
            <option className="bg-[#0f1115] text-white" value="Oswald">Oswald</option>
            <option className="bg-[#0f1115] text-white" value='"Times New Roman", Times, serif'>Times New Roman</option>
          </select>
        </div>
        {/* Text Color */}
        <div className="flex items-center justify-between">
          <label className="text-[8px] uppercase text-white/50">Màu chữ</label>
          <input type="color" value={style.color.startsWith('#') ? style.color : '#ffffff'} onChange={e => updateStyle({color: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
        </div>
        {/* Alignment */}
        <div className="flex items-center justify-between">
          <label className="text-[8px] uppercase text-white/50">Căn lề</label>
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button onClick={() => updateStyle({align: 'left'})} className={`p-1 rounded ${style.align === 'left' ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignLeft size={12} /></button>
            <button onClick={() => updateStyle({align: 'center'})} className={`p-1 rounded ${style.align === 'center' || !style.align ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignCenterIcon size={12} /></button>
            <button onClick={() => updateStyle({align: 'right'})} className={`p-1 rounded ${style.align === 'right' ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignRight size={12} /></button>
          </div>
        </div>
        {/* Weight */}
        <div className="space-y-1">
          <div className="flex justify-between"><label className="text-[8px] uppercase text-white/50">Độ đậm</label><span className="text-[8px]">{style.weight}</span></div>
          <input type="range" min="100" max="900" step="100" value={style.weight} onChange={e => updateStyle({weight: e.target.value})} className="w-full accent-slate-300 h-1" />
        </div>
        {/* Spacing */}
        <div className="space-y-1">
          <div className="flex justify-between"><label className="text-[8px] uppercase text-white/50">Kéo giãn</label><span className="text-[8px]">{style.spacing}em</span></div>
          <input type="range" min="-0.1" max="1" step="0.05" value={style.spacing} onChange={e => updateStyle({spacing: parseFloat(e.target.value)})} className="w-full accent-slate-300 h-1" />
        </div>
        {/* Background */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
            <input type="checkbox" checked={style.bg} onChange={e => updateStyle({bg: e.target.checked})} className="accent-slate-300" />
            Tích nền
          </label>
          {style.bg && (
            <input type="color" value={style.bgColor.startsWith('#') ? style.bgColor : '#000000'} onChange={e => updateStyle({bgColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
          )}
        </div>
      </div>
    );
  };

  const renderStyleEditor = (key: keyof SaleConfig['styles']) => {
    if (activeEditor !== key) return null;
    const style = state.config.styles[key];
    const updateStyle = (updates: Partial<TextStyle>) => {
      updateConfig({
        styles: {
          ...state.config.styles,
          [key]: { ...style, ...updates }
        }
      });
    };
    return (
      <div className="mt-2 p-3 bg-black/20 rounded-xl border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
        {/* Font Family */}
        <div className="flex justify-between items-center">
          <label className="text-[8px] uppercase text-white/50">Font</label>
          <select value={style.fontFamily} onChange={e => updateStyle({fontFamily: e.target.value})} className="bg-transparent text-[10px] text-white outline-none border-b border-white/20 w-32">
            <option className="bg-[#0f1115] text-white" value="Montserrat">Montserrat</option>
            <option className="bg-[#0f1115] text-white" value='"Cormorant Garamond"'>Cormorant Garamond</option>
            <option className="bg-[#0f1115] text-white" value='"Playfair Display"'>Playfair Display</option>
            <option className="bg-[#0f1115] text-white" value='"Bodoni Moda"'>Bodoni Moda</option>
            <option className="bg-[#0f1115] text-white" value="Cinzel">Cinzel</option>
            <option className="bg-[#0f1115] text-white" value="Italiana">Italiana</option>
            <option className="bg-[#0f1115] text-white" value="Marcellus">Marcellus</option>
            <option className="bg-[#0f1115] text-white" value="Prata">Prata</option>
            <option className="bg-[#0f1115] text-white" value='"Tenor Sans"'>Tenor Sans</option>
            <option className="bg-[#0f1115] text-white" value="Jost">Jost</option>
            <option className="bg-[#0f1115] text-white" value="Syne">Syne</option>
            <option className="bg-[#0f1115] text-white" value="Inter">Inter</option>
            <option className="bg-[#0f1115] text-white" value="Oswald">Oswald</option>
            <option className="bg-[#0f1115] text-white" value='"Times New Roman", Times, serif'>Times New Roman</option>
          </select>
        </div>
        {/* Text Color */}
        <div className="flex items-center justify-between">
          <label className="text-[8px] uppercase text-white/50">Màu chữ</label>
          <input type="color" value={style.color.startsWith('#') ? style.color : '#ffffff'} onChange={e => updateStyle({color: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
        </div>
        {/* Alignment */}
        <div className="flex items-center justify-between">
          <label className="text-[8px] uppercase text-white/50">Căn lề</label>
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button onClick={() => updateStyle({align: 'left'})} className={`p-1 rounded ${style.align === 'left' ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignLeft size={12} /></button>
            <button onClick={() => updateStyle({align: 'center'})} className={`p-1 rounded ${style.align === 'center' || !style.align ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignCenterIcon size={12} /></button>
            <button onClick={() => updateStyle({align: 'right'})} className={`p-1 rounded ${style.align === 'right' ? 'bg-slate-300 text-white' : 'text-white/50 hover:text-white'}`}><AlignRight size={12} /></button>
          </div>
        </div>
        {/* Weight */}
        <div className="space-y-1">
          <div className="flex justify-between"><label className="text-[8px] uppercase text-white/50">Độ đậm</label><span className="text-[8px]">{style.weight}</span></div>
          <input type="range" min="100" max="900" step="100" value={style.weight} onChange={e => updateStyle({weight: e.target.value})} className="w-full accent-slate-300 h-1" />
        </div>
        {/* Spacing */}
        <div className="space-y-1">
          <div className="flex justify-between"><label className="text-[8px] uppercase text-white/50">Kéo giãn</label><span className="text-[8px]">{style.spacing}em</span></div>
          <input type="range" min="-0.1" max="1" step="0.05" value={style.spacing} onChange={e => updateStyle({spacing: parseFloat(e.target.value)})} className="w-full accent-slate-300 h-1" />
        </div>
        {/* Background */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
            <input type="checkbox" checked={style.bg} onChange={e => updateStyle({bg: e.target.checked})} className="accent-slate-300" />
            Tích nền
          </label>
          {style.bg && (
            <input type="color" value={style.bgColor.startsWith('#') ? style.bgColor : '#000000'} onChange={e => updateStyle({bgColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
          )}
        </div>
      </div>
    );
  };

  const handleDeleteItem = (id: string) => {
    setState(prev => {
      const newItems = prev.items.filter(item => item.id !== id);
      return {
        ...prev,
        items: newItems,
        selectedItemId: prev.selectedItemId === id ? (newItems[0]?.id || '') : prev.selectedItemId
      };
    });
  };

  const handleExportAll = async () => {
    if (state.items.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: state.items.length });

    try {
      for (let i = 0; i < state.items.length; i++) {
        setExportProgress(prev => ({ ...prev, current: i + 1 }));
        await exportItemAsImage(state.items[i], state.config);
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Có lỗi khi xuất ảnh. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReferenceModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateConfig({ referenceModelImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleProductReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    };

    for (let i = 0; i < files.length; i++) {
      const base64 = await readFile(files[i]);
      newImages.push(base64);
    }

    setState(prev => ({
      ...prev,
      productImages: [...prev.productImages, ...newImages]
    }));
  };

  const removeProductReference = (index: number) => {
    setState(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    setIsGenerating(true);

    try {
      const newItems: SaleItem[] = [];
      const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      };
      
      for (let i = 0; i < fileList.length; i++) {
        const base64 = await readFileAsDataURL(fileList[i]);
        const newId = Math.random().toString(36).substr(2, 9);
        
        newItems.push({
          id: newId,
          productCode: `FSH-${2025 + i}`,
          image: base64,
          originalImage: base64 // Lưu lại ảnh gốc khi upload
        });
      }

      setState(prev => ({
        ...prev,
        image: prev.image || newItems[0].image || null,
        items: prev.image ? [...prev.items, ...newItems] : newItems,
        selectedItemId: newItems[0].id,
        isAnalyzing: !prev.image
      }));

      if (!state.image && newItems[0]?.image) {
        const result = await analyzeFashionImage(newItems[0].image, state.productImages);
        setState(prev => ({ ...prev, analysis: result, isAnalyzing: false }));
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')
        ? "Hệ thống đang quá tải. Vui lòng thử lại sau 1 phút."
        : "Lỗi phân tích ảnh. Vui lòng thử lại.";
      setState(prev => ({ ...prev, isAnalyzing: false, error: errorMsg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackgroundRedesign = async (itemId?: string) => {
    const targetId = itemId || state.selectedItemId;
    const currentItem = state.items.find(i => i.id === targetId);
    const imgToProcess = currentItem?.originalImage || currentItem?.image || state.image;
    
    if (!imgToProcess) return;
    
    setIsGenerating(true);
    setState(prev => ({ ...prev, error: null }));
    try {
      const finalPrompt = backgroundPrompt || (state.analysis ? `Luxury fashion studio, minimal aesthetic, lighting consistent with ${state.analysis.backgroundDna.lighting}` : "Luxury fashion studio background");
      
      let modelDesc = null;
      
      const redesignedUrls = await redesignBackground(
        imgToProcess, 
        finalPrompt, 
        state.config.theme, 
        state.config.aspectRatio,
        state.analysis,
        state.generationMode,
        modelDesc,
        state.config.referenceModelImage,
        state.config.enhanceImage,
        state.config.selectedAccessories,
        state.config.backgroundOnlyMode,
        state.config.clothingTagBrand,
        state.config.clothingTagColor,
        state.config.customAccessories,
        state.config.enableClothingTag,
        state.productImages
      );

      if (redesignedUrls && redesignedUrls.length > 0) {
        // Cập nhật ảnh đầu tiên cho item hiện tại
        updateItem(targetId, { image: redesignedUrls[0], videoPrompt: undefined });
        setVideoPromptsText(""); // Clear aggregated text to force regeneration
        
        // Tạo các item mới cho các ảnh còn lại (chỉ khi không phải là regenerate cho 1 item cụ thể)
        if (!itemId && redesignedUrls.length > 1) {
          const newItems = redesignedUrls.slice(1).map((url, index) => {
            const newId = Math.random().toString(36).substr(2, 9);
            return {
              id: newId,
              productCode: `${currentItem?.productCode || 'FSH'}-${index + 1}`,
              image: url,
              originalImage: currentItem?.originalImage || imgToProcess
            };
          });
          
          setState(prev => ({
            ...prev,
            items: [...prev.items, ...newItems]
          }));
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')
        ? "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại."
        : "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.";
      setState(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevert = () => {
    const currentItem = state.items.find(i => i.id === state.selectedItemId);
    if (currentItem?.originalImage) {
      updateItem(state.selectedItemId, { image: currentItem.originalImage });
    }
  };

  const applyTheme = (prompt: string) => {
    setBackgroundPrompt(prompt);
  };

  const removeItem = (id: string) => {
    if (state.items.length <= 1) return;
    setState(prev => {
      const newItems = prev.items.filter(item => item.id !== id);
      const nextId = id === prev.selectedItemId ? newItems[0].id : prev.selectedItemId;
      return {
        ...prev,
        items: newItems,
        selectedItemId: nextId,
        image: prev.selectedItemId === id ? (newItems.find(i => i.id === nextId)?.image || prev.image) : prev.image
      };
    });
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = state.items.findIndex(i => i.id === state.selectedItemId);
    if (currentIndex < state.items.length - 1) {
      setState(prev => ({ ...prev, selectedItemId: state.items[currentIndex + 1].id }));
    } else {
      setState(prev => ({ ...prev, selectedItemId: state.items[0].id }));
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = state.items.findIndex(i => i.id === state.selectedItemId);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, selectedItemId: state.items[currentIndex - 1].id }));
    } else {
      setState(prev => ({ ...prev, selectedItemId: state.items[state.items.length - 1].id }));
    }
  };

  const selectedItem = state.items.find(i => i.id === state.selectedItemId) || state.items[0];
  const displayImage = isComparing ? (selectedItem?.originalImage || selectedItem?.image || "") : (selectedItem?.image || state.image || "");

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white/90 overflow-hidden flex flex-col">
      {/* Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8" onClick={() => setIsZoomed(false)}>
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          >
            <XCircle size={24} />
          </button>
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {state.items.length > 1 && (
              <button 
                onClick={handlePrevImage}
                className="absolute left-4 md:left-10 z-10 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-all"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            
            <div className="max-w-full max-h-full" style={{ height: '90vh', aspectRatio: state.config.aspectRatio.replace(':', '/') }}>
              <PreviewCanvas 
                image={selectedItem?.image || state.image || ""} 
                config={state.config}
                item={selectedItem}
              />
            </div>

            {state.items.length > 1 && (
              <button 
                onClick={handleNextImage}
                className="absolute right-4 md:right-10 z-10 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 p-3 rounded-full transition-all"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Eraser Modal */}
      {isEraserOpen && selectedItem?.originalImage && (
        <ImageEraser 
          imageUrl={selectedItem.originalImage}
          onClose={() => setIsEraserOpen(false)}
          onSave={(newImageUrl) => {
            updateItem(state.selectedItemId, { originalImage: newImageUrl });
            // Cập nhật state.image nếu item đang chọn là item đầu tiên hoặc đang hiển thị
            if (state.selectedItemId === state.items[0].id) {
              setState(prev => ({ ...prev, image: newImageUrl }));
            }
            setIsEraserOpen(false);
          }}
        />
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-400/50">
            <XCircle size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{state.error}</span>
            <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors">
              <XCircle size={14} className="rotate-45" />
            </button>
          </div>
        </div>
      )}
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-24 h-24 mb-8 relative">
            <Loader2 size={96} className="text-slate-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs">
              {Math.round((exportProgress.current / exportProgress.total) * 100)}%
            </div>
          </div>
          <h2 className="text-3xl font-fashion italic mb-2">Đang xuất bản ảnh hàng loạt...</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
            Đã xử lý {exportProgress.current} / {exportProgress.total} sản phẩm
          </p>
        </div>
      )}

      <header className="border-b border-white/5 bg-black/40 backdrop-blur-3xl z-50 flex-shrink-0">
        <div className="w-full px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-slate-300 to-yellow-200 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-fashion text-xl md:text-2xl font-bold tracking-tight">CLOTHING <span className="text-[9px] font-sans bg-white text-black px-1.5 py-0.5 ml-1 rounded font-black">AI STUDIO</span></h1>
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-bold">Fashion Ad Design specialist</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setState(prev => ({ ...prev, showAIDashboard: !prev.showAIDashboard }))}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${state.showAIDashboard ? 'bg-slate-300 text-black border-slate-300' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
             >
               {state.showAIDashboard ? <XCircle size={14} /> : <Sparkle size={14} />}
               {state.showAIDashboard ? 'Ẩn AI Tool' : 'Hiện AI Tool'}
             </button>

             <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
               <Package size={14} className="text-slate-300" />
               <span className="text-[10px] font-black uppercase tracking-widest">{state.items.length} SẢN PHẨM</span>
             </div>
             
             <button 
               onClick={handleExportAll}
               disabled={!state.image || isExporting}
               className={`bg-white text-black px-6 py-3 rounded-full font-black text-[10px] tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-2 ${(!state.image || isExporting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-500 hover:text-white'}`}
             >
                <Download size={14} /> XUẤT TOÀN BỘ
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full flex overflow-hidden">
        <div className="flex-grow bg-[#14151a] relative flex flex-col items-center overflow-y-auto custom-scrollbar pt-8 pb-12 px-12">
          {!state.image && !isGenerating ? (
            <div className="w-full flex-grow flex items-center justify-center">
              <div className="w-full max-w-2xl aspect-square rounded-[50px] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-10 group cursor-pointer relative overflow-hidden transition-all hover:bg-white/[0.07] hover:border-slate-400/50">
                 <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white/10 group-hover:scale-110 group-hover:text-slate-400 transition-all border border-white/5 shadow-inner">
                   <Files size={40} />
                 </div>
                 <div className="text-center z-10 space-y-3 px-10">
                   <p className="text-2xl font-fashion italic">Tải Hàng Loạt Ảnh</p>
                   <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">AI sẽ giữ nguyên mẫu và tạo bối cảnh sang trọng hơn</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-full flex overflow-x-auto gap-3 py-2 px-1 custom-scrollbar justify-center">
                {state.items.map((item, idx) => (
                  <div key={item.id} className="relative group">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, selectedItemId: item.id }))}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all relative overflow-hidden block ${state.selectedItemId === item.id ? 'border-slate-400 bg-slate-400/10 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                    >
                      {item.image ? (
                        <img src={item.image || undefined} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <ImageIcon className="text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={14} />
                      )}
                    </button>
                    {/* Checkbox for video selection */}
                    {item.image && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <input 
                          type="checkbox" 
                          checked={item.selectedForVideo || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateItem(item.id, { selectedForVideo: e.target.checked });
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-black/50 text-slate-400 focus:ring-slate-400 focus:ring-offset-black cursor-pointer"
                          title="Chọn làm phân cảnh video"
                        />
                      </div>
                    )}
                    {state.items.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="absolute -top-2 -right-2 bg-slate-400 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-slate-500 shadow-md"
                      >
                        <XCircle size={12} />
                      </button>
                    )}
                    {item.image && item.image !== item.originalImage && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleBackgroundRedesign(item.id); }}
                        className="absolute -bottom-2 -right-2 bg-slate-300 text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-slate-200 shadow-md"
                        title="Tạo lại ảnh này"
                      >
                        <RefreshCcw size={10} className={isGenerating && state.selectedItemId === item.id ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-white/40 flex items-center justify-center text-white/20 hover:text-white transition-all cursor-pointer">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                  <Plus size={14} />
                </div>
              </div>

              {/* Video Prompts Section */}
              {state.items.some(item => item.selectedForVideo) && (
                <div className="w-full max-w-5xl bg-white/5 rounded-[32px] border border-white/10 p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera size={20} className="text-blue-400" />
                      <h3 className="font-bold uppercase tracking-[0.3em] text-[11px] text-white">Tạo Video Prompts</h3>
                      <span className="text-xs text-white/50">({state.items.filter(i => i.selectedForVideo).length} ảnh được chọn)</span>
                    </div>
                    <button
                      onClick={handleGenerateVideoPrompts}
                      disabled={isGeneratingVideoPrompts}
                      className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingVideoPrompts ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      Tạo Prompts
                    </button>
                  </div>
                  
                  {videoPromptsText && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Tổng hợp Prompt Video</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(videoPromptsText)}
                          className="text-[9px] text-white/30 hover:text-white transition-colors uppercase font-bold"
                        >
                          Sao chép tất cả
                        </button>
                      </div>
                      <textarea 
                        value={videoPromptsText}
                        readOnly
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/80 outline-none min-h-[120px] resize-y font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex w-full max-w-5xl gap-8 justify-center items-start">
                {/* Original Image */}
                {selectedItem?.originalImage && (
                  <div className="w-1/3 flex-shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Ảnh gốc</p>
                      <button 
                        onClick={() => setIsEraserOpen(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1"
                      >
                        <Eraser size={10} /> Xóa vật thể
                      </button>
                    </div>
                    <div 
                      className={`relative w-full rounded-[5%] overflow-hidden shadow-2xl bg-[#0f1115] border border-white/5 group cursor-pointer`} 
                      style={{ aspectRatio: state.config.aspectRatio.replace(':', '/') }}
                      onClick={() => replaceImageInputRef.current?.click()}
                    >
                      <img src={selectedItem.originalImage} alt="Original" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white mb-2" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Đổi ảnh gốc</span>
                      </div>
                      <input 
                        type="file" 
                        ref={replaceImageInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleReplaceOriginalImage} 
                      />
                    </div>
                  </div>
                )}
                
                {/* Generated Image */}
                <div className="flex-grow max-w-xl flex flex-col gap-3 relative group">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Ảnh AI Tạo</p>
                    <div className="flex items-center gap-2">
                      {selectedItem?.originalImage && selectedItem.originalImage !== selectedItem.image && (
                        <button 
                          onClick={handleRevert}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-300 flex items-center gap-1"
                        >
                          <RotateCcw size={10} /> Quay lại gốc
                        </button>
                      )}
                      <button 
                        onClick={() => setIsZoomed(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1 ml-2"
                      >
                        <Maximize size={10} /> Phóng to
                      </button>
                    </div>
                  </div>

                  <div className="relative w-full">
                    {(isGenerating || state.isAnalyzing) && (
                      <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center rounded-[40px]">
                        <Loader2 size={40} className="text-slate-400 animate-spin mb-4" />
                        <p className="text-slate-400 font-fashion italic text-xl">
                          {state.isAnalyzing ? "Đang giải mã phong cách..." : "AI đang vẽ bối cảnh..."}
                        </p>
                      </div>
                    )}
                    
                    <PreviewCanvas 
                      image={selectedItem?.image || state.image || ""} 
                      config={state.config}
                      item={selectedItem}
                      onUpdateOverlay={(updates) => updateConfig(updates)}
                      onClick={() => setIsZoomed(true)}
                    />
                  </div>
                </div>
              </div>

              {state.showAIDashboard && state.analysis && (
                <div className="w-full max-w-3xl mt-12 animate-in slide-in-from-bottom-4">
                  <AnalysisDisplay 
                    analysis={state.analysis} 
                    onUpdateAnalysis={(updatedAnalysis) => setState(prev => ({ ...prev, analysis: updatedAnalysis }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-[450px] flex-shrink-0 bg-[#0a0b0d] border-l border-white/5 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Section: Khung hình */}
          <section className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <Layout size={18} className="text-white/40" />
              <h2 className="font-bold uppercase tracking-[0.2em] text-[10px]">Khung hình</h2>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map(ratio => (
                <button key={ratio} onClick={() => updateConfig({ aspectRatio: ratio })} className={`py-3 rounded-xl text-[9px] font-black transition-all border ${state.config.aspectRatio === ratio ? 'bg-slate-500 text-white border-slate-500' : 'bg-transparent text-white/20 border-white/5'}`}>
                  {ratio}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Tham chiếu Sản phẩm (Nhiều góc nhìn) */}
          <section className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <Files size={18} className="text-white/40" />
                <h2 className="font-bold uppercase tracking-[0.2em] text-[10px]">Tham chiếu Sản phẩm</h2>
              </div>
              <label className="cursor-pointer text-white/40 hover:text-white transition-colors">
                <Plus size={16} />
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleProductReferenceUpload}
                  accept="image/*"
                />
              </label>
            </div>
            
            {state.productImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {state.productImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/20">
                    <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeProductReference(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    >
                      <Trash2 size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/30 italic text-center py-2">
                Tải lên nhiều góc nhìn (trước, sau, cạnh...) để AI tạo chính xác hơn.
              </p>
            )}
          </section>

          {/* Section: Nội dung Sale */}
          <section className="bg-white/5 p-6 rounded-[32px] border border-slate-300/20 space-y-5">
            <div className="flex items-start justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3 mt-1">
                <AlignCenter size={18} className="text-slate-300" />
                <h2 className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-300">Nội dung</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedItem?.showContent !== false} 
                    onChange={(e) => updateItem(state.selectedItemId, { showContent: e.target.checked })}
                    className="accent-slate-300"
                  />
                  Hiển thị trên ảnh này
                </label>
                <div className="flex gap-3">
                  <button onClick={() => handleToggleAllContent(true)} className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors">Bật tất cả</button>
                  <button onClick={() => handleToggleAllContent(false)} className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors">Tắt tất cả</button>
                </div>
              </div>
            </div>

            {/* Global Text Color */}
            <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70">Màu chữ chung</label>
              <div className="flex items-center gap-2">
                <button onClick={() => handleGlobalColorChange('#ffffff')} className={`w-6 h-6 rounded-full border-2 ${state.config.textColorTheme === 'white' || state.config.textColorTheme === '#ffffff' ? 'border-slate-300' : 'border-transparent'} bg-white`}></button>
                <button onClick={() => handleGlobalColorChange('#000000')} className={`w-6 h-6 rounded-full border-2 ${state.config.textColorTheme === 'black' || state.config.textColorTheme === '#000000' ? 'border-slate-300' : 'border-white/20'} bg-black`}></button>
                <button onClick={() => handleGlobalColorChange('#5C4033')} className={`w-6 h-6 rounded-full border-2 ${state.config.textColorTheme === '#5C4033' ? 'border-slate-300' : 'border-transparent'} bg-[#5C4033]`} title="Nâu đất"></button>
              </div>
            </div>

            {/* Text Layout Presets */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Bố cục chữ (10 Mẫu)</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {getTextLayouts(state.config.aspectRatio).map((layout, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTextLayout(layout)}
                    className="text-left p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-slate-300/50 transition-all group"
                  >
                    <p className="text-[9px] font-bold text-white/90 group-hover:text-slate-300">{layout.name}</p>
                    <p className="text-[8px] text-white/40">{layout.description}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-white/5">
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Logo</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateConfig({ styles: { ...state.config.styles, logo: { ...state.config.styles.logo, visible: !state.config.styles.logo.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.logo.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                      <button onClick={() => setActiveEditor(activeEditor === 'logo' ? null : 'logo')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                    </div>
                  </div>
                  <input type="text" value={state.config.logo || ''} onChange={(e) => updateConfig({ logo: e.target.value })} placeholder="Nhập Logo..." className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-slate-300/50" />
                  <input type="range" min="0.5" max="3" step="0.1" value={state.config.logoScale} onChange={(e) => updateConfig({ logoScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                  {renderStyleEditor('logo')}
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Tên Thương Hiệu</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateConfig({ styles: { ...state.config.styles, brandName: { ...state.config.styles.brandName, visible: !state.config.styles.brandName.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.brandName.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                      <button onClick={() => setActiveEditor(activeEditor === 'brandName' ? null : 'brandName')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                    </div>
                  </div>
                  <input type="text" value={state.config.brandName} onChange={(e) => updateConfig({ brandName: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-slate-300/50" />
                  <input type="range" min="0.5" max="3" step="0.1" value={state.config.brandNameScale} onChange={(e) => updateConfig({ brandNameScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                  {renderStyleEditor('brandName')}
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Subtitle</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateConfig({ styles: { ...state.config.styles, headline: { ...state.config.styles.headline, visible: !state.config.styles.headline.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.headline.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                      <button onClick={() => setActiveEditor(activeEditor === 'headline' ? null : 'headline')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                    </div>
                  </div>
                  <input type="text" value={state.config.promotionSubtitle} onChange={(e) => updateConfig({ promotionSubtitle: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-slate-300/50" />
                  <input type="range" min="0.3" max="2.5" step="0.1" value={state.config.headlineScale} onChange={(e) => updateConfig({ headlineScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                  {renderStyleEditor('headline')}
               </div>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Headline chính</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateConfig({ styles: { ...state.config.styles, promoText: { ...state.config.styles.promoText, visible: !state.config.styles.promoText.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.promoText.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                      <button onClick={() => setActiveEditor(activeEditor === 'promoText' ? null : 'promoText')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                    </div>
                  </div>
                  <input type="text" value={state.config.promotionText} onChange={(e) => updateConfig({ promotionText: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-fashion font-bold italic outline-none focus:border-slate-300/50" />
                  <input type="range" min="0.5" max="3.5" step="0.1" value={state.config.promoTextScale} onChange={(e) => updateConfig({ promoTextScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                  {renderStyleEditor('promoText')}
               </div>
               <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-white/20 uppercase">Mã sản phẩm</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateConfig({ styles: { ...state.config.styles, code: { ...state.config.styles.code, visible: !state.config.styles.code.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.code.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                        <button onClick={() => setActiveEditor(activeEditor === 'code' ? null : 'code')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                      </div>
                    </div>
                    <input type="text" value={selectedItem?.productCode || ''} onChange={(e) => updateItem(state.selectedItemId, { productCode: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none focus:border-slate-300/50" />
                    <input type="range" min="0.3" max="2.5" step="0.1" value={state.config.codeScale} onChange={(e) => updateConfig({ codeScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                    {renderStyleEditor('code')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-white/20 uppercase">Ghi chú chân</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateConfig({ styles: { ...state.config.styles, bottomNote: { ...state.config.styles.bottomNote, visible: !state.config.styles.bottomNote.visible } } })} className="text-white/40 hover:text-slate-300">{state.config.styles.bottomNote.visible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                        <button onClick={() => setActiveEditor(activeEditor === 'bottomNote' ? null : 'bottomNote')} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                      </div>
                    </div>
                    <input type="text" value={state.config.bottomNote} onChange={(e) => updateConfig({ bottomNote: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none focus:border-slate-300/50" />
                    <input type="range" min="0.3" max="2.5" step="0.1" value={state.config.bottomNoteScale} onChange={(e) => updateConfig({ bottomNoteScale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                    {renderStyleEditor('bottomNote')}
                  </div>
               </div>
            </div>

            {/* Custom Texts Section */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Chữ tùy chỉnh</label>
                <button onClick={handleAddCustomText} className="text-slate-300 hover:text-slate-200 bg-slate-300/10 hover:bg-slate-300/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors">
                  <Plus size={12} /> Thêm chữ
                </button>
              </div>
              
              <div className="space-y-4">
                {state.config.customTexts.map((ct) => (
                  <div key={ct.id} className="space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Nội dung {ct.id.slice(-4)}</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCustomText(ct.id, { style: { ...ct.style, visible: !ct.style.visible } })} className="text-white/40 hover:text-slate-300">{ct.style.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}</button>
                        <button onClick={() => setActiveEditor(activeEditor === `custom-${ct.id}` ? null : `custom-${ct.id}`)} className="text-white/40 hover:text-slate-300"><Settings2 size={12} /></button>
                        <button onClick={() => removeCustomText(ct.id)} className="text-white/40 hover:text-slate-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <input type="text" value={ct.text} onChange={(e) => updateCustomText(ct.id, { text: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-slate-300/50" />
                    <input type="range" min="0.5" max="5" step="0.1" value={ct.scale} onChange={(e) => updateCustomText(ct.id, { scale: parseFloat(e.target.value) })} className="w-full accent-slate-300 h-1" />
                    {renderCustomTextStyleEditor(ct)}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section: AI Dashboard (Conditional) */}
          {state.showAIDashboard && (
            <section className="bg-slate-400/5 p-6 rounded-[32px] border border-slate-400/20 space-y-5 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-slate-400" />
                    <h2 className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">AI Redesign bối cảnh</h2>
                  </div>
                  {displayImage && (
                    <button onClick={() => handleBackgroundRedesign()} className="flex items-center gap-2 bg-slate-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-500 transition-all shadow-lg">
                      <Wand2 size={12} /> Bắt đầu vẽ
                    </button>
                  )}
              </div>
              
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={state.config.backgroundOnlyMode} 
                    onChange={(e) => updateConfig({ backgroundOnlyMode: e.target.checked })}
                    className="accent-slate-400"
                  />
                  Tạo nền trống (Không có người/quần áo, dùng để chèn chữ/logo)
                </label>
              </div>

              {state.config.backgroundOnlyMode && (
                <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in">
                  <label className="text-[8px] font-black text-white/20 uppercase">Nội dung nền</label>
                  <textarea
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    placeholder="Nhập mô tả nền (VD: Nền lụa đỏ sang trọng, ánh sáng studio...)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-slate-400/50 resize-none h-20"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setBackgroundPrompt("Luxury dark marble texture with subtle gold veins, studio lighting")} className="text-left p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] text-white/70">Đá cẩm thạch đen vàng</button>
                    <button onClick={() => setBackgroundPrompt("Elegant flowing red silk fabric, soft studio lighting, high-end fashion background")} className="text-left p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] text-white/70">Lụa đỏ sang trọng</button>
                    <button onClick={() => setBackgroundPrompt("Minimalist clean white studio background with soft spotlight, subtle shadows")} className="text-left p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] text-white/70">Studio trắng tối giản</button>
                    <button onClick={() => setBackgroundPrompt("Abstract elegant dark gradient background, premium feel, subtle noise texture")} className="text-left p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[9px] text-white/70">Gradient tối cao cấp</button>
                  </div>
                </div>
              )}

              {!state.config.backgroundOnlyMode && (
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-white/20 uppercase">Chế độ tạo ảnh</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                        <input type="radio" name="genMode" value="single" checked={state.generationMode === 'single'} onChange={() => setState(prev => ({...prev, generationMode: 'single'}))} className="accent-slate-400" />
                        1 Ảnh (Giữ nguyên dáng)
                      </label>
                      <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                        <input type="radio" name="genMode" value="six_separate" checked={state.generationMode === 'six_separate'} onChange={() => setState(prev => ({...prev, generationMode: 'six_separate'}))} className="accent-slate-400" />
                        6 Ảnh lẻ (Đứng, Bước đi, Dựa tường, Cận cảnh, Quay lưng, Street style)
                      </label>
                      <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                        <input type="radio" name="genMode" value="collage" checked={state.generationMode === 'collage'} onChange={() => setState(prev => ({...prev, generationMode: 'collage'}))} className="accent-slate-400" />
                        Ảnh ghép (4 dáng trong 1 ảnh)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={state.config.enhanceImage} 
                        onChange={(e) => updateConfig({ enhanceImage: e.target.checked })}
                        className="accent-slate-400"
                      />
                      Làm nét ảnh gốc (nếu ảnh bị mờ)
                    </label>
                  </div>

                  {state.analysis?.styleDna?.accessories && state.analysis.styleDna.accessories.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[8px] font-black text-white/20 uppercase">Phụ kiện đi kèm (Giữ lại)</label>
                      <div className="flex flex-wrap gap-2">
                        {state.analysis.styleDna.accessories.map((acc, idx) => {
                          const isSelected = state.config.selectedAccessories.includes(acc);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                const newAccs = isSelected 
                                  ? state.config.selectedAccessories.filter(a => a !== acc)
                                  : [...state.config.selectedAccessories, acc];
                                updateConfig({ selectedAccessories: newAccs });
                              }}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${isSelected ? 'bg-slate-300 border-slate-300 text-black' : 'bg-black/40 border-white/10 text-white/70 hover:border-slate-300/50 hover:text-white'}`}
                            >
                              {acc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-white/20 uppercase">Thêm phụ kiện mới</label>
                      <button 
                        onClick={async () => {
                          const suggested = await suggestAccessories(backgroundPrompt, state.config.theme, state.analysis);
                          if (suggested) {
                            updateConfig({ customAccessories: suggested });
                          }
                        }}
                        className="text-[9px] font-bold text-slate-300 hover:text-slate-200 flex items-center gap-1 bg-slate-300/10 px-2 py-1 rounded-md"
                      >
                        <Sparkles size={10} /> Gợi ý tự động
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={state.config.customAccessories || ''} 
                      onChange={(e) => updateConfig({ customAccessories: e.target.value })} 
                      placeholder="VD: kính râm, túi xách, ly nước..." 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none focus:border-slate-300/50 text-white" 
                    />
                  </div>
                  
                  {state.analysis && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                      <button 
                        onClick={() => setBackgroundPrompt("Clean solid white background, high-end studio lighting, professional product photography style, no shadows on background")} 
                        className={`text-left p-3 rounded-2xl border transition-all ${backgroundPrompt.includes("Clean solid white background") ? 'bg-slate-300 border-slate-300 text-black' : 'bg-black/40 border-white/5 text-white hover:border-slate-300/50'}`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1">Tách nền (Trắng trơn)</p>
                        <p className="text-[8px] opacity-60 italic">Xóa bối cảnh, giữ người mẫu trên nền trắng chuyên nghiệp</p>
                      </button>
                      {state.analysis.suggestedThemes.map((theme, i) => (
                        <button key={i} onClick={() => applyTheme(theme.prompt)} className={`text-left p-3 rounded-2xl border transition-all ${backgroundPrompt === theme.prompt ? 'bg-slate-500 border-slate-500 text-white' : 'bg-black/40 border-white/5 text-white hover:border-slate-400/50'}`}>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1">{theme.name}</p>
                          <p className={`text-[8px] opacity-60 italic`}>{theme.description}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black text-white/20 uppercase">Người mẫu (VN/Trung - 25-30t)</label>
                    </div>
                    
                    {!state.config.autoSelectModel && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-3">
                          <div className="relative group">
                            <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                              onChange={handleReferenceModelUpload} 
                              accept="image/*"
                            />
                            <div className={`w-full p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${state.config.referenceModelImage ? 'border-slate-300/50 bg-slate-300/5' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                              {state.config.referenceModelImage ? (
                                <div className="flex items-center gap-4 w-full">
                                  <img src={state.config.referenceModelImage} className="w-12 h-12 rounded-lg object-cover border border-slate-300/30" alt="Reference" />
                                  <div className="flex-grow">
                                    <p className="text-[10px] font-black uppercase text-slate-300">Đã tải mẫu cố định</p>
                                    <p className="text-[8px] text-white/40">AI sẽ dùng khuôn mặt & dáng người này</p>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateConfig({ referenceModelImage: null }); }}
                                    className="p-2 hover:bg-slate-400/20 rounded-full text-slate-400 transition-colors z-20 relative"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Upload size={16} className="text-white/40" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tải ảnh mẫu cố định</p>
                                  <p className="text-[8px] text-white/20 italic">Tải ảnh người mẫu bạn muốn AI ghi nhớ</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={state.config.enableClothingTag || false} 
                        onChange={(e) => updateConfig({ enableClothingTag: e.target.checked })}
                        className="accent-slate-400"
                      />
                      Thêm mác thương hiệu (AI vẽ lên cổ áo - Chỉ cho ảnh trải sàn/treo móc)
                    </label>
                    {state.config.enableClothingTag && (
                      <div className="flex flex-col gap-2 animate-in fade-in">
                        <input
                          type="text"
                          value={state.config.clothingTagBrand || ''}
                          onChange={(e) => updateConfig({ clothingTagBrand: e.target.value })}
                          placeholder="Nhập tên thương hiệu (VD: CLOTHING)"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-slate-400/50"
                        />
                        {state.config.clothingTagBrand && (
                          <div className="flex items-center gap-4 mt-1">
                            <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                              <input type="radio" name="tagColor" value="white" checked={state.config.clothingTagColor === 'white' || !state.config.clothingTagColor} onChange={() => updateConfig({ clothingTagColor: 'white' })} className="accent-slate-400" />
                              Chữ Trắng
                            </label>
                            <label className="flex items-center gap-2 text-[10px] text-white/70 cursor-pointer">
                              <input type="radio" name="tagColor" value="black" checked={state.config.clothingTagColor === 'black'} onChange={() => updateConfig({ clothingTagColor: 'black' })} className="accent-slate-400" />
                              Chữ Đen
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    
                  <textarea value={backgroundPrompt} onChange={(e) => setBackgroundPrompt(e.target.value)} placeholder="Mô tả bối cảnh..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs focus:border-slate-400 outline-none transition-all min-h-[80px]" />
                </>
              )}
            </section>
          )}

          {/* Section: Marketing & Styling Suggestions */}
          {state.showAIDashboard && state.analysis && state.analysis.marketing && (
            <section className="bg-emerald-500/5 p-6 rounded-[32px] border border-emerald-500/20 space-y-5 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-emerald-500" />
                <h2 className="font-bold uppercase tracking-[0.2em] text-[10px] text-emerald-500">Gợi ý Marketing & Phối đồ</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-emerald-400 font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Scissors size={12} /> Cách phối đồ
                  </p>
                  <ul className="space-y-2">
                    {state.analysis.marketing.stylingTips.map((tip, idx) => (
                      <li key={idx} className="text-[10px] text-white/70 leading-relaxed flex gap-2">
                        <span className="text-emerald-500 shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-purple-400 font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                    <MessageSquare size={12} /> Caption bán hàng
                  </p>
                  <div className="space-y-3">
                    {state.analysis.marketing.captions.map((cap, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] text-purple-400/60 font-bold uppercase">{cap.title}</p>
                          <button 
                            onClick={() => navigator.clipboard.writeText(cap.content)}
                            className="text-[8px] text-white/20 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[10px] text-white/60 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                          {cap.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-slate-200 font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                    <Sparkles size={12} /> Branding & Story
                  </p>
                  <div className="space-y-3">
                    {state.analysis.marketing.brandingCaptions.map((cap, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[8px] text-slate-200/60 font-bold uppercase">{cap.title}</p>
                          <button 
                            onClick={() => navigator.clipboard.writeText(cap.content)}
                            className="text-[8px] text-white/20 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[10px] text-white/60 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer italic">
                          "{cap.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default App;
