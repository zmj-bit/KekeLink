import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const handleAiCall = async <T>(call: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await call();
  } catch (error: any) {
    if (error.message?.includes("429") || error.status === 429) {
      console.warn("Gemini API Rate limit exceeded, using fallback data.");
      return fallback;
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const geminiService = {
  async classifyVoiceNote(base64Audio: string) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
          {
            text: "Classify this voice note incident report into one of: 'theft', 'harassment', 'accident', 'lost_item', or 'other'. Provide a brief summary in English.",
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["category", "summary"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { category: 'other', summary: 'Incident report received (AI processing unavailable)' });
  },

  async extractIdInfo(base64Image: string, idType: 'student' | 'nin') {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Extract information from this ${idType} ID card. For student ID, extract 'id_number' and 'expiry_date'. For NIN, extract 'nin_number' and 'full_name'.`,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id_number: { type: Type.STRING },
              expiry_date: { type: Type.STRING },
              full_name: { type: Type.STRING },
            },
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { id_number: 'PENDING', full_name: 'Verification in Progress' });
  },

  async chatWithAssistant(message: string, context: string) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: `You are KekeLink AI Assistant. You help passengers and drivers in Nigeria (Northern region). You speak Hausa and English. Context: ${context}`,
        },
      });
      return response.text;
    }, "Sannu! I'm having trouble connecting to my brain right now, but I'm still here to help with basic safety features.");
  },

  async detectTripAnomaly(tripData: any) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this trip data for anomalies (e.g., unexpected route deviation, long stops): ${JSON.stringify(tripData)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              is_anomaly: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              risk_level: { type: Type.STRING },
            },
            required: ["is_anomaly"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { is_anomaly: false, reason: "AI Monitoring Offline", risk_level: "low" });
  },

  async classifySafetyReport(content: string, isVoice: boolean = false) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: isVoice ? [
          { inlineData: { mimeType: "audio/wav", data: content } },
          { text: "Classify this voice report into: 'suspicious_activity', 'unsafe_area', 'hazard', or 'other'. Provide a risk level (low, medium, high) and a short English summary." }
        ] : `Classify this safety report: "${content}". Options: 'suspicious_activity', 'unsafe_area', 'hazard', 'other'. Provide risk level (low, medium, high) and a short summary.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              risk_level: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["category", "risk_level", "summary"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { category: 'other', risk_level: 'medium', summary: content });
  },

  async calculateDynamicPrice(origin: string, destination: string, timeOfDay: string, demandLevel: 'low' | 'medium' | 'high') {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Calculate a fair Keke price in Naira for a trip from ${origin} to ${destination} at ${timeOfDay} with ${demandLevel} demand in Northern Nigeria. Consider typical corridor rates.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              base_fare: { type: Type.NUMBER },
              demand_multiplier: { type: Type.NUMBER },
              total_fare: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ["base_fare", "total_fare", "explanation"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { base_fare: 400, total_fare: 500, explanation: "Standard rate applied (AI pricing offline)" });
  },

  async optimizeRoute(origin: string, destination: string) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 2 optimal Keke routes from ${origin} to ${destination} in a Northern Nigerian city (e.g. Kano). One for speed, one for safety/avoiding high-traffic corridors.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimated_time: { type: Type.STRING },
                    safety_rating: { type: Type.STRING },
                  },
                },
              },
            },
            required: ["routes"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    }, { routes: [{ name: "Direct Route", description: "Standard corridor route", estimated_time: "15 mins", safety_rating: "Good" }] });
  },

  async onboardingAssistant(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are the KekeLink WhatsApp Onboarding Assistant. 
          Your goal is to help users (passengers and drivers) in Northern Nigeria register for the platform.
          - Be polite, professional, and use local context (e.g., mention Kano, Zaria, Maiduguri, Sokoto).
          - Use a mix of English and Hausa phrases naturally (e.g., "Sannu", "Ina kwana", "Lafiya lau", "Na gode").
          - Guide them through: 1. Choosing a role (Passenger/Driver), 2. Providing basic info (Name, Phone), 3. Security verification (NIN, Face Match).
          - Answer FAQs about safety:
            * "One-Chance" prevention: Explain how KekeLink verifies every driver and tracks trips in real-time.
            * SOS feature: Mention the emergency button that alerts security and family.
          - Answer FAQs about union dues:
            * Explain that KekeLink works with local unions to ensure fair dues and better benefits for drivers.
          - Provide safety tips proactively (e.g., "Always check the Keke ID before entering").
          - Keep responses concise, friendly, and WhatsApp-friendly.`,
        },
      });
      return response.text;
    }, "Sannu! I'm currently experiencing high demand. Please try again in a moment or continue with your registration.");
  },

  async getRouteUpdate(origin: string, destination: string, progress: number) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The driver is ${progress}% through the trip from ${origin} to ${destination} in Kano. Provide a short, helpful real-time update (e.g., "Approaching Zoo Road, traffic is light", "Entering Sabon Gari, stay alert"). Use local context.`,
        config: {
          systemInstruction: "You are a real-time KekeLink route assistant. Keep updates under 15 words.",
        },
      });
      return response.text;
    }, "Proceeding smoothly through the city corridors.");
  },

  async getSafetyCoaching(driverStats: any) {
    return handleAiCall(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these driver stats: ${JSON.stringify(driverStats)}, provide 3 actionable safety coaching tips for a Keke driver in Northern Nigeria. Focus on route adherence, passenger safety, and vehicle maintenance.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              summary: { type: Type.STRING }
            },
            required: ["score", "tips", "summary"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    }, { 
      score: 85, 
      tips: ["Maintain consistent speed", "Follow designated Keke corridors", "Check tire pressure daily"], 
      summary: "Safety coaching is temporarily limited. Stay alert and follow standard protocols." 
    });
  }
};
