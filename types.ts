
export type TextColorTheme = 'white' | 'black' | '#5C4033';

export interface TextStyle {
  fontFamily: string;
  weight: string;
  spacing: number;
  color: string;
  bg: boolean;
  bgColor: string;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
}

export interface CustomText {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  style: TextStyle;
}

export interface ImageAnalysis {
  styleDna: {
    mood: string;
    vibe: string;
    colors: string[];
    fashionType: string;
    modelOutfitStyle: string;
    accessories?: string[];
  };
  backgroundDna: {
    lighting: string;
    texture: string;
    colorPalette: string[];
    depthOfField: string;
    consistencyNote: string;
  };
  suggestedThemes: {
    name: string;
    prompt: string;
    description: string;
  }[];
  recommendations: {
    font: string;
    bannerColor: string;
    layout: string;
  };
  marketing?: {
    stylingTips: string[];
    captions: {
      title: string;
      content: string;
      hashtags: string[];
    }[];
    brandingCaptions: {
      title: string;
      content: string;
      hashtags: string[];
    }[];
  };
}

export interface SaleItem {
  id: string;
  productCode: string;
  image?: string;
  originalImage?: string; // Ảnh gốc trước khi dùng AI
  productImages?: string[]; // Multiple reference images for the product
  showContent?: boolean;
  selectedForVideo?: boolean;
  videoPrompt?: string;
}

export interface SaleConfig {
  brandName: string;
  logo: string | null;
  logoColor: 'black' | 'white';
  promotionText: string;
  promotionSubtitle: string; 
  bottomNote: string;       
  theme: 'luxury' | 'minimal' | 'gentle' | 'modern';
  aspectRatio: '3:4' | '1:1' | '9:16' | '4:3' | '16:9';
  
  logoX: number;
  logoY: number;
  logoScale: number;
  
  brandNameX: number;
  brandNameY: number;
  brandNameScale: number;
  
  headlineX: number;
  headlineY: number;
  headlineScale: number;
  
  promoTextX: number;
  promoTextY: number;
  promoTextScale: number;

  bottomNoteX: number;
  bottomNoteY: number;
  bottomNoteScale: number;
  
  codeX: number;
  codeY: number;
  codeScale: number;

  textColorTheme: TextColorTheme;
  customTexts: CustomText[];
  selectedModelId: string | null;
  referenceModelImage: string | null;
  autoSelectModel: boolean;
  enhanceImage: boolean;
  selectedAccessories: string[];
  customAccessories?: string;
  backgroundOnlyMode?: boolean;
  enableClothingTag?: boolean;
  clothingTagBrand?: string;
  clothingTagColor?: 'black' | 'white';
  styles: {
    logo: TextStyle;
    brandName: TextStyle;
    headline: TextStyle;
    promoText: TextStyle;
    bottomNote: TextStyle;
    code: TextStyle;
  };
}

export type GenerationMode = 'single' | 'six_separate' | 'collage';

export interface AppState {
  image: string | null;
  productImages: string[]; // Global product reference images
  analysis: ImageAnalysis | null;
  isAnalyzing: boolean;
  config: SaleConfig;
  items: SaleItem[];
  selectedItemId: string;
  showAIDashboard: boolean; // Trạng thái ẩn/hiện nội dung AI
  generationMode: GenerationMode;
  error: string | null;
}
