import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ModuleContent, DifficultyLevel, LearnerProfile, LearnerAnalysis } from "../types";
import { AI_CURRICULUM } from "../curriculum";
import { getCachedModule, setCachedModule, buildModuleCacheKey } from "./cacheService";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) throw new Error('VITE_GEMINI_API_KEY ontbreekt in .env');
const ai = new GoogleGenAI({ apiKey });


// ─── Shared JSON Schema ───────────────────────────────────────────────────────

const MODULE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    hero: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        introduction: { type: Type.STRING },
      },
      required: ["title", "introduction"]
    },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    learningContent: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectionTitle: { type: Type.STRING },
          text: { type: Type.STRING },
          visualType: {
            type: Type.STRING,
            enum: ['chart', 'infographic', 'image', 'video', 'tutorial']
          },
          visualData: {
            type: Type.OBJECT,
            properties: {
              videoUrl: { type: Type.STRING },
              chartData: { type: Type.ARRAY, items: { type: Type.OBJECT } }
            }
          }
        },
        required: ["sectionTitle", "text", "visualType"]
      }
    },
    assessment: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswerIndex", "explanation"]
      }
    },
    summary: { type: Type.STRING },
    badge: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        icon: { type: Type.STRING }
      },
      required: ["name", "icon"]
    }
  },
  required: ["title", "hero", "instructions", "learningContent", "assessment", "summary", "badge"]
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildModulePrompt(
  department: string,
  level: DifficultyLevel,
  moduleIndex: number,
  profile: LearnerProfile | null
): string {
  const step = AI_CURRICULUM[level][moduleIndex];

  const profileBlock = profile ? `
    CURSISTPROFIEL (gebruik dit voor maximale personalisatie):
    - Naam: ${profile.name}
    - Functie: ${profile.role}
    - Afdeling: ${profile.department}
    - AI-ervaring: ${profile.aiExperience}
    - Leerstijl: ${profile.learningStyle}
    - Tijd per sessie: ${profile.availableTime} minuten
    - Dagelijkse tools: ${profile.currentTools.join(', ')}
    - Voornaamste uitdaging: ${profile.mainChallenge}
    - Leerdoel: ${profile.learningGoal}
    ${profile.analysisResult ? `- Leertype: ${profile.analysisResult.learningPersona}
    - Aanpak: ${profile.analysisResult.customizedApproach}` : ''}

    PERSONALISATIE-EISEN:
    - Gebruik concrete voorbeelden uit het dagelijks werk van een ${profile.role}
    - Verwijs naar tools die de cursist al kent: ${profile.currentTools.slice(0, 3).join(', ')}
    - Stem diepgang af op ${profile.aiExperience} AI-ervaring
    - Houd inhoud verwerkbaar in ${profile.availableTime} minuten
  ` : `Focus op de afdeling ${department} in het algemeen.`;

  return `
    Genereer een inspirerende, praktijkgerichte e-learning module over AI voor "${department}" op niveau "${level}".

    ONDERWERP: "${step.title}"
    CONTEXT: ${step.description}

    ${profileBlock}

    KWALITEITSEISEN:
    - Geen saaie theorie. Maak het boeiend, herkenbaar en direct toepasbaar.
    - Gebruik een toegankelijke, professionele toon.
    - Elk leeronderdeel bevat een relevant visueel element (chart/infographic/image/video/tutorial).
    - Voor 'video': voeg een relevante videoUrl toe in visualData.
    - Voor 'chart'/'infographic': voeg concrete data toe in visualData.chartData.
    - Toetsvragen uitdagend maar eerlijk, met goede uitleg.
    - Alles in het Nederlands.
  `;
}

// ─── Module Generation ────────────────────────────────────────────────────────

export async function generateModule(
  department: string,
  departmentId: string,
  level: DifficultyLevel,
  moduleIndex: number,
  profile: LearnerProfile | null = null
): Promise<ModuleContent> {
  const profileId = profile?.id ?? 'anonymous';
  const cacheKey = buildModuleCacheKey(departmentId, level, moduleIndex, profileId);
  const cached = getCachedModule(cacheKey);
  if (cached) return cached;

  const prompt = buildModulePrompt(department, level, moduleIndex, profile);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-05-06",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: MODULE_RESPONSE_SCHEMA,
    }
  });

  const content = JSON.parse(response.text);
  const module: ModuleContent = {
    ...content,
    id: `mod-${departmentId}-${level}-${moduleIndex}`,
    department,
    level,
  };

  setCachedModule(cacheKey, module);
  return module;
}

// ─── Profile Analysis ─────────────────────────────────────────────────────────

export async function analyzeLearnerProfile(
  profile: Omit<LearnerProfile, 'id' | 'analysisResult' | 'createdAt'>
): Promise<LearnerAnalysis> {
  const prompt = `
    Analyseer dit medewerkersprofiel en genereer een gepersonaliseerd leerprofiel.

    Profiel:
    - Naam: ${profile.name}
    - Afdeling: ${profile.department}
    - Functie: ${profile.role}
    - AI-ervaring: ${profile.aiExperience}
    - Leerstijl: ${profile.learningStyle}
    - Tijd per sessie: ${profile.availableTime} minuten
    - Huidige tools: ${profile.currentTools.join(', ')}
    - Voornaamste uitdaging: ${profile.mainChallenge}
    - Leerdoel: ${profile.learningGoal}

    Geef een analyse die:
    1. Het aanbevolen startniveau bepaalt (beginner/gemiddeld/gevorderd)
    2. Een lerend persona benoemt (bijv. "De Strategische Denker", "De Praktische Doener", "De Digitale Pionier")
    3. De sterke punten van deze leerder beschrijft (3 punten)
    4. De focusgebieden voor groei benoemt (3 punten)
    5. Een gepersonaliseerde leerbenadering beschrijft (2-3 zinnen)
    6. Een schatting geeft van het leertraject (bijv. "8 weken, 2 modules per week")

    Schrijf in het Nederlands. Motiverend, concreet, zonder jargon.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedLevel: { type: Type.STRING, enum: ['beginner', 'gemiddeld', 'gevorderd'] },
          learningPersona: { type: Type.STRING },
          personaDescription: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
          customizedApproach: { type: Type.STRING },
          estimatedPath: { type: Type.STRING },
        },
        required: ['recommendedLevel', 'learningPersona', 'personaDescription', 'strengths', 'focusAreas', 'customizedApproach', 'estimatedPath']
      }
    }
  });

  return JSON.parse(response.text) as LearnerAnalysis;
}

// ─── Module Review ────────────────────────────────────────────────────────────

export async function reviewModule(module: ModuleContent): Promise<ModuleContent> {
  const prompt = `
    Beoordeel en corrigeer de volgende e-learning module op kwaliteit, inhoud en correctheid.
    Verbeter tekst waar nodig maar behoud de exacte structuur.

    Module data:
    ${JSON.stringify(module, null, 2)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-05-06",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: MODULE_RESPONSE_SCHEMA,
    }
  });

  const corrected = JSON.parse(response.text);
  return { ...corrected, id: module.id, department: module.department, level: module.level };
}
