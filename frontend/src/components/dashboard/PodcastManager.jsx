import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { ArrowLeft, Loader2, Plus, Upload, Image as ImageIcon } from "lucide-react"
import { useState, useEffect } from "react"

export default function PodcastManager({ onBack, token }) {
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for creating a new podcast
  const [newPodcastName, setNewPodcastName] = useState('');
  const [newPodcastDescription, setNewPodcastDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPodcasts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/podcasts/', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!response.ok) throw new Error('Failed to fetch podcasts.');
      const data = await response.json();
      setPodcasts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, [token]);

  const handleCreatePodcast = async (e) => {
    e.preventDefault();
    if (!newPodcastName) {
      setError("Podcast name is required.");
      return;
    }
    setIsCreating(true);
    setError(null);
    let coverPath = null;

    try {
      // Step 1: Upload cover art if a file is selected
      if (coverFile) {
        const formData = new FormData();
        formData.append("files", coverFile);
        const uploadResponse = await fetch('/api/media/upload/podcast_cover', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error('Cover art upload failed.');
        const uploadResult = await uploadResponse.json();
        coverPath = uploadResult[0].filename;
      }

      // Step 2: Create the podcast record
      const podcastData = {
        name: newPodcastName,
        description: newPodcastDescription,
        cover_path: coverPath,
      };
      const createResponse = await fetch('/api/podcasts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(podcastData),
      });
      if (!createResponse.ok) throw new Error('Failed to create podcast.');

      // Reset form and refresh list
      setNewPodcastName('');
      setNewPodcastDescription('');
      setCoverFile(null);
      fetchPodcasts();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Create Podcast Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Create New Show</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePodcast} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="podcast-name">Show Name</Label>
                  <Input id="podcast-name" value={newPodcastName} onChange={(e) => setNewPodcastName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="podcast-description">Description</Label>
                  <Textarea id="podcast-description" value={newPodcastDescription} onChange={(e) => setNewPodcastDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover-art">Cover Art</Label>
                  <Input id="cover-art" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><Plus className="mr-2 h-4 w-4" />Create Show</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Podcast List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Your Shows</CardTitle></CardHeader>
            <CardContent>
              {isLoading && <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>}
              <div className="space-y-4">
                {podcasts.length > 0 ? (
                  podcasts.map(podcast => (
                    <div key={podcast.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-50">
                      {podcast.cover_path ? (
                        <img src={`/media_uploads/${podcast.cover_path}`} alt={podcast.name} className="w-16 h-16 rounded-md object-cover bg-gray-200" />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{podcast.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{podcast.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  !isLoading && <p>You haven't created any shows yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
