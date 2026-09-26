import React, { useEffect, useState } from 'react';
import { YouTubeChannelSlot } from './types';
import { getNewestUploadsFromChannel, RssVideo } from './youtubeRss';
import { resolveYouTubeSourceUrl } from './youtubeChannelSearch';
import ChangeChannelModal, {
  SelectedYouTubeItem,
} from './ChangeChannelModal';
import { buildYouTubeEmbedSrc, isSandboxed } from './youtubeEmbed';

type SlotProps = {
  slot: YouTubeChannelSlot;
  onEdit: (slotId: number) => void;
};

const ChannelSlot: React.FC<SlotProps> = ({ slot, onEdit }) => {
  const [video, setVideo] = useState<RssVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sandboxed, setSandboxed] = useState(true);

  const slotType =
    slot.type === 'video' && slot.videoId ? 'video' : 'channel';

  useEffect(() => {
    setSandboxed(isSandboxed());
  }, []);

  useEffect(() => {
    if (slotType === 'video' && slot.videoId) {
      setVideo({
        videoId: slot.videoId,
        title: slot.videoTitle || 'YouTube video',
        channelTitle: slot.videoChannelName || undefined,
        thumbnailUrl:
          slot.videoThumbnailUrl ||
          `https://i.ytimg.com/vi/${slot.videoId}/hqdefault.jpg`,
        publishedAt: slot.videoPublishedAt || undefined,
        embeddable: slot.videoEmbeddable !== false,
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!slot.channelId && !slot.channelUrl) {
      setVideo(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchVideo = async () => {
      setLoading(true);
      setError(null);

      try {
        let channelId = slot.channelId;

        if (!channelId && slot.channelUrl) {
          const resolved = await resolveYouTubeSourceUrl(slot.channelUrl);
          if (resolved.kind !== 'channel') {
            throw new Error('This slot does not contain a YouTube channel URL.');
          }
          channelId = resolved.channelId;
        }

        if (!channelId) {
          throw new Error('No YouTube channel was configured.');
        }

        const videos = await getNewestUploadsFromChannel(
          channelId,
          '',
          { count: 1 }
        );

        if (!cancelled) {
          setVideo(videos[0] || null);

          if (!videos[0]) {
            setError('No public videos found for this channel.');
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setVideo(null);
          setError(e?.message || 'Failed to load YouTube video.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVideo();

    return () => {
      cancelled = true;
    };
  }, [
    slotType,
    slot.channelId,
    slot.channelUrl,
    slot.uploadsPlaylistId,
    slot.videoId,
    slot.videoTitle,
    slot.videoChannelName,
    slot.videoThumbnailUrl,
    slot.videoPublishedAt,
    slot.videoEmbeddable,
  ]);

  const handleVideoClick = () => {
    if (!video) return;

    if (sandboxed) {
      window.open(
        `https://www.youtube.com/watch?v=${video.videoId}`,
        '_blank'
      );
    } else {
      setIsModalOpen(true);
    }
  };

  const VideoModal = () => {
    if (!video) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setIsModalOpen(false)}
      >
        <div
          className="bg-black rounded-xl overflow-hidden max-w-4xl w-full shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          {video.embeddable ? (
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={buildYouTubeEmbedSrc(video.videoId)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-6 text-gray-200">
              <p className="text-sm">
                Embedding this video is not permitted.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end p-3 bg-gray-900">
            <a
              className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 hover:bg-gray-700 text-sm"
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on YouTube
            </a>

            <button
              className="px-4 py-2 rounded-md bg-[#c52323] text-white hover:bg-[#a91f1f] text-sm"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const displayName =
    slotType === 'video'
      ? slot.videoChannelName || 'Saved Video'
      : slot.channelName || 'Empty Slot';

  const typeLabel = slotType === 'video' ? 'VIDEO' : 'CHANNEL';

  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-300 truncate">
            {displayName}
          </p>
          <p className="text-[10px] tracking-wider text-gray-500">
            {typeLabel}
          </p>
        </div>

        <button
          onClick={() => onEdit(slot.id)}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-md transition-colors shrink-0"
        >
          Change
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-md min-h-[160px]">
        {loading && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}

        {error && (
          <div className="text-center p-3">
            <p className="text-red-400 text-xs">{error}</p>
            <button
              onClick={() => onEdit(slot.id)}
              className="mt-2 text-xs text-gray-300 underline hover:text-white"
            >
              Change source
            </button>
          </div>
        )}

        {!loading && !error && video && (
          <button
            onClick={handleVideoClick}
            className="w-full text-left group"
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full block aspect-video object-cover rounded-t-md"
              loading="lazy"
              decoding="async"
            />

            <div className="p-2">
              <p className="text-sm font-semibold text-gray-100 line-clamp-2 group-hover:text-red-400 transition-colors">
                {video.title}
              </p>
            </div>
          </button>
        )}

        {!loading &&
          !error &&
          !video &&
          !slot.channelId &&
          slotType !== 'video' && (
            <button
              onClick={() => onEdit(slot.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              + Add Channel or Video
            </button>
          )}
      </div>

      {isModalOpen && <VideoModal />}
    </div>
  );
};

type GridProps = {
  slots: YouTubeChannelSlot[];
  onSetSlots: React.Dispatch<
    React.SetStateAction<YouTubeChannelSlot[]>
  >;
};

const AdditionalYouTubeGrid: React.FC<GridProps> = ({
  slots,
  onSetSlots,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(
    null
  );

  const handleEditSlot = (slotId: number) => {
    setEditingSlotId(slotId);
    setModalOpen(true);
  };

  const handleSaveItem = (
    slotId: number,
    item: SelectedYouTubeItem
  ) => {
    onSetSlots(prevSlots =>
      prevSlots.map(slot => {
        if (slot.id !== slotId) return slot;

        if (item.kind === 'channel') {
          return {
            ...slot,
            type: 'channel',
            channelId: item.channelId,
            channelName: item.channelName,
            channelUrl: item.channelUrl,
            uploadsPlaylistId: item.uploadsPlaylistId || null,
            videoId: null,
            videoTitle: null,
            videoChannelName: null,
            videoThumbnailUrl: null,
            videoPublishedAt: null,
            videoEmbeddable: undefined,
          };
        }

        return {
          ...slot,
          type: 'video',
          channelId: null,
          channelName: null,
          channelUrl: null,
          uploadsPlaylistId: null,
          videoId: item.videoId,
          videoTitle: item.title,
          videoChannelName: item.channelTitle || null,
          videoThumbnailUrl: item.thumbnailUrl || null,
          videoPublishedAt: item.publishedAt || null,
          videoEmbeddable: item.embeddable,
        };
      })
    );

    setModalOpen(false);
    setEditingSlotId(null);
  };

  return (
    <section className="w-full max-w-4xl mt-8">
      <h2 className="text-gray-100 font-semibold mb-2">
        Latest Videos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slots.map(slot => (
          <ChannelSlot
            key={slot.id}
            slot={slot}
            onEdit={handleEditSlot}
          />
        ))}
      </div>

      {modalOpen && editingSlotId !== null && (
        <ChangeChannelModal
          slotId={editingSlotId}
          onClose={() => {
            setModalOpen(false);
            setEditingSlotId(null);
          }}
          onSave={handleSaveItem}
        />
      )}
    </section>
  );
};

export default AdditionalYouTubeGrid;
