import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"

export default function EpisodeAssembler({ templates, onBack, token }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [mainContentFile, setMainContentFile] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainContentFile(file);
      setOutputFilename(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !mainContentFile || !outputFilename) {
      setError("Please select a template, upload a file, and provide an output filename.");
      return;
    }
    setIsProcessing(true);
    setError('');
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
      setStatusMessage(`Step 1/2: Upload complete! Now assembling...`);
      const assembleResponse = await fetch('/api/episodes/process-and-assemble', {
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
      setStatusMessage(`Success! Episode assembled at: ${assembleResult.output_path}`);
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
      <Card>
        <CardHeader><CardTitle>Create a New Episode</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2"><Label htmlFor="template-select">1. Select a Template</Label><Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}><SelectTrigger id="template-select"><SelectValue placeholder="Choose a template..." /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="main-audio-upload">2. Upload Main Content Audio</Label><Input id="main-audio-upload" type="file" onChange={handleFileChange} accept="audio/mp3,audio/wav" /></div>
            <div className="space-y-2"><Label htmlFor="output-filename">3. Enter Output Filename</Label><Input id="output-filename" type="text" placeholder="e.g., my-awesome-episode-1" value={outputFilename} onChange={e => setOutputFilename(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Assemble Episode"}</Button>
            {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
