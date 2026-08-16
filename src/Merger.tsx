import "./Merger.css";
import { useState } from "react";
import { api, type Playlist, type DuplicateTrack } from "./api/client";


interface MergerProps {
  playlists: Playlist[];
  onPlaylistCreated: (playlist: Playlist) => void;
}

type Status = "idle" | "checking" | "merging" | "error";

export function Merger({ playlists, onPlaylistCreated }: MergerProps) {
  const [playlistAId, setPlaylistAId] = useState("");
  const [playlistBId, setPlaylistBId] = useState("");
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateTrack[] | null>(null);
  const [mergeUrl, setMergeUrl] = useState<string | null>(null);

  const bothSelected = playlistAId && playlistBId && playlistAId !== playlistBId;

  const handleCheckDuplicates = async () => {
    setStatus("checking");
    setError("");
    setDuplicates(null);
    try {
      const result = await api.findDuplicates(playlistAId, playlistBId);
      setDuplicates(result.duplicates);
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
      });
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div className="merger">
      <div className="crates">
        <PlaylistPicker
          label="Crate A"
          playlists={playlists}
          selectedId={playlistAId}
          onSelect={setPlaylistAId}
          excludeId={playlistBId}
        />
        <div className="crate-divider" aria-hidden="true" />
        <PlaylistPicker
          label="Crate B"
          playlists={playlists}
          selectedId={playlistBId}
          onSelect={setPlaylistBId}
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

          <div className="merge-row">
            <input
              type="text"
              placeholder="New playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="brass-button" onClick={handleMerge} disabled={status === "merging"}>
              {status === "merging" ? "Merging…" : "Merge into new playlist"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {duplicates && (
        <div className="results">
          <h2>{duplicates.length} duplicate{duplicates.length !== 1 ? "s" : ""} found</h2>
          <ul className="track-list">
            {duplicates.map((t) => (
              <li key={t.uri}>
                <span className="track-name">{t.name}</span>
                <span className="track-artists">{t.artists}</span>
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
              <span className="crate-item-name">{p.name}</span>
              <span className="crate-item-count">{p.track_count} tracks</span>
            </button>
          ))}
      </div>
    </div>
  );
}