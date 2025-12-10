import { DISCLAIMER_TEXT_FALLBACKS, DISCLAIMER_LANGUAGES } from './disclaimerConstants';

export async function fetchDisclaimerFromRemoteConfig(lang: string, ai: any): Promise<string> {
  const english = DISCLAIMER_TEXT_FALLBACKS['en-US'];
  if (lang === 'en-US') return english;
  const targetLanguage = DISCLAIMER_LANGUAGES[lang]?.name || lang;

  try {
    const prompt = `Translate the following legal disclaimer into ${targetLanguage}. Keep the formatting, including line breaks and spacing. Do not add any introductory text like "Here is the translation:".\n\n${english}`;
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const text = res.text;
    if (!text) throw new Error('No text in Gemini response.');
    return text;
  } catch {
    return DISCLAIMER_TEXT_FALLBACKS[lang] || `Translation to ${targetLanguage} failed.`;
  }
}