
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysis } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' 
});

// Check if API key is missing
if (!(process.env.GEMINI_API_KEY || process.env.API_KEY)) {
  console.error("GEMINI_API_KEY is missing from environment variables.");
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  if (!(process.env.GEMINI_API_KEY || process.env.API_KEY)) {
    throw new Error("API Key (GEMINI_API_KEY) chưa được thiết lập. Vui lòng kiểm tra cấu hình hệ thống.");
  }
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${i + 1}):`, error);
      
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const suggestAccessories = async (backgroundPrompt: string, theme: string, analysis?: ImageAnalysis | null): Promise<string> => {
  try {
    const outfitContext = analysis ? `Outfit details: ${analysis.styleDna.modelOutfitStyle}. Fashion type: ${analysis.styleDna.fashionType}.` : '';

    const prompt = `You are a high-end fashion stylist. Based on the following photoshoot background, theme, and outfit details, suggest 2-3 stylish accessories that would perfectly complement the outfit and scene. 
CRITICAL: Pay close attention to the gender of the outfit. If it is men's clothing, ONLY suggest men's accessories (e.g., đồng hồ nam, kính râm nam, cặp da nam, giày da). If it is women's clothing, suggest women's accessories.

Background: "${backgroundPrompt}"
Theme: "${theme}"
${outfitContext}

Provide ONLY a comma-separated list of the accessories in Vietnamese, nothing else. Keep it short and descriptive.
Example for men: "đồng hồ cơ nam, kính râm phi công, cặp da nam"
Example for women: "kính râm thời trang, túi xách cói đi biển, mũ rộng vành"`;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "";
  } catch (error) {
    console.error("Failed to suggest accessories:", error);
    return "";
  }
};

export const analyzeFashionImage = async (base64Image: string, productImages: string[] = []): Promise<ImageAnalysis> => {
  const response = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1],
          },
        },
        ...(productImages || []).map(img => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: img.split(',')[1],
          },
        })),
        {
          text: `${productImages && productImages.length > 0 ? `[IMAGE 1 is the main photo. IMAGES 2 to ${productImages.length + 1} are additional views of the SAME product to help you analyze the form, material, and details more accurately]. ` : ""}Phân tích chuyên sâu ảnh thời trang này. 
