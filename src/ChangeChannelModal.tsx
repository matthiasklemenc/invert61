import React, { useState, useRef, useEffect } from 'react';
import { resolveChannelUrl } from './youtubeChannelSearch';

type Props = {
  slotId: number;
  onClose: () => void;
  onSave: (slotId: number, newChannel: { id: string; name: string }) => void;
};

const ChangeChannelModal: React.FC<Props> = ({ slotId, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleResolveUrl = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // API Key is no longer needed for this call
      const channelInfo = await resolveChannelUrl(url, '');
      onSave(slotId, { id: channelInfo.id, name: channelInfo.name });
    } catch (err: any) {
      setError(err.message || 'Could not resolve URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl overflow-hidden bg-gray-800 shadow-2xl text-white" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Change Channel</h2>
          <p className="text-sm text-gray-400 mb-4">
            Find your desired channel on YouTube and paste its full URL below.
          </p>
          <form onSubmit={handleResolveUrl}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                placeholder="e.g., https://www.youtube.com/channel/..."
                className="flex-grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 font-bold py-3 px-5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={isLoading || !url.trim()}>
                {isLoading ? 'Verifying...' : 'Save'}
              </button>
            </div>
          </form>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
        <div className="bg-gray-900 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600 transition">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ChangeChannelModal;