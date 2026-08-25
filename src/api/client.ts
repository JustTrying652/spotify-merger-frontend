const API_BASE = "http://127.0.0.1:8000/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // sends/receives the Django session cookie cross-origin
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface Playlist {
  id: string;
  name: string;
  track_count: number;
  image: string | null;
  owner: string;
}

export interface MergeResult {
  new_playlist_id: string;
  new_playlist_url: string;
  total_tracks: number;
  duplicates_removed: number;
}

export interface DuplicateTrack {
  name: string;
  artists: string;
  uri: string;
  image: string | null;
}

export interface NearDuplicateTrack {
  name: string;
  artists: string;
  image: string | null;
}

export interface NearDuplicatePair {
  a: NearDuplicateTrack;
  b: NearDuplicateTrack;
}

export interface NearDuplicateResolution {
  a_uri: string;
  b_uri: string;
  keep: "a" | "b" | "both";
}

export interface DuplicatesResult {
  duplicate_count: number;
  duplicates: DuplicateTrack[];
  near_duplicate_count: number;
  near_duplicates: NearDuplicatePair[];
}

export interface PreviewResult {
  total_tracks: number;
  duplicates_removed: number;
  total_duration: string;
}

export function exportPlaylistUrl(playlistId: string, filetype: "json" | "csv"): string {
  return `${API_BASE}/export/${playlistId}/?filetype=${filetype}`;
}

export const api = {
  login: () => apiFetch<{ auth_url: string }>("/auth/login/"),
  myPlaylists: () => apiFetch<{ playlists: Playlist[] }>("/playlists/"),
  findDuplicates: (playlist_a_id: string, playlist_b_id: string) =>
    apiFetch<DuplicatesResult>("/duplicates/", {
      method: "POST",
      body: JSON.stringify({ playlist_a_id, playlist_b_id }),
    }),
    preview: (
    playlist_a_id: string,
    playlist_b_id: string,
    excludedIds: string[],
    resolutions: NearDuplicateResolution[]
  ) =>
    apiFetch<PreviewResult>("/preview/", {
      method: "POST",
      body: JSON.stringify({
        playlist_a_id,
        playlist_b_id,
        excluded_ids: excludedIds,
        near_duplicate_resolutions: resolutions,
      }),
    }),
  merge: (
    playlist_a_id: string,
    playlist_b_id: string,
    new_name: string,
    isPublic: boolean,
    excludedIds: string[],
    resolutions: NearDuplicateResolution[]
  ) =>
    apiFetch<MergeResult>("/merge/", {
      method: "POST",
      body: JSON.stringify({
        playlist_a_id,
        playlist_b_id,
        new_name,
        public: isPublic,
        excluded_ids: excludedIds,
        near_duplicate_resolutions: resolutions,
      }),
    }),
};