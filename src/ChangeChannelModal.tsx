import React, { useEffect, useRef, useState } from 'react';
import { resolveYouTubeSourceUrl } from './youtubeChannelSearch';

export type SelectedYouTubeItem =
  | {
      kind: 'channel';
      channelId: string;
      channelName: string;
      channelUrl: string;
      thumbnailUrl?: string;
      uploadsPlaylistId?: string | null;
    }
  | {
      kind: 'video';
      videoId: string;
      title: string;
      channelTitle?: string;
      thumbnailUrl: string;
      publishedAt?: string;
      embeddable: boolean;
    };

type Props = {
  slotId: number;
  onClose: () => void;
  onSave: (slotId: number, item: SelectedYouTubeItem) => void;
};

const ChangeChannelModal: React.FC<Props> = ({ slotId, onClose, onSave }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const source = await resolveYouTubeSourceUrl(trimmed);

      if (source.kind === 'video') {
        onSave(slotId, {
          kind: 'video',
          videoId: source.videoId,
          title: source.title,
          channelTitle: source.channelTitle,
          thumbnailUrl: source.thumbnailUrl,
          publishedAt: source.publishedAt,
          embeddable: true,
        });
      } else {
        onSave(slotId, {
          kind: 'channel',
          channelId: source.channelId,
          channelName: source.channelName,
          channelUrl: source.channelUrl,
          thumbnailUrl: source.thumbnailUrl,
          uploadsPlaylistId: null,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load this YouTube URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden bg-gray-800 shadow-2xl text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">Change YouTube Slot</h2>
              <p className="text-sm text-gray-400 mt-1">
                Copy the URL of your YouTube channel or favorite YouTube video.
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-3xl leading-none text-gray-400 hover:text-white"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSave} className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setError(null);
              }}
              placeholder="https://www.youtube.com/@YourChannel"
              className="flex-grow min-w-0 p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-indigo-600 font-bold py-3 px-5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </form>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          <p className="text-xs text-gray-500 mt-4">
            You can paste a channel URL such as youtube.com/@Skateiq or a YouTube video URL.
          </p>
        </div>

        <div className="bg-gray-900 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeChannelModal;
