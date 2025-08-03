import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ArrowLeft, Loader2, Download, Play, Share2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function EpisodeHistory({ onBack, token }) {
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{episode.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{new Date(episode.processed_at).toLocaleDateString()}</span>
                          {getStatusBadge(episode.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {episode.status === 'processed' && episode.final_audio_path && (
                           <a href={`/${episode.final_audio_path}`} download target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                          </a>
                        )}
                         <Button variant="ghost" size="sm"><Play className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="sm"><Share2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>No episodes found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