1. Trích xuất ADN phong cách: đặc biệt tập trung vào kiểu dáng và chất liệu trang phục mẫu đang mặc (modelOutfitStyle). YÊU CẦU ĐẶC BIỆT QUAN TRỌNG: Quan sát thật kỹ bề mặt vải, độ bóng, độ rủ, nếp gấp, kết cấu và form dáng để nhận định CHÍNH XÁC TUYỆT ĐỐI chất liệu (ví dụ: cotton, linen/đũi, lụa, denim, da, polyester, len, nỉ, kaki, voan, tweed...). Không được đoán sai chất liệu.
2. Trích xuất ADN bối cảnh. 
3. Đề xuất 3 chủ đề bối cảnh (suggestedThemes) để tôn vinh bộ đồ này nhất. 
4. Đề xuất 3 cách phối đồ (stylingTips). 
5. Viết 3 mẫu caption bán hàng (captions). YÊU CẦU QUAN TRỌNG: Viết theo phong cách chuyên nghiệp, thanh lịch, tập trung vào công năng và chất liệu, có tiêu đề in hoa nổi bật, sử dụng gạch đầu dòng (▪️) cho các tính năng, và kêu gọi hành động rõ ràng. Ví dụ phong cách:
- "𝗘𝗦𝗦𝗘𝗡𝗧𝗜𝗔𝗟𝗦 | 𝗥𝗘𝗚𝗨𝗟𝗔𝗥 𝗦𝗧𝗥𝗜𝗣𝗘𝗗 𝗦𝗛𝗜𝗥𝗧\\nĐủ khác biệt với sơ mi trơn, mà vẫn giữ chuẩn mực cần thiết - Striped Shirt mới nhất từ La Clothing sẽ là 'điểm nhấn' tinh tế cho tủ đồ lịch thiệp của bạn.\\n▪️ Họa tiết sọc mảnh: Tạo hiệu ứng kéo dài giúp cơ thể thon gọn hơn.\\n▪️ Chất liệu Polyester & Lyocell: Thoáng mát, mềm rủ tự nhiên.\\n▪️ Form Classic suông vừa: Thoải mái, dễ mặc - dễ ứng dụng.\\nInbox ngay La Clothing để được tư vấn thêm về chiếc áo sơ mi này nhé!\\n#LaClothing #LaClothingDesign #SS26 #NewArrivals #AoSoMi"
- "𝐋𝐀 𝐂𝐋𝐎𝐓𝐇𝐈𝐍𝐆 𝐑𝐄𝐋𝐀𝐗 𝐒𝐇𝐎𝐑𝐓 | MẶC NHẸ TÊNH CHO NGÀY HÈ☀\\nLàm chủ sự tự tin và thoải mái tối đa mùa hè này bởi chiếc quần short Relax thoáng khí, giữ form dáng chuẩn nhưng vẫn mềm mại trên da.\\n▪ 3 màu sắc cơ bản cùng thiết kế kết hợp cạp chun co giãn linh hoạt, túi sâu tiện lợi và khả năng thoáng khí vượt trội, Relax Short mang đến vẻ ngoài trẻ trung, phóng khoáng cho anh em.\\n🛒Ghé La Clothing sắm ngay những items chuẩn bị cho mùa nắng nóng anh em nhé!\\n#LaClothing #ThoiTrangNam #Short"
6. Viết 3 mẫu caption xây dựng thương hiệu (brandingCaptions). YÊU CẦU: Viết cực kỳ sâu sắc, mang tính triết lý về lối sống (lifestyle), sự bình yên, thời trang chậm (slow fashion), hoặc giá trị cốt lõi của người đàn ông trưởng thành. Câu văn cần có chiều sâu, khơi gợi cảm xúc mạnh mẽ và sự đồng cảm, không mang tính chất bán hàng.
7. Liệt kê các phụ kiện đi kèm (túi xách, kính, mũ, trang sức, đồng hồ, giày dép...) có trong ảnh gốc (accessories). 
Phản hồi bằng tiếng Việt dưới dạng JSON.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          styleDna: {
            type: Type.OBJECT,
            properties: {
              mood: { type: Type.STRING },
              vibe: { type: Type.STRING },
              colors: { type: Type.ARRAY, items: { type: Type.STRING } },
              fashionType: { type: Type.STRING },
              modelOutfitStyle: { type: Type.STRING },
              accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["mood", "vibe", "colors", "fashionType", "modelOutfitStyle", "accessories"]
          },
          backgroundDna: {
            type: Type.OBJECT,
            properties: {
              lighting: { type: Type.STRING },
              texture: { type: Type.STRING },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              depthOfField: { type: Type.STRING },
              consistencyNote: { type: Type.STRING },
            },
            required: ["lighting", "texture", "colorPalette", "depthOfField", "consistencyNote"]
          },
          suggestedThemes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                prompt: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "prompt", "description"]
            }
          },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              font: { type: Type.STRING },
              bannerColor: { type: Type.STRING },
              layout: { type: Type.STRING },
            },
            required: ["font", "bannerColor", "layout"]
          },
          marketing: {
            type: Type.OBJECT,
            properties: {
              stylingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              captions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "content", "hashtags"]
                }
              },
              brandingCaptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "content", "hashtags"]
                }
              }
            },
            required: ["stylingTips", "captions", "brandingCaptions"]
          }
        },
        required: ["styleDna", "backgroundDna", "suggestedThemes", "recommendations", "marketing"],
      },
    },
  }));

  // response.text is a getter property.
  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text.trim());
};

