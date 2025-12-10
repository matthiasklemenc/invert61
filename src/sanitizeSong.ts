import { Song } from './types';

export default function sanitizeSong(song: Song): Song {
  return {
    id: song.id,
    name: song.name,
    artist_name: song.artist_name,
    album_image: song.album_image,
    audio: song.audio,
    audio_hq: song.audio_hq,
    audio_nq: song.audio_nq,
    genre: song.genre,
    license: song.license,
    artist_url: song.artist_url,
    audiodownload_allowed: song.audiodownload_allowed,
  };
}