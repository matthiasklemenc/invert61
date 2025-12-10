// C:\Users\user\Desktop\invert\DisclaimerPage.tsx

import React from 'react';
import { DISCLAIMER_LANGUAGES } from './disclaimerConstants';

type DisclaimerLanguage = { name: string };

// Tiroler (AT) Sonder-Disclaimer
const TIROLER_DISCLAIMER = `INVERT FM – Ahnong und Verantwortung

1. Allgemeines
De App isch aktuell no gratis. Da künnt sich oba ändern – i könntat also in Zukunft Werbung oda kostenpflichtige Zusatzfunktionen einbaun. De Musi, wo du in da App host, kimmt direkt von Jamendo über deren offizielle Schnittstelle. Alles läuft also nach de Regeln von Jamendo und de Künstler.

2. Woher de Inhalt kimmt
De Musi, de Cover-Bilder und de Infos zu de Songs werdn direkt von Jamendo ihre Server gstreamt. I host koane Musifiles und loss a koane hochlodn. Alles, wos zum Obspüln (und eventuell zum Downloadn) gibt, läuft über Jamendo.

3. Urheberrecht und Lizenzen
Jeder Song hot seine oagne Lizenz, meist Creative Commons (CC) – genau wos erlaubt isch und wos ned, steht auf Jamendo. Du bist selber dafür verantwortlich, dass du di Musi im Rahma von de Lizenzen nutzt. Wennst wos kommerziell verwenen willst, brauchst eventuell a extra Erlaubnis von Jamendo oda vom Künstler.

4. Keine Verantwortung für Missbrauch
I übernehm koane Verantwortung dafür, wost mit da App oda da Musi ostellst. Wennd Songs herunterlodnst oda verbreitest, wost ned derfast, dann isch des dei oagnes Risiko. I koa dafür ned zur Verantwortung gezogen werdn, wens deswegen Probleme gibt.

5. Alles ohne Gewähr
De App wird so zur Verfügung gestellt, wia sie isch. I koa koane Garantie gebn, dass sie immer fehlerfrei und ohne Unterbrechungen läuft. A für de Zuverlässigkeit von Jamendo koa i koane Versprechungen machn.

6. Haftung
I hafte auf koan Foi für irgendwelche Schäden, die durch de Nutzung von da App entstehn könntn – sei es direkte, indirekte, oafache oda folgeschwere. Dazua ghean zum Beispiel Datavaleurust, Geräteschäden oda finanzielle Verluste.

7. Externe Dienste
De App nutzt Dienste von Dritten, wia zum Beispiel de Jamendo-API. In Zukunft könntn a no andare Dienste dazukommen (z. B. für Werbung oda Analysen). I hob oba koa Einfluss auf de Dienste und bin a ned für deren Inhalt oda Verfügbarkeit verantwortlich.

8. Akzeptanz von de Regeln
Wennst de App nutzt, akzeptierst du damit di Regeln von dem Disclaimer. Bist du ned einverstanden, dann deinstallier de App bitte umgehend.

9. Änderungen
I koa jederzeit wos an dem Disclaimer ändern. De aktuellste Version findest du immer in da App oda auf meiner Website. Wennst de App weiter nutzt, nachdem wos geändert worden isch, güts des ois Zustimmung.

10. Kontakt
Bei Frogn, Feedback oda rechtlichen Onliegen kannst mi gerne kontaktieren – d'Kontaktdaten findest uf meiner Google Play Store-Seite.

Hinweis zu Creative Commons Lizenzen

INVERT FM nutzt Musi von Jamendo, die unter verschiedene Creative Commons Lizenzen steht. Weil de App gratis isch und selber koan Profit macht, derfn a Liedln mit "Non-Commercial" (NC) Lizenz von olle Nutzer für private Zwecke verwendet werdn.

• CC-BY – erlaubt, a für kommerzielle Zwecke
• CC-BY-SA – erlaubt, a für kommerzielle Zwecke
• CC-BY-NC / CC-BY-NC-SA – erlaubt, weil INVERT FM ned kommerziell isch
• ND-Lizenzn ("No-Derivatives", oiso koa Verändern) – de Songs werdn automatisch ausgschlossen

Olle Musi wird direkt von Jamendo gstreamt. INVERT FM hostet koane Audiodateien und verteilt a koane veränderten Songs.`;

// Mexikanischer (es-MX) Disclaimer
const MEXICAN_DISCLAIMER = `AVISO LEGAL Y DESCARGO DE RESPONSABILIDAD DE INVERT FM
(Para que no andes chillando después)

1. Información General
Esta aplicación por ahorita es más gratis que el aire, pero no me hagas brujería porque me reservo el derecho de meterle después publicidad o cobrar por funcionalidades especiales. Toda la música sale directo del Jamendo, como Dios manda, bajo sus términos y condiciones.

2. Fuente del Contenido
Las rolas, las portadas y toda la info vienen directo de los servidores de Jamendo. Yo no ando de pirata almacenando archivos, nomás paso la voz. La reproducción y descargas (cuando se puede) se hacen através de su sistema.

3. Derechos de Autor y Licencias
Cada canción trae su propia licencia, generalmente Creative Commons. Tú eres 100% responsable de cómo usas la música. Si la usas para negocio sin permiso, te puede caer la voladora. Para eso necesitas arreglarte directo con Jamendo o el artista.

4. No me hago responsable del mal uso
Si te pasas de listo y usas la app o la música para cosas chuecas, ahí te vidrios. Yo me lavo las manos como Poncio Pilatos. Cualquier pedo legal, desmadre o problema es tu bronca, no la mía.

5. Sin Garantías
La app te la doy "tal cual", así nomás, como vino al mundo. No te prometo que funcione siempre perfecto, ni que Jamendo no se vaya a tronar en el peor momento. Ni modo, así es la vida.

6. Limitación de Responsabilidad
Por ningún pinche motivo me hago responsable de daños directos, indirectos, casuales o de aquellos que hasta San Pedro desconozca. Esto incluye pérdida de datos, que se te fria el celular o que dejes de ganar lana por usar la app.

7. Servicios de Terceros
La app depende de servicios externos como la API de Jamendo. Y pues yo no mando ahí, no soy su papá. Si fallan, ni modo. En el futuro podrían meterse otros servicios (como anuncios) y de esos tampoco me hago responsable.

8. Aceptación de los Términos
Al descargar o usar esta app, aceptas este descargo de responsabilidad. Si no estás de acuerdo, ándale, ya vete. Desinstálala inmediatamente, no te hagas.

9. Actualizaciones de este Aviso
Este aviso puede cambiar cuando se me hinche un huevo. La versión más reciente siempre estará en la app o en mi sitio web. Si sigues usando la app después de los cambios, significa que le entras al quite.

10. Contacto
Para preguntas, quejas o si te sientes muy abogado: búscame en la información de contacto de la página de Google Play Store.

Aviso sobre Licencias Creative Commons

INVERT FM usa música de Jamendo bajo varias licencias Creative Commons. Como esta app es gratis y no genera varo, hasta las rolas con licencia "No Comercial" (NC) las pueden usar todos para sus proyectos personales.

• CC-BY - sí se puede, hasta pa'l negocio
• CC-BY-SA - sí se puede, también con fines comerciales
• CC-BY-NC / CC-BY-NC-SA - sí se puede, porque INVERT FM no es negocio
• Las rolas ND (No Derivadas) - esas ni aparecen, se las brincamos

Toda la música se stremea directo de Jamendo. INVERT FM no almacena archivos de audio ni reparte rolas modificadas. Aquí todo es legal, sin maquilar.`;

// Britischer (en-GB) Disclaimer
const BRITISH_DISCLAIMER = `INVERT FM – Terms & Conditions
(Or, as we like to call it, "The Small Print You'll Ignore But We Have to Provide")

1. General Information
The Application is currently provided free of charge, rather like the NHS or a disappointing weather forecast. However, we reserve the right to introduce advertisements, optional paid features, or other monetisation schemes in the future, should the need for a new kettle arise. All music is sourced from Jamendo via its official API, under their terms, not ours. We're just the middlemen.

2. Source of Content
All audio tracks, album artwork, and metadata are streamed directly from Jamendo's servers. To be perfectly clear, the developer does not host, upload, or distribute any music files. We're merely the butler who fetches the tunes; we don't live in the library.

3. Copyright and Licensing
Each track comes with its own licence, typically a Creative Commons affair. You are solely responsible for ensuring your use of the music doesn't land you in hot water. If you use a track for commercial purposes in violation of its licence, you can expect a sternly worded letter, at the very least. Any commercial use will likely require a separate licence from Jamendo or the artist. Don't be a bounder.

4. No Responsibility for Misuse
The developer assumes no responsibility for how you use or misuse the App or its music. If you choose to download and distribute tracks in a manner that violates copyright law, that's your own lookout. We shan't be held accountable for any ensuing kerfuffle, disaster, or legal pantomime.

5. No Warranties
The App is provided "as is" and "as available." We make no representations or warranties of any kind, express or implied. It might work perfectly. It might not. The Jamendo API could have a wobble. There are no guarantees here, only the quiet, desperate hope that technology will behave for once.

6. Limitation of Liability
In no event shall the developer be liable for any direct, indirect, incidental, or consequential damages. This includes, but is not limited to, loss of data, your device giving up the ghost, or you missing out on profits. Frankly, if you're relying on this app for your profits, your business plan is probably a bit dodgy to begin with.

7. Third-Party Services
The App relies on external services like the Jamendo API and may use others in future (for ads or analytics). We have no control over these third parties and disclaim all responsibility for their operation. If they go down, it's not our gaff that's on fire.

8. Acceptance of Terms
By downloading or using this App, you agree to this Disclaimer. If you do not agree, for heaven's sake, please uninstall it immediately. We won't be offended. Much.

9. Updates to This Disclaimer
This Disclaimer may be updated whenever we fancy a change. The latest version will be in the App or on our website. If you continue to use the App after we've changed the terms, we'll take that as you saying "Carry on."

10. Contact
For any questions, feedback, or legal threats written on heavily perfumed parchment, please contact the developer via the information on the Google Play Store page. We'll get back to you eventually, assuming the Royal Mail is having a good day.

Creative Commons Licensing Notice
INVERT FM uses music from Jamendo under various Creative Commons licenses. Because this app is free and makes no money (a truly British labour of love), even tracks with a "Non-Commercial" (NC) licence may be used by all users for personal, private projects.

CC-BY — Allowed, including commercial use. Crack on.

CC-BY-SA — Allowed, including commercial use. Jolly good.

CC-BY-NC / CC-BY-NC-SA — Allowed, because INVERT FM is as non-commercial as a village fête.

ND-tracks (No-Derivatives) — These are automatically excluded. We don't do remixes here.

All music is streamed directly from Jamendo. INVERT FM does not host audio files and does not distribute modified tracks. It's all rather straightforward, really.`;

