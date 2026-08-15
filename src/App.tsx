import { useEffect, useState } from "react";
import { api, type Playlist } from "./api/client";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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

  return (
    <div className="app">
      <h1>Playlist Merger</h1>
      <p>Logged in. Found {playlists.length} playlists.</p>
    </div>
  );
}

export default App;