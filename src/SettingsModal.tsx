import React from 'react';

const SettingsModal: React.FC<{
  onClose: () => void;
  commercialOnly: boolean;
  onSetCommercialOnly: (val: boolean) => void;
  sortOrder: 'id_desc' | 'popularity_total' | 'random';
  onSetSortOrder: (val: 'id_desc' | 'popularity_total' | 'random') => void;
  uiLang?: string;
  onSetUiLang?: (lang: string) => void;
  jamendoClientId?: string;
  onSetJamendoClientId?: (id: string) => void;
}> = ({ onClose, commercialOnly, onSetCommercialOnly, sortOrder, onSetSortOrder }) => {

  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSetSortOrder(event.target.value as 'id_desc' | 'popularity_total' | 'random');
  };

  const handleHardReset = async () => {
    if (confirm("This will clear all app data and force a reload. Continue?")) {
       // Unregister workers
       if ('serviceWorker' in navigator) {
           const regs = await navigator.serviceWorker.getRegistrations();
           for (const reg of regs) await reg.unregister();
       }
       // Clear caches
       if ('caches' in window) {
           const keys = await caches.keys();
           for (const key of keys) await caches.delete(key);
       }
       // Reload
       window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full text-white shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Search Settings</h3>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-white transition-colors">&times;</button>
        </div>
        <div className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={commercialOnly}
              onChange={(e) => onSetCommercialOnly(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
            <span className="text-gray-300">Show only songs for commercial projects</span>
          </label>

          <hr className="border-gray-700" />

          <fieldset>
            <legend className="sr-only">Sort Order</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  value="random"
                  checked={sortOrder === 'random'}
                  onChange={handleSortChange}
                  className="w-5 h-5 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className="text-gray-300">Play randomly songs of the chosen genre(s)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  value="popularity_total"
                  checked={sortOrder === 'popularity_total'}
                  onChange={handleSortChange}
                  className="w-5 h-5 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className="text-gray-300">Play most popular songs first</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  value="id_desc"
                  checked={sortOrder === 'id_desc'}
                  onChange={handleSortChange}
                  className="w-5 h-5 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
                />
                <span className="text-gray-300">Play newest songs first</span>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
            <button 
                onClick={handleHardReset}
                className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 text-xs font-bold py-3 px-4 rounded-md transition-colors border border-red-800"
            >
                ⚠️ FORCE REFRESH
            </button>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-green-400 font-mono">v4.3 (Logos Fixed)</span>
          <button onClick={onClose} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;