const DisclaimerPage: React.FC<{
  text: string;
  isLoading: boolean;
  onClose: () => void;
  currentLang: string;
  onSetLang: (lang: string) => void;
}> = ({ text, isLoading, onClose, currentLang, onSetLang }) => {
  const languages: Record<string, DisclaimerLanguage> = DISCLAIMER_LANGUAGES;

  const renderRemoteContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white" />
        </div>
      );
    if (!text) return null;

    const blocks = text.split('\n\n');

    return (
      <>
        <h1 className="text-3xl font-bold text-center mb-8">{blocks[0]}</h1>
        {blocks.slice(1).map((block, index) => {
          const [title, ...contentLines] = block.split('\n');
          const content = contentLines.join('\n');
          return (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                {content}
              </p>
            </div>
          );
        })}
      </>
    );
  };

  const lowerLang = currentLang.toLowerCase();
  const isTiroler = lowerLang === 'de-at';
  const isMexican = lowerLang === 'es-mx';
  const isBritish = lowerLang === 'en-gb';
  const showFixed = isTiroler || isMexican || isBritish;

  const getLangLabel = (code: string, name: string) => {
    if (code === 'en-GB') return 'EN'; // Button-Label für Britisch
    const parts = code.split('-');
    return parts[1] || name;
  };

  const renderFixedDisclaimer = () => {
    if (isTiroler) return TIROLER_DISCLAIMER;
    if (isMexican) return MEXICAN_DISCLAIMER;
    if (isBritish) return BRITISH_DISCLAIMER;
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <header className="flex items-center mb-8 relative">
        <button
          onClick={onClose}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      <main className="w-full max-w-4xl mx-auto pt-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          {/* Sprachwahl */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 border-b border-gray-700 pb-4">
            {Object.keys(languages).map((code) => {
              const lang = languages[code];
              return (
                <button
                  key={code}
                  onClick={() => onSetLang(code)}
                  className={`flex items-center justify-center font-semibold px-3 py-1 rounded-md text-sm transition-colors ${
                    currentLang === code
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-label={`Switch to ${lang.name}`}
                >
                  {getLangLabel(code, lang.name)}
                </button>
              );
            })}
          </div>

          {/* Fix hinterlegte Disclaimer (Tirol, MX, GB) */}
          {showFixed ? (
            <div className="whitespace-pre-line text-gray-300 leading-relaxed">
              {renderFixedDisclaimer()}
            </div>
          ) : (
            <>
              {/* Remote-Disclaimer + CC-Block für alle anderen Sprachen */}
              {renderRemoteContent()}

              <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <h2 className="text-xl font-semibold mb-2">Creative Commons Licensing Notice</h2>
                <p className="text-gray-300 leading-relaxed">
                  INVERT FM uses music provided by Jamendo under various Creative Commons
                  licenses. Because this app is free and contains no monetization,
                  Non-Commercial (NC) licensed tracks may legally be used by all users for
                  personal and private projects.
                  <br />
                  <br />
                  • CC-BY — allowed, including commercial use
                  <br />
                  • CC-BY-SA — allowed, including commercial use
                  <br />
                  • CC-BY-NC / CC-BY-NC-SA — allowed because INVERT FM is non-commercial
                  <br />
                  • ND-tracks (No-Derivatives) are automatically excluded
                  <br />
                  <br />
                  All music is streamed directly from Jamendo. INVERT FM does not host audio
                  files and does not distribute modified tracks.
                </p>
              </div>
            </>
          )}

          <p className="text-xs text-gray-500 mt-6 text-center">
            Disclaimer content may be updated without notice.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DisclaimerPage;
