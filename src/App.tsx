import { useEffect, useState } from "react";
import { api, type Playlist } from "./api/client";
import { Merger } from "./Merger";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [backdropImage, setBackdropImage] = useState<string | null>(null);

  useEffect(() => {
    api
      .myPlaylists()
      .then((data) => {
        setPlaylists(data.playlists);
        setIsLoggedIn(true);
      })
      .catch(() => setIsLoggedIn(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogin = async () => {
    const { auth_url } = await api.login();
    window.location.href = auth_url;
  };

  if (!authChecked) {
    return <div className="loading">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <h1>Playlist Merger</h1>
        <p>Connect Spotify to compare and combine your playlists.</p>
        <button className="brass-button" onClick={handleLogin}>
          Connect Spotify
        </button>
      </div>
    );
  }

  const handlePlaylistCreated = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  return (
    <div className="app">
      {backdropImage && (
  <div className="backdrop" style={{ backgroundImage: `url(${backdropImage})` }} />
)}
      <header className="app-header">
        <h1>Playlist Merger</h1>
        <p className="tagline">Find the overlap. Keep what's unique.</p>
      </header>
      <Merger playlists={playlists} onPlaylistCreated={handlePlaylistCreated} onBackdropChange={setBackdropImage} />
    </div>
  );
}

export default App;