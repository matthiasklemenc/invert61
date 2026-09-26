import React, { useState } from 'react';

type Props = {
  feedback: string;
  onAnswer: (answer: string) => void;
  questionType?: 'GARAGE' | 'SPACE';
};

type Language = 'EN' | 'ES' | 'DE' | 'ZH';
type QuestionType = 'GARAGE' | 'SPACE';

const translations: Record<Language, Record<QuestionType, { title: string; question: React.ReactNode; correct: string; wrong: string; answers: string[]; header: string }>> = {
  EN: {
    GARAGE: { title: 'Garage Knowledge', question: <>What year does Marty McFly travel to in the first <span className="font-bold text-white">Back to the Future</span> movie?</>, correct: 'The correct answer gives you +1 Knowledge Point.', wrong: 'Nope. The tape rewinds... try again.', answers: ['1995', '1955', '2011'], header: 'GARAGE // ARCHIVE 01' },
    SPACE: { title: 'Space Knowledge', question: <>What does <span className="font-bold text-white">SOS</span> officially stand for?</>, correct: 'The correct answer gives you +1 Knowledge Point.', wrong: 'Not quite. The signal keeps transmitting... try again.', answers: ['Save Our Souls', 'Save Our Ship', 'Nothing — it has no official meaning'], header: 'SPACE // SIGNAL 01' },
  },
  ES: {
    GARAGE: { title: 'Conocimiento del Garaje', question: <>¿A qué año viaja Marty McFly en la primera película de <span className="font-bold text-white">Volver al Futuro</span>?</>, correct: 'La respuesta correcta te da +1 punto de conocimiento.', wrong: 'No. La cinta se rebobina... inténtalo de nuevo.', answers: ['1995', '1955', '2011'], header: 'GARAGE // ARCHIVE 01' },
    SPACE: { title: 'Conocimiento Espacial', question: <>¿Qué significa oficialmente <span className="font-bold text-white">SOS</span>?</>, correct: 'La respuesta correcta te da +1 punto de conocimiento.', wrong: 'No exactamente. La señal continúa transmitiendo... inténtalo de nuevo.', answers: ['Save Our Souls', 'Save Our Ship', 'Nada — no tiene un significado oficial'], header: 'SPACE // SIGNAL 01' },
  },
  DE: {
    GARAGE: { title: 'Garage-Wissen', question: <>In was für ein Jahr reist Marty McFly im ersten Teil von <span className="font-bold text-white">Zurück in die Zukunft</span>?</>, correct: 'Die richtige Antwort gibt dir +1 Wissenspunkt.', wrong: 'Nein. Das Band wird zurückgespult... versuch es noch einmal.', answers: ['1995', '1955', '2011'], header: 'GARAGE // ARCHIVE 01' },
    SPACE: { title: 'Space-Wissen', question: <>Wofür steht <span className="font-bold text-white">SOS</span> offiziell?</>, correct: 'Die richtige Antwort gibt dir +1 Wissenspunkt.', wrong: 'Nicht ganz. Das Signal sendet weiter... versuch es noch einmal.', answers: ['Save Our Souls', 'Save Our Ship', 'Für nichts — es hat keine offizielle Bedeutung'], header: 'SPACE // SIGNAL 01' },
  },
  ZH: {
    GARAGE: { title: '车库知识', question: <>在第一部<span className="font-bold text-white">《回到未来》</span>中，马蒂·麦弗莱穿越到了哪一年？</>, correct: '回答正确可获得 +1 知识点。', wrong: '不对。磁带倒带了……再试一次。', answers: ['1995', '1955', '2011'], header: 'GARAGE // ARCHIVE 01' },
    SPACE: { title: '太空知识', question: <><span className="font-bold text-white">SOS</span> 官方代表什么？</>, correct: '回答正确可获得 +1 知识点。', wrong: '还不对。信号仍在发送……再试一次。', answers: ['Save Our Souls', 'Save Our Ship', '没有任何官方含义'], header: 'SPACE // SIGNAL 01' },
  },
};

const languages: Language[] = ['EN', 'ES', 'DE', 'ZH'];

const languageLabels: Record<Language, string> = {
  EN: 'EN',
  ES: 'ES',
  DE: 'DE',
  ZH: '中文',
};

export default function SecretQuestionModal({ feedback, onAnswer, questionType = 'GARAGE' }: Props) {
  const [language, setLanguage] = useState<Language>('EN');
  const t = translations[language][questionType];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-gray-950 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-black tracking-[0.3em] text-cyan-300">{t.header}</div>
          <div className="flex gap-1">
            {languages.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-md border px-2 py-1 text-[10px] font-black transition ${language === lang ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-white'}`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase">{t.title}</h2>
        <p className="mt-4 text-lg text-gray-200">{t.question}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {t.answers.map(answer => (
            <button
              key={answer}
              type="button"
              className="rounded-xl border border-gray-600 bg-gray-900 px-3 py-3 font-black transition hover:border-cyan-300 hover:bg-gray-800"
              onClick={() => onAnswer(questionType === 'SPACE' ? (answer === 'Nothing — it has no official meaning' || answer === 'Nada — no tiene un significado oficial' || answer === '没有任何官方含义' ? 'SOS_NONE' : answer) : answer)}
            >
              {answer}
            </button>
          ))}
        </div>

        {feedback && <div className="mt-4 text-center font-bold text-red-400">{t.wrong}</div>}
        <div className="mt-5 text-center text-xs uppercase tracking-widest text-gray-500">{t.correct}</div>
      </div>
    </div>
  );
}
