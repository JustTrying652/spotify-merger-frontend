import "./Merger.css";
import { useState } from "react";
import { api, type Playlist, type DuplicateTrack, type NearDuplicatePair } from "./api/client";


interface MergerProps {
  playlists: Playlist[];
  onPlaylistCreated: (playlist: Playlist) => void;
  onBackdropChange: (image: string | null) => void;
}

type Status = "idle" | "checking" | "merging" | "error";

export function Merger({ playlists, onPlaylistCreated, onBackdropChange }: MergerProps) {
  const [playlistAId, setPlaylistAId] = useState("");
  const [playlistBId, setPlaylistBId] = useState("");
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateTrack[] | null>(null);
  const [nearDuplicates, setNearDuplicates] = useState<NearDuplicatePair[]>([]);
  const [mergeUrl, setMergeUrl] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"name" | "artist">("name");

  const bothSelected = playlistAId && playlistBId && playlistAId !== playlistBId;

  const handleSelectA = (id: string) => {
    setPlaylistAId(id);
    const playlist = playlists.find((p) => p.id === id);
    onBackdropChange(playlist?.image ?? null);
  };

  const handleSelectB = (id: string) => {
    setPlaylistBId(id);
    const playlist = playlists.find((p) => p.id === id);
    onBackdropChange(playlist?.image ?? null);
  };

  const handleCheckDuplicates = async () => {
    setStatus("checking");
    setError("");
    setDuplicates(null);
    setNearDuplicates([]);
    try {
      const result = await api.findDuplicates(playlistAId, playlistBId);
      setDuplicates(result.duplicates);
      setNearDuplicates(result.near_duplicates);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleMerge = async () => {
    setStatus("merging");
    setError("");
    setMergeUrl(null);
    try {
      const result = await api.merge(playlistAId, playlistBId, newName || "Merged Playlist");
      setMergeUrl(result.new_playlist_url);
      onPlaylistCreated({
        id: result.new_playlist_id,
        name: newName || "Merged Playlist",
        track_count: result.total_tracks,
        image: null,
        owner: "",
      });
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

    const playlistAName = playlists.find((p) => p.id === playlistAId)?.name ?? "Crate A";
  const playlistBName = playlists.find((p) => p.id === playlistBId)?.name ?? "Crate B";

  const sortedDuplicates = duplicates
    ? [...duplicates].sort((a, b) =>
        sortBy === "name" ? a.name.localeCompare(b.name) : a.artists.localeCompare(b.artists)
      )
    : null;

  return (
    <div className="merger">
      <div className="crates">
        <PlaylistPicker
          label="Crate A"
          playlists={playlists}
          selectedId={playlistAId}
          onSelect={handleSelectA}
          excludeId={playlistBId}
        />
        <div className="crate-divider" aria-hidden="true" />
        <PlaylistPicker
          label="Crate B"
          playlists={playlists}
          selectedId={playlistBId}
          onSelect={handleSelectB}
          excludeId={playlistAId}
        />
      </div>

      {!bothSelected && (
        <p className="hint">Pick a playlist in each crate to compare or merge them.</p>
      )}

      {bothSelected && (
        <div className="actions">
          <button onClick={handleCheckDuplicates} disabled={status === "checking"}>
            {status === "checking" ? "Checking…" : "Find duplicates"}
          </button>

          <div className="merge-group">
            <label htmlFor="new-name">New playlist name</label>
            <div className="merge-row">
              <input
                id="new-name"
                type="text"
                placeholder="Merged Playlist"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button className="brass-button" onClick={handleMerge} disabled={status === "merging"}>
                {status === "merging" ? "Merging…" : "Merge into new playlist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {duplicates && (
        <div className="results">
          <h2>{duplicates.length} exact duplicate{duplicates.length !== 1 ? "s" : ""} found</h2>
          <ul className="track-list">
            {duplicates.map((t) => (
              <li key={t.uri}>
                <div className="track-info">
                  {t.image && <img src={t.image} alt="" className="track-thumb" />}
                  <span className="track-name">{t.name}</span>
                </div>
                <span className="track-artists">{t.artists}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nearDuplicates.length > 0 && (
        <div className="results">
          <h2>{nearDuplicates.length} possible duplicate{nearDuplicates.length !== 1 ? "s" : ""} (different release)</h2>
          <ul className="near-dup-list">
            {nearDuplicates.map((pair, i) => (
              <li key={i}>
                <div className="near-dup-track">
                  {pair.a.image && <img src={pair.a.image} alt="" className="track-thumb" />}
                  <div>
                    <span className="track-name">{pair.a.name}</span>
                    <span className="track-artists">{pair.a.artists}</span>
                  </div>
                </div>
                <span className="near-dup-vs">~</span>
                <div className="near-dup-track">
                  {pair.b.image && <img src={pair.b.image} alt="" className="track-thumb" />}
                  <div>
                    <span className="track-name">{pair.b.name}</span>
                    <span className="track-artists">{pair.b.artists}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mergeUrl && (
        <div className="results success">
          <h2>Playlist created</h2>
          <a href={mergeUrl} target="_blank" rel="noreferrer" className="brass-link">
            Open in Spotify
          </a>
        </div>
      )}
    </div>
  );
}

interface PlaylistPickerProps {
  label: string;
  playlists: Playlist[];
  selectedId: string;
  onSelect: (id: string) => void;
  excludeId: string;
}

function PlaylistPicker({ label, playlists, selectedId, onSelect, excludeId }: PlaylistPickerProps) {
  return (
    <div className="crate">
      <h3>{label}</h3>
      <div className="crate-list">
        {playlists
          .filter((p) => p.id !== excludeId)
          .map((p) => (
            <button
              key={p.id}
              className={`crate-item ${selectedId === p.id ? "selected" : ""}`}
              onClick={() => onSelect(p.id)}
            >
              {p.image && <img src={p.image} alt="" className="crate-item-image" />}
              <div className="crate-item-text">
                <span className="crate-item-name">{p.name}</span>
                <span className="crate-item-owner">by {p.owner}</span>
              </div>
              <span className="crate-item-count">{p.track_count} tracks</span>
            </button>
          ))}
      </div>
    </div>
  );
}