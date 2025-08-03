import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, Loader2, Music, Trash2, Upload } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

export default function MediaLibrary({ onBack, token }) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('music');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // To track which file is being deleted

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/media/', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch media files.');
      const data = await response.json();
      setMediaFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [token]);

  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    for (const file of uploadFiles) {
      formData.append("files", file);
    }
    try {
      const response = await fetch(`/api/media/upload/${selectedCategory}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('File upload failed.');
      await response.json();
      setUploadFiles(null);
      document.getElementById('media-upload').value = ''; // Clear file input
      fetchMedia();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    setDeletingId(mediaId);
    setError(null);
    try {
        const response = await fetch(`/api/media/${mediaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Failed to delete the file.');
        }
        // Remove the file from the local state to update the UI instantly
        setMediaFiles(prevFiles => prevFiles.filter(file => file.id !== mediaId));
    } catch (err) {
        setError(err.message);
    } finally {
        setDeletingId(null);
    }
  };

  const groupedMedia = useMemo(() => {
    return mediaFiles.reduce((acc, file) => {
      (acc[file.category] = acc[file.category] || []).push(file);
      return acc;
    }, {});
  }, [mediaFiles]);

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
      <Card className="mb-6">
        <CardHeader><CardTitle>Upload New Media</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2"><Label htmlFor="media-category">Category</Label><Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger id="media-category"><SelectValue /></SelectTrigger><SelectContent>{['intro', 'outro', 'music', 'commercial', 'sfx', 'main_content'].map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex-1 space-y-2"><Label htmlFor="media-upload">File(s)</Label><Input id="media-upload" type="file" multiple onChange={(e) => setUploadFiles(e.target.files)} /></div>
          <Button onClick={handleUpload} disabled={isUploading || !uploadFiles} className="self-end">{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}</Button>
        </CardContent>
        {error && <p className="text-sm text-red-500 mt-2 p-6 pt-0">{error}</p>}
      </Card>
      {isLoading && <p>Loading media library...</p>}
      <div className="space-y-6">
        {Object.entries(groupedMedia).map(([category, files]) => (
          <Card key={category}>
            <CardHeader><CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div className="flex items-center"><Music className="w-4 h-4 mr-3 text-gray-500" /><span className="text-sm">{file.filename.split('_').slice(1).join('_')}</span></div>
                    <Button onClick={() => handleDelete(file.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" disabled={deletingId === file.id}>
                      {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
