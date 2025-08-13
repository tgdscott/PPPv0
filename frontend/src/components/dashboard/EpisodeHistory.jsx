import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Loader2, RefreshCw, ImageOff, Play, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function EpisodeHistory({ token }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/episodes/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load episodes (${res.status})`);
      const data = await res.json();

      // Expect shape { items: [...] }
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      // Sort newest-first
      const sorted = [...list].sort((a, b) => {
        const da = a.processed_at ? new Date(a.processed_at) : 0;
        const db = b.processed_at ? new Date(b.processed_at) : 0;
        return (db - da) || 0;
      });
      setEpisodes(sorted);
    } catch (e) {
      setErr(e.message || "Failed to load episodes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const statusChip = (s) => {
    const S = String(s || "").toLowerCase();
    if (S === "published") return <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="w-4 h-4 mr-1"/>Published</Badge>;
    if (S === "processed") return <Badge className="bg-blue-600 hover:bg-blue-600"><Clock className="w-4 h-4 mr-1"/>Processed</Badge>;
    if (S === "processing") return <Badge className="bg-amber-600 hover:bg-amber-600"><Loader2 className="w-4 h-4 mr-1 animate-spin"/>Processing</Badge>;
    if (S === "error") return <Badge className="bg-red-600 hover:bg-red-600"><AlertTriangle className="w-4 h-4 mr-1"/>Error</Badge>;
    return <Badge variant="outline">{s || "Unknown"}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Episode History</h2>
        <Button onClick={fetchEpisodes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2"/> Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center text-gray-600"><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Loading…</div>
      )}
      {err && <div className="text-red-600">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {episodes.map((ep) => {
          const coverUrl = ep.cover_url || `/api/episodes/${ep.id}/cover`;
          const audioRaw = ep.final_audio_url || ep.final_audio_path || "";
          const audioUrl = audioRaw ? (audioRaw.startsWith('http') ? audioRaw : (audioRaw.startsWith('/') ? audioRaw : `/${audioRaw}`)) : '';
          const missingAudio = audioUrl && ep.final_audio_exists === false;
          const missingCover = ep.cover_url && ep.cover_exists === false;
          return (
            <Card key={ep.id} className="overflow-hidden">
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center relative">
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextSibling;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-gray-400">
                  <ImageOff className="w-8 h-8 mr-2"/> No cover
                </div>
                {missingCover && (
                  <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-2 py-1 rounded">No Cover File</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{ep.title || "Untitled Episode"}</CardTitle>
                <div className="mt-2">{statusChip(ep.status)}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ep.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{ep.description}</p>
                )}
                {audioUrl ? (
                  <div>
                    <audio controls src={audioUrl} className="w-full" onError={(e)=>{e.currentTarget.insertAdjacentHTML('afterend', '<div class=\"text-xs text-red-600 mt-1\">Audio failed to load</div>')}}>
                      Your browser does not support the audio element.
                    </audio>
                    {missingAudio && <div className="text-xs text-red-600 mt-1">File missing on server</div>}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm flex items-center"><Play className="w-4 h-4 mr-2"/> No audio available</div>
                )}
                {ep.is_published_to_spreaker && (
                  <div className="text-xs text-green-700">Pushed to Spreaker</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!loading && episodes.length === 0) && (
        <div className="text-gray-500">No episodes yet.</div>
      )}
    </div>
  );
}