export const redesignBackground = async (
  originalImage: string, 
  backgroundPrompt: string, 
  theme: string, 
  aspectRatio: string,
  analysis?: ImageAnalysis | null,
  generationMode: 'single' | 'six_separate' | 'collage' = 'single',
  modelDescription?: string | null,
  referenceModelImage?: string | null,
  enhanceImage?: boolean,
  selectedAccessories?: string[],
  backgroundOnlyMode?: boolean,
  clothingTagBrand?: string,
  clothingTagColor?: 'black' | 'white',
  customAccessories?: string,
  enableClothingTag?: boolean,
  productImages: string[] = []
): Promise<string[]> => {
  if (backgroundOnlyMode) {
    const prompt = `TASK: GENERATE BACKGROUND/TEXTURE ONLY. Create a high-end, professional background image. Description: ${backgroundPrompt}. Theme: ${theme}. CRITICAL: DO NOT include any people, models, mannequins, clothing, or text in the image. This must be a clean, empty background suitable for overlaying text or logos. 8k resolution, highly detailed, professional studio lighting.`;

    const contents: any = {
      parts: [
        { text: prompt }
      ]
    };

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          numberOfImages: 1
        } as any
      }
    }));

    const images: string[] = [];
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
    if (images.length > 0) return images;
    throw new Error("Generation failed");
  }

  const dnaContext = analysis ? 
    `CRITICAL FASHION DETAILS: The outfit's style and material are analyzed as: "${analysis.styleDna.modelOutfitStyle}". You MUST strictly preserve this exact fabric texture (e.g., cotton, linen, silk, denim, etc.), material feel, and original design. Focus on: ${analysis.backgroundDna.lighting} lighting.` : "";

  // Detect photography style from prompt
  const lowerPrompt = backgroundPrompt.toLowerCase();
  const isFlatLay = lowerPrompt.includes("trải sàn") || lowerPrompt.includes("flat lay") || lowerPrompt.includes("flatlay");
  const isHanging = lowerPrompt.includes("treo móc") || lowerPrompt.includes("móc treo") || lowerPrompt.includes("hanger") || lowerPrompt.includes("hanging");
  const isMannequin = lowerPrompt.includes("manocanh") || lowerPrompt.includes("mannequin") || lowerPrompt.includes("ma nơ canh");

  let taskInstruction = "";
  
  if (isFlatLay) {
    taskInstruction = `TASK: FLAT LAY PHOTOGRAPHY. 
      1. REMOVE the person/model from the image entirely.
      2. PLACE the outfit flat on a stylish surface (e.g., wooden floor, marble, textured rug) as described: ${backgroundPrompt}.
      3. Arrange the garment naturally and aesthetically.
      4. Maintain the exact fabric, color, and details of the original outfit.`;
  } else if (isHanging) {
    taskInstruction = `TASK: HANGING GARMENT PHOTOGRAPHY. 
      1. REMOVE the person/model from the image entirely.
      2. PLACE the outfit on a high-end hanger, hanging against a background: ${backgroundPrompt}.
      3. The garment should hang naturally, showing its silhouette.
      4. Maintain the exact fabric, color, and details of the original outfit.`;
  } else if (isMannequin) {
    taskInstruction = `TASK: MANNEQUIN DISPLAY. 
      1. REPLACE the person with a professional ghost mannequin or a stylish display mannequin.
      2. The mannequin should be positioned in a background: ${backgroundPrompt}.
      3. The outfit must fit the mannequin perfectly, showing its 3D form.
      4. Maintain the exact fabric, color, and details of the original outfit.`;
  } else {
    // Default: Virtual Model Replacement
    const defaultVNModel = "An authentic, real-life Vietnamese male, late 20s, natural skin texture, casual everyday look, highly photorealistic.";
    const activeModelDesc = modelDescription || defaultVNModel;

    taskInstruction = `TASK: VIRTUAL MODEL REPLACEMENT. 
       1. Analyze the original person's body pose and proportions.
       2. Replace the person with the Vietnamese male model described: ${activeModelDesc}.
       3. The face must have distinctly Vietnamese features and natural skin texture.
       4. The new model must wear the exact same clothes as the original person.`;

    if (referenceModelImage) {
      taskInstruction = `TASK: VIRTUAL MODEL REPLACEMENT. 
       1. Analyze the original person's body pose and proportions.
       2. Replace the person with the model shown in the provided reference image.
       3. The face, hair, and body type must match the reference model image.
       4. The new model must wear the exact same clothes as the original person.`;
    }
  }

  const basePrompt = aspectRatio === '16:9' 
    ? `TASK: AI OUTPAINTING & SCENE REDESIGN. ${taskInstruction} The generated garment must be an exact replica of the original reference image (match color, fabric texture, form, drape, cut). Expand the environment horizontally to 16:9 while matching the fashion style.`
    : `TASK: BACKGROUND REDESIGN & STYLE SWAP. ${taskInstruction} The generated garment must be an exact replica of the original reference image (match color, fabric texture, form, drape, cut). Re-envision the scene to be high-end while keeping the outfit unchanged.`;

  const enhanceInstruction = enhanceImage ? " The original image is blurry. Please enhance, sharpen, and restore the details of the original garment and subject to make it high-definition." : "";
  
  let accessoriesInstruction = selectedAccessories && selectedAccessories.length > 0
    ? ` The model must wear the following accessories exactly as they appear in the original image: ${selectedAccessories.join(', ')}.`
    : "";
  
  if (customAccessories) {
    accessoriesInstruction += ` Also add these specific accessories: ${customAccessories}. Make them look natural.`;
  }

  const naturalPoseInstruction = " The image should look like a highly realistic, unretouched photograph. Ensure natural skin tones and realistic hands. The posture should be candid and effortless, with natural facial expressions. Avoid stiff or generic fashion poses. The result must look like a real photo.";

  const minimalLifestyleInstruction = " The image should have sharp focus and soft lighting, matching a minimal lifestyle aesthetic. The clothing must maintain its original fit (loose, straight-leg, wide, etc.). Ensure the clothing features natural wrinkles and folds where appropriate (e.g., at joints or where fabric bunches). The fabric should drape naturally. Use a neutral color palette. The image must be high-definition.";

  const brandingInstruction = enableClothingTag && clothingTagBrand 
    ? ` The garment must have a realistic physical clothing tag or label attached to it. The tag must clearly spell out the text "${clothingTagBrand}" in ${clothingTagColor || 'white'} color. Do not print the text directly onto the main fabric.`
    : " Do not add any text, logos, watermarks, or tags to the clothing or background.";

  const images: string[] = [];
  
  // Determine how many calls to make
  const iterations = generationMode === 'six_separate' ? 6 : 1;
  
  // Keep track of the reference image to use. If user provided one, use it.
  // Otherwise, we will use the first generated image as the reference for the rest.
  let activeReferenceImage = referenceModelImage;
  
  for (let i = 0; i < iterations; i++) {
    let currentPrompt = `${basePrompt} ${dnaContext} New background style: ${backgroundPrompt}. Theme: ${theme}. Professional lighting, highly detailed. 8k resolution.${enhanceInstruction}${accessoriesInstruction}${naturalPoseInstruction}${minimalLifestyleInstruction}${brandingInstruction}`;
    
    if (generationMode === 'six_separate') {
      let viewInstruction = "";
      switch (i) {
        case 0:
          viewInstruction = "CAMERA ANGLE: STRAIGHT FRONT VIEW. Pose: Standing naturally, hands in pockets. Expression: Relaxed, looking at the camera. Candid lifestyle shot.";
          break;
        case 1:
          viewInstruction = "CAMERA ANGLE: 45-DEGREE LEFT PROFILE VIEW. Pose: Mid-step walking. Expression: Looking away from the camera, candid/paparazzi style.";
          break;
        case 2:
          viewInstruction = "CAMERA ANGLE: 45-DEGREE RIGHT PROFILE VIEW. Pose: Leaning against a wall or holding a cup of coffee. Expression: A subtle, natural smile.";
          break;
        case 3:
          viewInstruction = "CAMERA ANGLE: CLOSE-UP SHOT. Focus on the fabric texture and details. Pose: Looking down naturally. Crop out the lower body.";
          break;
        case 4:
          viewInstruction = "CAMERA ANGLE: FULL BACK VIEW. Pose: Walking away, looking back over the shoulder. Expression: Relaxed.";
          break;
        case 5:
          viewInstruction = "CAMERA ANGLE: STREET STYLE SHOT. Pose: Sitting or captured in a sudden, spontaneous action. Expression: Authentic and candid.";
          break;
      }
      currentPrompt += ` ${viewInstruction}`;
      
      const consistencyInstruction = i === 0 
        ? " SCENE CONSISTENCY: This is the master image. All subsequent images in this set should have the same background scenery, lighting, and surrounding objects."
        : " SCENE CONSISTENCY: The background scenery, lighting, and all surrounding objects should remain identical to the first image in this set. Maintain the same model identity and clothing.";
      currentPrompt += consistencyInstruction;
    } else if (generationMode === 'collage') {
      currentPrompt += " IMPORTANT: Create a 2x2 grid photo collage showing the SAME model in 4 DIFFERENT POSES within this single image. Keep the background, outfit, model identity, and lighting exactly the same across all 4 panels.";
    }

    const contents: any = {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: originalImage.includes(',') ? originalImage.split(',')[1] : originalImage,
          },
        },
        { text: currentPrompt }
      ]
    };

    // Add product reference images if available (limit to 2 to avoid 500 errors with too many images)
    if (productImages && productImages.length > 0) {
      const limitedProductImages = productImages.slice(0, 2);
      limitedProductImages.forEach((img, idx) => {
        if (img.includes(',')) {
          contents.parts.splice(idx + 1, 0, {
            inlineData: {
              mimeType: 'image/jpeg',
              data: img.split(',')[1],
            },
          });
        }
      });
      
      const refCount = limitedProductImages.length;
      contents.parts[contents.parts.length - 1].text = `[IMAGE 1 is the primary POSE/FORM reference. IMAGES 2 to ${refCount + 1} are additional PRODUCT views to ensure accuracy in color, material, and form]. ${currentPrompt}`;
    }

    if (activeReferenceImage && activeReferenceImage.includes(',')) {
      const insertIdx = (Math.min(productImages?.length || 0, 2)) + 1;
      contents.parts.splice(insertIdx, 0, {
        inlineData: {
          mimeType: 'image/jpeg',
          data: activeReferenceImage.split(',')[1],
        },
      });
      
      const identityIdx = insertIdx + 1;
      const productRefText = productImages && productImages.length > 0 
        ? `IMAGES 2 to ${Math.min(productImages.length, 2) + 1} are PRODUCT references.`
        : "";
        
      contents.parts[contents.parts.length - 1].text = `[IMAGE 1 is the POSE reference. ${productRefText} IMAGE ${identityIdx} is the FACE/IDENTITY reference]. ${currentPrompt} 
      
IDENTITY REFERENCE INSTRUCTIONS:
- Use the facial features and identity from the identity reference image.
- Apply the NEW requested camera angle and pose described above.`;
    }

    try {
      const response = await callWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            numberOfImages: 1
          } as any
        }
      }));

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImage = `data:image/png;base64,${part.inlineData.data}`;
          images.push(generatedImage);
          
          // Use the first generated image as a reference for the remaining iterations
          // to ensure the model's face and identity remain perfectly consistent.
          if (i === 0 && !referenceModelImage && generationMode === 'six_separate') {
            activeReferenceImage = generatedImage;
          }
        }
      }

      // Add delay between iterations to avoid rate limits
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`Failed at iteration ${i + 1}:`, error);
      if (images.length === 0) throw error; // Rethrow if we haven't even got one image
      break; // Stop and return what we have
    }
  }

  if (images.length > 0) {
    return images;
  }
  
  throw new Error("Generation failed");
};

