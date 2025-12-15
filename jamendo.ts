import { Song } from './src/types';
const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0/tracks/';

export async function fetchSongsByGenre(
  genre: string,
  clientId: string,
  commercialOnly: boolean,
  sortOrder: 'id_desc' | 'popularity_total'
): Promise<Song[]> {
  if (!clientId) throw new Error("Jamendo Client ID is required to discover music.");
  
  // Sanitize the genre tag for the API call.
  let tags = genre.toLowerCase().replace(/\s/g, '');
  // Specifically handle "R&B" as the ampersand breaks the URL parameters.
  if (tags === 'r&b') {
    tags = 'rnb';
  }

  const url = `${JAMENDO_API_URL}?client_id=${clientId}&format=json&limit=50&tags=${tags}&image_size=500&order=${sortOrder}&audioformat=mp32`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch songs from Jamendo. Status: ${resp.status}`);
  const data = await resp.json();
  if (data.headers.status !== 'success') {
    const msg = data.headers.error_message || 'Unknown error';
    if (msg.includes("credential is not authorized")) throw new Error("Jamendo Client ID Invalid: Your credential is not authorized. Please check your Client ID.");
    throw new Error(`Jamendo API Error: ${msg}`);
  }
  let results = data.results;
  if (commercialOnly) {
    results = results.filter((t: any) => {
      const url = t.license_ccurl || '';
      return typeof url === 'string' && !url.includes('-nc');
    });
  }
  return results
    .filter((t: any) => t.audio && typeof t.audio === 'string')
    .map((t: any): Song => {
      const nqUrl = t.audio;
      const hqUrl = (t.audiodownload_allowed && t.audiodownload && t.audiodownload !== nqUrl) ? t.audiodownload : undefined;
      const artistUrl = t.artist_id ? `https://www.jamendo.com/artist/${t.artist_id}` : undefined;
      
      return {
        id: t.id,
        name: t.name,
        artist_name: t.artist_name,
        album_image: t.image,
        // Revert to using direct URLs from Jamendo
        audio: hqUrl || nqUrl,
        audio_hq: hqUrl,
        audio_nq: nqUrl,
        audiodownload_allowed: t.audiodownload_allowed,
        genre,
        license: t.license_ccurl,
        artist_url: artistUrl,
      };
    });
}