/**
 * AI Service - Handles all AI API calls (VLM and LLM)
 * 
 * This service abstracts all AI interactions and can be configured
 * to use different providers (OpenAI, Anthropic, Google, etc.)
 */

export class AIService {
  constructor() {
    this.apiEndpoint = null;
    this.apiKey = null;
    this.provider = 'openai'; // Default provider
    this.loadConfig();
  }

  async loadConfig() {
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'aiProvider']);
    this.apiEndpoint = config.apiEndpoint;
    this.apiKey = config.apiKey;
    this.provider = config.aiProvider || 'openai';
  }

  /**
   * Analyze video frame with VLM to identify objects/tools
   * @param {string} frameDataUrl - Base64 encoded image
   * @param {string} prompt - Analysis prompt
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFrame(frameDataUrl, prompt = 'Identify all tools and objects in this video frame.') {
    console.debug('[AIService] analyzeFrame called', { prompt, hasFrame: !!frameDataUrl });
    
    if (!frameDataUrl) {
      throw new Error('No frame data provided');
    }

    // Call Gemini VLM API
    return await this.callVLM(frameDataUrl, prompt);
  }

  /**
   * Simplify complex vocabulary using LLM
   * @param {string} text - Text to simplify
   * @param {string} difficultyLevel - Target difficulty level
   * @returns {Promise<Object>} Simplified text and definitions
   */
  async simplifyVocabulary(text, difficultyLevel = 'elementary') {
    console.debug('[AIService] simplifyVocabulary called', { length: (text||'').length, difficultyLevel });
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for simplification');
    }

    const prompt = `Simplify the following text for a ${difficultyLevel} reading level. 
Provide ONLY a valid JSON object with this exact shape (no markdown, no extra text):
{
  "simplified": "the simplified text here",
  "definitions": [
    {"term": "complex_word", "definition": "simple explanation"}
  ]
}

Text to simplify: "${text}"`;

    // Call Gemini LLM API
    const result = await this.callLLM(prompt);
    console.debug('[AIService] simplifyVocabulary result:', result);
    return result;
  }

  /**
   * Generate step-by-step checklist from video content
   * @param {string} transcript - Video transcript
   * @param {Array} keyFrames - Array of key frame data
   * @returns {Promise<Array>} List of steps
   */
  async generateChecklist(transcript, keyFrames = []) {
    console.debug('[AIService] generateChecklist called', { transcriptLength: (transcript||'').length, keyFramesCount: (keyFrames||[]).length });
    
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No transcript provided for checklist generation');
    }

    const prompt = `Analyze this video transcript and create a step-by-step checklist.
Provide ONLY a valid JSON array with this exact shape (no markdown, no extra text):
[
  {
    "id": 1,
    "text": "Clear and actionable step",
    "timestamp": 0,
    "completed": false
  }
]

Each step should be:
- Clear and actionable
- Using simple, concrete language
- Sequential and logical

Transcript: "${transcript.substring(0, 2000)}"`;

    // Call Gemini LLM API
    const result = await this.callLLM(prompt);
    console.debug('[AIService] generateChecklist result:', result);
    return result;
  }

  /**
   * Detect potential confusion points in video
   * @param {Object} userBehavior - User interaction data
   * @returns {Promise<Object>} Confusion analysis
   */
  async detectConfusion(userBehavior) {
    console.debug('[AIService] detectConfusion called', { userBehavior });
    
    const { rewindCount, pauseCount, currentTimestamp, watchedSegments } = userBehavior;
    
    // Simple heuristic detection
    const confusionScore = (rewindCount * 2) + pauseCount;
    
    return {
      isConfused: confusionScore >= 3,
      confusionScore,
      recommendation: confusionScore >= 3 
        ? 'User may be struggling. Offer simplification or step breakdown.'
        : 'User appears to be following along well.',
      suggestedIntervention: confusionScore >= 3 
        ? ['vocabulary_simplification', 'step_breakdown', 'pause_assistance']
        : null
    };
  }

  /**
   * Make API call to LLM provider (Gemini)
   * @private
   */
  async callLLM(prompt, options = {}) {
    console.debug('[AIService] callLLM called with prompt length:', (prompt||'').length);
    
    // Get Gemini API key from storage
    const config = await chrome.storage.sync.get(['geminiApiKey']);
    const geminiKey = config.geminiApiKey;

    if (!geminiKey || geminiKey === '<YOUR_GEMINI_API_KEY_HERE>') {
      throw new Error('Gemini API key not configured. Please set it in the extension popup.');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

      const body = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      let resultText = null;
      try {
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e) {
        resultText = null;
      }

      if (!resultText) {
        const errMsg = `Gemini LLM error: ${JSON.stringify(data)}`;
        console.warn('[AIService] LLM response missing expected fields', data);
        throw new Error(errMsg);
      }

      console.debug('[AIService] callLLM response received, parsing...');

      // Try to parse as JSON if the response contains JSON
      let parsed = null;
      try {
        // First try direct parse
        parsed = JSON.parse(resultText);
      } catch (e) {
        // Try to extract JSON from the response
        const jsonMatch = resultText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            // If still can't parse, return the text as simplified
            parsed = {
              simplified: resultText,
              definitions: []
            };
          }
        } else {
          // No JSON found, return text as simplified
          parsed = {
            simplified: resultText,
            definitions: []
          };
        }
      }

      console.debug('[AIService] callLLM parsed result:', parsed);
      return parsed;
    } catch (error) {
      console.error('[AIService] callLLM error:', error);
      throw error;
    }
  }

  /**
   * Make API call to VLM provider (Gemini)
   * @private
   */
  async callVLM(frameDataUrl, prompt, options = {}) {
    console.debug('[AIService] callVLM called with prompt length:', (prompt||'').length);
    
    // Get Gemini API key from storage
    const config = await chrome.storage.sync.get(['geminiApiKey']);
    const geminiKey = config.geminiApiKey;

    if (!geminiKey || geminiKey === '<YOUR_GEMINI_API_KEY_HERE>') {
      throw new Error('Gemini API key not configured. Please set it in the extension popup.');
    }

    try {
      // Extract base64 and mime type from data URL
      let mimeType = null;
      let rawBase64Data = null;

      const base64Match = frameDataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (base64Match) {
        mimeType = base64Match[1];
        rawBase64Data = base64Match[2];
      } else {
        // Try non-base64 data URI
        const nonBaseMatch = frameDataUrl.match(/^data:([^,]+),(.+)$/);
        if (!nonBaseMatch) throw new Error('Invalid image data URI');
        mimeType = nonBaseMatch[1];
        let inline = nonBaseMatch[2];
        try {
          inline = decodeURIComponent(inline);
        } catch (e) {
          // ignore, keep raw
        }
        try {
          rawBase64Data = btoa(unescape(encodeURIComponent(inline)));
        } catch (e) {
          rawBase64Data = btoa(inline);
        }
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

      const body = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: rawBase64Data
                }
              }
            ]
          }
        ]
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      let resultText = null;
      try {
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (e) {
        resultText = null;
      }

      if (!resultText) {
        const errMsg = `Gemini VLM error: ${JSON.stringify(data)}`;
        console.warn('[AIService] VLM response missing expected fields', data);
        throw new Error(errMsg);
      }

      console.debug('[AIService] callVLM response received, parsing...');

      // Try to parse as JSON
      let parsed = null;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        // Try to extract JSON from the response
        const start = resultText.indexOf('{');
        const end = resultText.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          try {
            parsed = JSON.parse(resultText.substring(start, end + 1));
          } catch (e2) {
            parsed = { objects: [] };
          }
        } else {
          parsed = { objects: [] };
        }
      }

      console.debug('[AIService] callVLM parsed result:', parsed);
      return parsed;
    } catch (error) {
      console.error('[AIService] callVLM error:', error);
      throw error;
    }
  }
}
