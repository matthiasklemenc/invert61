import React, { useEffect, useRef, useState } from 'react';
import {
  getChannelDetails,
  getVideoDetails,
  searchYouTube,
  YouTubeSearchResult,
} from './youtubeApi';

export type SelectedYouTubeItem =
  | {
      kind: 'channel';
      channelId: string;
      channelName: string;
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

const ChangeChannelModal: React.FC<Props> = ({
  slotId,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'channel' | 'video'>('channel');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const found = await searchYouTube(trimmed, tab, 10);
      setResults(found);

      if (found.length === 0) {
        setError(
          `No ${
            tab === 'channel' ? 'channels' : 'videos'
          } found for "${trimmed}".`
        );
      }
    } catch (err: any) {
      setResults([]);
      setError(err?.message || 'YouTube search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (nextTab: 'channel' | 'video') => {
    setTab(nextTab);
    setResults([]);
    setError(null);
  };

  const handleSelect = async (result: YouTubeSearchResult) => {
    const id =
      result.kind === 'channel'
        ? result.channelId
        : result.videoId;

    setSavingId(id);
    setError(null);

    try {
      if (result.kind === 'video') {
        // One cheap videos.list call gives us the real embeddable status.
        const details = await getVideoDetails(result.videoId);

        onSave(slotId, {
          kind: 'video',
          videoId: details.videoId,
          title: details.title,
          channelTitle: details.channelTitle,
          thumbnailUrl: details.thumbnailUrl,
          publishedAt: details.publishedAt,
          embeddable: details.embeddable,
        });

        return;
      }

      const details = await getChannelDetails(result.channelId);

      onSave(slotId, {
        kind: 'channel',
        channelId: details.channelId,
        channelName: details.channelName,
        thumbnailUrl: details.thumbnailUrl,
        uploadsPlaylistId: details.uploadsPlaylistId,
      });
    } catch (err: any) {
      setError(
        err?.message || 'Could not load the selected YouTube item.'
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden bg-gray-800 shadow-2xl text-white flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Change YouTube Slot
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Slot {slotId + 1}: search YouTube and save a channel
                or a specific video.
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

          <div className="flex rounded-lg bg-gray-900 p-1 mb-4">
            <button
              type="button"
              onClick={() => handleTabChange('channel')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                tab === 'channel'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CHANNELS
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('video')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                tab === 'video'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              VIDEOS
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setError(null);
              }}
              placeholder={
                tab === 'channel'
                  ? 'e.g. skate channels'
                  : 'e.g. best skateboarding video'
              }
              className="flex-grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-indigo-600 font-bold py-3 px-5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(result => {
                const id =
                  result.kind === 'channel'
                    ? result.channelId
                    : result.videoId;

                const title =
                  result.kind === 'channel'
                    ? result.channelName
                    : result.title;

                const subtitle =
                  result.kind === 'channel'
                    ? 'YouTube Channel'
                    : result.channelTitle || 'YouTube Video';

                const thumbnail = result.thumbnailUrl;

                return (
                  <div
                    key={`${result.kind}-${id}`}
                    className="flex items-center gap-3 bg-gray-900/70 rounded-lg p-2 hover:bg-gray-900"
                  >
                    <img
                      src={
                        thumbnail ||
                        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                      }
                      alt=""
                      className={`shrink-0 object-cover ${
                        result.kind === 'channel'
                          ? 'w-16 h-16 rounded-full'
                          : 'w-28 aspect-video rounded-md'
                      }`}
                    />

                    <div className="min-w-0 flex-grow">
                      <p className="font-semibold text-sm text-gray-100 line-clamp-2">
                        {title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      disabled={savingId === id}
                      className="shrink-0 bg-[#c52323] hover:bg-[#a91f1f] disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-md"
                    >
                      {savingId === id ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && results.length === 0 && !error && (
            <div className="text-center text-gray-500 text-sm py-8">
              Enter a search term to find{' '}
              {tab === 'channel' ? 'channels' : 'videos'} on YouTube.
            </div>
          )}
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
