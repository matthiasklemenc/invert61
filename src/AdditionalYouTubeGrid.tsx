import React, { useState, useEffect } from 'react';
import { YouTubeChannelSlot } from './types';
import { getNewestUploadsFromChannel, RssVideo } from './youtubeRss';
import ChangeChannelModal from './ChangeChannelModal';
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

  useEffect(() => {
    setSandboxed(isSandboxed());
  }, []);

  useEffect(() => {
    if (!slot.channelId) {
      setVideo(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const videos = await getNewestUploadsFromChannel(slot.channelId!, '', { count: 1 });
        if (!isCancelled) {
          if (videos.length > 0) {
            setVideo(videos[0]);
          } else {
            throw new Error("No videos found for this channel.");
          }
        }
      } catch (e: any) {
        if (!isCancelled) {
          setError(e.message || "Failed to fetch video.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchVideo();
    return () => { isCancelled = true; };
  }, [slot.channelId]);

  const handleVideoClick = () => {
    if (!video) return;
    if (sandboxed) {
      window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
    } else {
      setIsModalOpen(true);
    }
  };

  const VideoModal = () => {
    if (!video) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
        <div className="bg-black rounded-xl overflow-hidden max-w-4xl w-full shadow-lg" onClick={e => e.stopPropagation()}>
          {video.embeddable ? (
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={buildYouTubeEmbedSrc(video.videoId)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="p-6 text-gray-200">
              <p className="text-sm">Embedding this video is not permitted.</p>
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
            <button className="px-4 py-2 rounded-md bg-[#c52323] text-white hover:bg-[#a91f1f] text-sm" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300 truncate">{slot.channelName || 'Empty Slot'}</p>
        <button onClick={() => onEdit(slot.id)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-md transition-colors">
          Change
        </button>
      </div>
      <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-md min-h-[160px]">
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {error && <p className="text-red-400 text-xs text-center p-2">{error}</p>}
        {!loading && !error && video && (
          <button onClick={handleVideoClick} className="w-full text-left group">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full block aspect-video object-cover rounded-t-md" />
            <div className="p-2">
              <p className="text-sm font-semibold text-gray-100 line-clamp-2 group-hover:text-red-400 transition-colors">{video.title}</p>
            </div>
          </button>
        )}
        {!loading && !slot.channelId && (
          <button onClick={() => onEdit(slot.id)} className="text-gray-400 hover:text-white transition-colors">
            + Add Channel
          </button>
        )}
      </div>
      {isModalOpen && <VideoModal />}
    </div>
  );
};

type GridProps = {
  slots: YouTubeChannelSlot[];
  onSetSlots: React.Dispatch<React.SetStateAction<YouTubeChannelSlot[]>>;
};

const AdditionalYouTubeGrid: React.FC<GridProps> = ({ slots, onSetSlots }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);

  const handleEditSlot = (slotId: number) => {
    setEditingSlotId(slotId);
    setModalOpen(true);
  };

  const handleSaveChannel = (slotId: number, newChannel: { id: string; name: string }) => {
    onSetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId ? { ...slot, channelId: newChannel.id, channelName: newChannel.name } : slot
      )
    );
    setModalOpen(false);
    setEditingSlotId(null);
  };

  return (
    <section className="w-full max-w-4xl mt-8">
      <h2 className="text-gray-100 font-semibold mb-2">Latest Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slots.map(slot => (
          <ChannelSlot key={slot.id} slot={slot} onEdit={handleEditSlot} />
        ))}
      </div>
      {modalOpen && editingSlotId !== null && (
        <ChangeChannelModal
          slotId={editingSlotId}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveChannel}
        />
      )}
    </section>
  );
};

export default AdditionalYouTubeGrid;