export const reconstructErasedArea = async (
  imageWithHoleBase64: string
): Promise<string> => {
  const contents: any = {
    parts: [
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageWithHoleBase64.split(',')[1],
        },
      },
      { text: "Seamlessly fill the transparent hole in this image. Reconstruct the missing parts to match the surrounding context perfectly. Do not change anything else." }
    ]
  };

  const response = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: contents,
  }));

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to reconstruct image");
};

export const generateVideoPrompts = async (images: string[], analysis: ImageAnalysis | null): Promise<string[]> => {
  if (images.length === 0) return [];

  const parts: any[] = images.map((img, index) => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: img.split(',')[1],
    }
  }));

  const styleContext = analysis ? `The overall style is ${analysis.styleDna.modelOutfitStyle} with a ${analysis.styleDna.vibe} vibe.` : '';

  parts.push({
    text: `I have provided ${images.length} images in sequence. These images represent scenes for a short fashion video.
${styleContext}
Your task is to write a video generation prompt for EACH image. 
CRITICAL REQUIREMENTS:
1. The prompts MUST be continuous and seamless, telling a cohesive visual story from the first image to the last.
2. Each prompt should describe the camera movement (e.g., slow pan, zoom in, tracking shot), the model's subtle motion (e.g., turning head, walking, adjusting collar), and the lighting/atmosphere.
3. Keep each prompt concise (under 40 words) and focused on motion and cinematography.
4. Return the result as a JSON array of strings, where each string is the prompt for the corresponding image in the sequence.
Example output: ["A slow pan from left to right as the model turns her head towards the camera, soft cinematic lighting.", "The camera tracks backward as the model walks forward confidently, fabric flowing in the breeze."]
`
  });

  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      }
    }));

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to generate video prompts:", error);
    return images.map(() => "Cinematic fashion shot, slow motion, elegant movement.");
  }
};
