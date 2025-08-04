"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Loader2,
  Download,
  Play,
  Share2,
  Copy,
  Check,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function EpisodeHistory({ onBack, token }) {
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [shareEpisode, setShareEpisode] = useState(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/episodes/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch episode history.');
        const data = await response.json();
        setEpisodes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchEpisodes();
    }
  }, [token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDownload = (episode) => {
    if (episode.status === 'processed' && episode.final_audio_path) {
      try {
        const downloadUrl = `/${episode.final_audio_path}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${episode.title || 'episode'}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Download error:', err);
      }
    }
  };

  const handlePlay = (episodeId) => {
    setPlayingId(playingId === episodeId ? null : episodeId);
  };

  const handleShare = (episode) => {
    setShareEpisode(episode);
    setIsShareDialogOpen(true);
    setCopied(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getShareableLink = (episode) => {
    return `${window.location.origin}/episode/${episode.id}`;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <Button onClick={onBack} variant="ghost" className="mb-6 text-gray-700 hover:bg-gray-100">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      
      <Card className="border-none shadow-none">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Episode History</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center py-8">{error}</p>
          )}

          {!isLoading && !error && (
            <div className="space-y-4">
              {episodes.length > 0 ? (
                episodes.map(episode => (
                  <Card key={episode.id} className="hover:bg-gray-50 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-900">{episode.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{new Date(episode.processed_at).toLocaleDateString()}</span>
                          {getStatusBadge(episode.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {episode.status === 'processed' && episode.final_audio_path && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(episode)}
                              title="Download episode"
                              className="p-2 text-gray-500 hover:text-gray-800"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePlay(episode.id)}
                              title={playingId === episode.id ? "Pause" : "Play episode"}
                              className={`p-2 text-gray-500 hover:text-gray-800 ${playingId === episode.id ? "bg-gray-200" : ""}`}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(episode)}
                          title="Share episode"
                          className="p-2 text-gray-500 hover:text-gray-800"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>

                    {playingId === episode.id && episode.final_audio_path && (
                      <div className="p-4 pt-0 border-t mt-4">
                        <audio
                          controls
                          className="w-full h-8"
                          src={`/${episode.final_audio_path}`}
                          autoPlay
                          onPause={() => setPlayingId(null)}
                          onEnded={() => setPlayingId(null)}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No episodes found. Create your first episode to see it here!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {isShareDialogOpen && shareEpisode && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Share Episode: {shareEpisode.title}</DialogTitle>
              <DialogDescription>
                Copy the link below to share this episode with others.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="text"
                readOnly
                value={getShareableLink(shareEpisode)}
                className="flex-1 p-2 border rounded-md bg-gray-100 text-sm focus:outline-none"
              />
              <Button onClick={() => copyToClipboard(getShareableLink(shareEpisode))} size="icon" className="w-8 h-8">
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </Button>
            </div>
            {copied && <p className="text-green-600 text-sm mt-2">Link copied!</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}