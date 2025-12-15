import React, { useEffect, useRef, useState } from 'react';
import type { ActiveTemplate, CustomTemplate, PredefinedTemplateId } from './App';
import { TrashIcon } from './Icons';

type Props = {
  isOpen: boolean;  // ✅ Von "open" zu "isOpen" geändert
  onClose: () => void;
  language: string;
  setLanguage: (l: string) => void;
  
  activeTemplate: ActiveTemplate;
  setActiveTemplate: (t: ActiveTemplate) => void;

  customTemplates: CustomTemplate[];
  onAddCustomTemplate: (name: string, background: string, bgType: 'image' | 'video') => void;
  onDeleteCustomTemplate: (id: string) => void;
};

const LANGS = [ { id: 'en', label: 'English' }, { id: 'es', label: 'Español' }, { id: 'de', label: 'Deutsch' } ];

const PREDEFINED_TEMPLATES: { id: PredefinedTemplateId, label: string }[] = [
  { id: 'invert-white', label: 'Invert white buttons' },
  { id: 'invert-black', label: 'Invert black buttons' },
  { id: 'colors', label: 'Colors' },
];

const AdjustmentsModal: React.FC<Props> = ({
  isOpen,  // ✅ Von "open" zu "isOpen" geändert
  onClose, 
  language, 
  setLanguage,
  activeTemplate, 
  setActiveTemplate,
  customTemplates, 
  onAddCustomTemplate, 
  onDeleteCustomTemplate,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const backgroundFilePickerRef = useRef<HTMLInputElement | null>(null);
  const [openSection, setOpenSection] = useState<'templates' | 'my-templates' | ''>('templates');

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateError, setNewTemplateError] = useState('');

  useEffect(() => {
    if (!isOpen) return;  // ✅ Von "open" zu "isOpen" geändert
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);  // ✅ Von "open" zu "isOpen" geändert

  const handleCustomBackgroundSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!newTemplateName.trim()) {
      setNewTemplateError('Please enter a name first.');
      return;
    }
    setNewTemplateError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      let bgType: 'image' | 'video' | null = null;
      if (file.type.startsWith('image/')) bgType = 'image';
      else if (file.type.startsWith('video/')) bgType = 'video';
      else { setNewTemplateError("Unsupported file. Use image or video."); return; }
      
      onAddCustomTemplate(newTemplateName, dataUrl, bgType);
      setNewTemplateName('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const SectionButton: React.FC<{ sectionId: 'templates' | 'my-templates', title: string }> = ({ sectionId, title }) => (
    <button
      onClick={() => setOpenSection(openSection === sectionId ? '' : sectionId)}
      className="w-full text-left flex justify-between items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
      aria-expanded={openSection === sectionId}
    >
      <span className="font-semibold">{title}</span>
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        className={`transition-transform transform ${openSection === sectionId ? 'rotate-180' : ''}`}
      >
        <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );

  if (!isOpen) return null;  // ✅ Von "open" zu "isOpen" geändert

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/50" aria-label="Close adjustments" onClick={onClose} />
      <div
        ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="adj-title"
        className="relative z-10 mx-auto mt-20 w-[92%] max-w-md rounded-2xl bg-[#0f172a] text-white shadow-2xl border border-white/10"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="adj-title" className="text-lg font-semibold">Adjustments</h2>
            <button onClick={onClose} className="px-3 py-1 rounded-lg bg-white text-black hover:bg-white/90">Close</button>
          </div>

          <div className="space-y-3">
            <SectionButton sectionId="templates" title="Templates" />
            {openSection === 'templates' && (
              <div className="pl-4 space-y-2">
                {PREDEFINED_TEMPLATES.map(({ id, label }) => {
                  const isActive = activeTemplate.type === 'predefined' && activeTemplate.id === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTemplate({ type: 'predefined', id })}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${isActive ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                    >{label}</button>
                  );
                })}
              </div>
            )}

            <SectionButton sectionId="my-templates" title="My Templates" />
            {openSection === 'my-templates' && (
              <div className="pl-4 space-y-2">
                {customTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                    <span className="text-sm truncate flex-1">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTemplate({ type: 'custom', id: t.id })}
                        className={`text-xs px-2 py-1 rounded ${activeTemplate.type === 'custom' && activeTemplate.id === t.id ? 'bg-indigo-600' : 'bg-gray-600 hover:bg-indigo-600'}`}
                      >Select</button>
                      <button onClick={() => onDeleteCustomTemplate(t.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon /></button>
                    </div>
                  </div>
                ))}

                {customTemplates.length < 10 ? (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <p className="text-xs uppercase tracking-widest opacity-80 mb-2">Create New</p>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={e => { setNewTemplateName(e.target.value); setNewTemplateError(''); }}
                      placeholder="Template Name"
                      className="w-full px-3 py-2 rounded-md bg-gray-700 text-white border border-gray-600 mb-2"
                    />
                    <button
                      onClick={() => backgroundFilePickerRef.current?.click()}
                      className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/40 hover:border-white/80 transition text-sm disabled:opacity-50"
                      disabled={!newTemplateName.trim()}
                    >
                      Upload Background
                    </button>
                    {newTemplateError && <p className="text-red-400 text-xs mt-1">{newTemplateError}</p>}
                    <input type="file" accept="image/*,video/*" ref={backgroundFilePickerRef} onChange={handleCustomBackgroundSelect} className="hidden" />
                  </div>
                ) : <p className="text-xs text-gray-500 pt-2">You have reached the maximum of 10 templates.</p>}
              </div>
            )}
          </div>
          
          <section className="mt-6">
            <h3 className="text-xs uppercase tracking-widest opacity-80 mb-2">Language</h3>
            <div className="grid grid-cols-3 gap-3">
              {LANGS.map(l => {
                const active = language === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    aria-pressed={active}
                    className={`px-3 py-2 rounded-xl border transition text-sm ${active ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/40 hover:border-white/80'}`}
                  >{l.label}</button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentsModal;