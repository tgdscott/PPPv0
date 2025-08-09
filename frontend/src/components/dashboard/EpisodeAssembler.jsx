import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function EpisodeAssembler({ templates, onBack, token }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [mainContentFile, setMainContentFile] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [assembledEpisode, setAssembledEpisode] = useState(null);
  const [spreakerShows, setSpreakerShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchSpreakerShows = async () => {
      try {
        const response = await fetch('/api/spreaker/shows', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSpreakerShows(data.shows || []);
        }
      } catch (err) {
        console.error("Failed to fetch Spreaker shows:", err);
      }
    };

    if (token) {
      fetchSpreakerShows();
    }
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainContentFile(file);
      setOutputFilename(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAssembly = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !mainContentFile || !outputFilename) {
      setError("Please select a template, upload a file, and provide an output filename.");
      return;
    }
    setIsProcessing(true);
    setError('');
    setAssembledEpisode(null);
    setStatusMessage('Step 1/2: Uploading main content audio...');
    const formData = new FormData();
    formData.append("files", mainContentFile);
    try {
      const uploadResponse = await fetch('/api/media/upload/main_content', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!uploadResponse.ok) throw new Error('File upload failed.');
      const uploadResult = await uploadResponse.json();
      const uploadedFilename = uploadResult[0].filename;
      setStatusMessage(`Step 2/2: Assembling episode... This may take a moment.`);
      const assembleResponse = await fetch('/api/episodes/assemble', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          main_content_filename: uploadedFilename,
          output_filename: outputFilename,
          cleanup_options: { removePauses: true, removeFillers: true },
        }),
      });
      if (!assembleResponse.ok) {
        const errData = await assembleResponse.json();
        throw new Error(errData.detail || 'Episode assembly failed.');
      }
      const assembleResult = await assembleResponse.json();
      setStatusMessage(`Success! Episode assembled.`);
      setAssembledEpisode(assembleResult);
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!assembledEpisode || !selectedShowId) {
      setError("No assembled episode or show selected for publishing.");
      return;
    }
    setIsPublishing(true);
    setError('');
    setStatusMessage('Publishing to Spreaker...');
    try {
      const response = await fetch('/api/spreaker/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: selectedShowId,
          title: outputFilename, // Assuming output filename is the title
          filename: assembledEpisode.output_path.split('/').pop(), // Extract filename from path
          description: "Uploaded via Podcast Pro Plus",
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to publish to Spreaker.');
      }
      const result = await response.json();
      setStatusMessage(`Successfully published to Spreaker! Details: ${result.details}`);
      setAssembledEpisode(null); // Clear the episode after successful publish
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
      <Card>
        <CardHeader><CardTitle>Create & Publish Episode</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {!assembledEpisode ? (
            <form onSubmit={handleAssembly} className="space-y-6">
              <div className="space-y-2"><Label htmlFor="template-select">1. Select a Template</Label><Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}><SelectTrigger id="template-select"><SelectValue placeholder="Choose a template..." /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="main-audio-upload">2. Upload Main Content Audio</Label><Input id="main-audio-upload" type="file" onChange={handleFileChange} accept="audio/mp3,audio/wav" disabled={isProcessing} /></div>
              <div className="space-y-2"><Label htmlFor="output-filename">3. Enter Episode Title</Label><Input id="output-filename" type="text" placeholder="e.g., My Awesome Episode 1" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} disabled={isProcessing} /></div>
              <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assembling...</> : "Assemble Episode"}</Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 text-center bg-green-100 text-green-800 rounded-md">
                <h3 className="font-bold">Assembly Complete!</h3>
                <p>Final file: <strong>{assembledEpisode.output_path}</strong></p>
              </div>
              <div className="space-y-2"><Label htmlFor="show-select">4. Select Spreaker Show</Label><Select onValueChange={setSelectedShowId} value={selectedShowId}><SelectTrigger id="show-select"><SelectValue placeholder="Choose a show to publish to..." /></SelectTrigger><SelectContent>{spreakerShows.length > 0 ? spreakerShows.map(s => <SelectItem key={s.show_id} value={s.show_id}>{s.title}</SelectItem>) : <SelectItem value="" disabled>No shows found or loaded.</SelectItem>}</SelectContent></Select></div>
              <Button onClick={handlePublish} className="w-full" disabled={isPublishing || !selectedShowId}>{isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish to Spreaker"}</Button>
            </div>
          )}
          {statusMessage && <p className="text-sm text-center p-2 rounded-md bg-blue-100 text-blue-800">{statusMessage}</p>}
          {error && <p className="text-sm text-center p-2 rounded-md bg-red-100 text-red-800">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};
