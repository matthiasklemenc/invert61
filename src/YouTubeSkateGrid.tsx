import React, { useEffect, useState } from 'react';
import { getNewestUploadsFromChannel } from './youtubeRss';
import { buildYouTubeEmbedSrc, isSandboxed } from './youtubeEmbed';

const CHANNEL_ID = 'UC-Pk-TTaSrDOjkPKQ7C8HXQ'; // Skate IQ

type Card = {
  id: string;
  title: string;
  channelTitle?: string;
  thumb: string;
  publishedAt?: string;
  embeddable: boolean;
};

export default function YouTubeSkateGrid() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; embeddable: boolean } | null>(null);
  const [sandboxed, setSandboxed] = useState(true);

  useEffect(() => {
    setSandboxed(isSandboxed());
  }, []);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        // API Key is no longer needed
        const vids = await getNewestUploadsFromChannel(CHANNEL_ID, '', { count: 1 });
        if (aborted) return;
        const mapped: Card[] = vids.map(v => ({
          id: v.videoId,
          title: v.title,
          channelTitle: v.channelTitle,
          thumb: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          embeddable: v.embeddable,
        }));
        setCards(mapped);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || 'Could not load YouTube feed.');
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, []);

  const handleCardClick = (card: Card) => {
    if (sandboxed) {
      window.open(`https://www.youtube.com/watch?v=${card.id}`, '_blank');
    } else {
      setOpen({ id: card.id, embeddable: card.embeddable });
    }
  };
  
  return (
    <section className="w-full max-w-4xl mt-8">
      <h2 className="text-gray-100 font-semibold mb-2">Latest from Skate IQ</h2>

      {loading && (
        <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-300">Loading…</div>
      )}

      {!loading && err && (
        <div className="rounded-lg p-4 bg-red-900/50">
          <div className="font-semibold mb-1 text-red-300">
            YouTube Error
          </div>
          <div className="text-sm text-gray-300">{err}</div>
        </div>
      )}

      {!loading && !err && cards.length > 0 && (
        <button
          className="bg-gray-800 rounded-lg overflow-hidden text-left hover:ring-2 hover:ring-[#c52323]"
          onClick={() => handleCardClick(cards[0])}
        >
          <img
            src={cards[0].thumb}
            alt={cards[0].title}
            className="w-full block aspect-video object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="p-3">
            <p className="text-sm font-semibold text-gray-100 line-clamp-2">{cards[0].title}</p>
            <p className="text-xs text-gray-400 mt-1">{cards[0].channelTitle}</p>
          </div>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-black rounded-xl overflow-hidden max-w-4xl w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {open.embeddable ? (
              <div className="relative" style={{ paddingTop: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={buildYouTubeEmbedSrc(open.id)}
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
                href={`https://www.youtube.com/watch?v=${open.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on YouTube
              </a>
              <button
                className="px-4 py-2 rounded-md bg-[#c52323] text-white hover:bg-[#a91f1f] text-sm"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
