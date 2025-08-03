import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ArrowLeft, Loader2, Download, Play, Share2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function EpisodeHistory({ onBack, token }) {
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);

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
    fetchEpisodes();
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

  const handleDownload = async (episode) => {
    if (!episode.final_audio_path) return;
    
    try {
      // The audio files are served from the root, so we just need the path
      const downloadUrl = `/${episode.final_audio_path}`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${episode.title || 'episode'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePlay = (episodeId) => {
    // Toggle play state
    setPlayingId(playingId === episodeId ? null : episodeId);
  };

  const handleShare = async (episode) => {
    const shareUrl = `${window.location.origin}/episode/${episode.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: `Check out this episode: ${episode.title}`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Episode link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Episode History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-4">
              {episodes.length > 0 ? (
                episodes.map(episode => (
                  <Card key={episode.id} className="hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{episode.title}</p>
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
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePlay(episode.id)}
                                title="Play episode"
                                className={playingId === episode.id ? "bg-blue-50" : ""}
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
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Audio Player (shown when playing) */}
                      {playingId === episode.id && episode.final_audio_path && (
                        <div className="mt-4 pt-4 border-t">
                          <audio 
                            controls 
                            className="w-full"
                            src={`/${episode.final_audio_path}`}
                            autoPlay
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No episodes found. Create your first episode to see it here!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};