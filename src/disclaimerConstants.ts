export type DisclaimerLanguage = { name: string; };

export const DISCLAIMER_LANGUAGES: Record<string, DisclaimerLanguage> = {
  'en-US': { name: 'USA English' },
  'en-GB': { name: 'UK English' },
  'es-ES': { name: 'Spanish' },
  'es-MX': { name: 'Mexican' },
  'de-DE': { name: 'German' },
  'de-AT': { name: 'Tyrolean German' },
};

export const DISCLAIMER_TEXT_FALLBACKS: Record<string, string> = {
  'en-US': `🛡️ Liability & Disclaimer

1. General Information
This application (“the App”) is currently provided free of charge. The developer reserves the right to introduce advertising, optional paid features, or other forms of monetization in the future. All music available in this App is sourced from Jamendo through its official API, under the terms and licenses defined by Jamendo and the respective artists.

2. Source of Content
All audio tracks, album artwork, and metadata are streamed directly from Jamendo’s servers. The App’s developer does not host, upload, or distribute any music files. All playback and (where permitted) downloads are handled exclusively through Jamendo’s infrastructure.

3. Copyright and Licensing
Each track available through the App is subject to its own license, typically a Creative Commons license as defined on Jamendo. Users are solely responsible for ensuring their use of any music complies with the applicable license terms, including any restrictions on commercial use, modification, or redistribution. Any commercial use of the music may require a separate license from Jamendo or the copyright holder.

4. No Responsibility for Misuse
The App’s developer assumes no responsibility or liability for how users use or misuse the App or the music provided through it. Users who download or distribute tracks in ways that violate licensing or copyright law do so entirely at their own risk. The developer cannot be held accountable for any damages, losses, or legal consequences resulting from such misuse.

5. No Warranties
The App is provided “as is” and “as available.” The developer makes no representations or warranties of any kind, express or implied, regarding its operation, reliability, or suitability for any purpose. There is no guarantee that the App or the Jamendo API will function without errors, interruptions, or technical issues.

6. Limitation of Liability
In no event shall the developer be liable for any direct, indirect, incidental, consequential, or special damages arising from or related to the use of this App. This includes, but is not to, loss of data, device malfunction, or loss of profits.

7. Third-Party Services
The App relies on external services such as the Jamendo API and may include other third-party services in the future (e.g., for ads or analytics). The developer has no control over these services and disclaims all responsibility for their operation, content, or availability.

8. Acceptance of Terms
By downloading or using this App, users agree to this Disclaimer and Liability Policy. If you do not agree, please uninstall and discontinue use of the App immediately.

9. Updates to This Disclaimer
This Disclaimer may be updated or changed at any time. The most current version will always be available within the App or through the developer’s official website. Continued use of the App after any changes are posted constitutes acceptance of the revised terms.

10. Contact
For any questions, feedback, or legal inquiries, please contact the developer through the information listed on the Google Play Store page.`,
  'en-GB': 'Translation for UK English is not yet available.',
  'es-ES': 'La traducción para el español no está disponible todavía.',
  'es-MX': 'La traducción para el español mexicano no está disponible todavía.',
  'de-DE': 'Die Übersetzung für Deutsch ist noch nicht verfügbar.',
  'de-AT': 'Die Übersetzung für Tiroler Deutsch ist noch nicht verfügbar.',
};