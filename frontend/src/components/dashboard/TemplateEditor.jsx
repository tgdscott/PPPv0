import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import {
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Loader2,
  FileAudio,
  BrainCircuit,
  Mic
} from "lucide-react"
import { useState, useEffect } from "react"

export default function TemplateEditor({ templateId, onBack, token, onTemplateSaved }) {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!templateId || !token) return;
      setIsLoading(true);
      try {
        const [templateResponse, mediaResponse] = await Promise.all([
          fetch(`/api/templates/${templateId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/media/', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!templateResponse.ok) throw new Error('Failed to fetch template details');
        if (!mediaResponse.ok) throw new Error('Failed to fetch media files');

        const templateData = await templateResponse.json();
        const mediaData = await mediaResponse.json();
        
        setTemplate(templateData);
        setMediaFiles(mediaData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [templateId, token]);

  const handleTemplateChange = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleSegmentChange = (segmentId, field, value) => {
    setTemplate(prev => ({
      ...prev,
      segments: prev.segments.map(seg => 
        seg.id === segmentId ? { ...seg, [field]: value } : seg
      )
    }));
  };
  
  const handleSourceChange = (segmentId, sourceField, value) => {
     setTemplate(prev => ({
      ...prev,
      segments: prev.segments.map(seg => 
        seg.id === segmentId ? { ...seg, source: { ...seg.source, [sourceField]: value } } : seg
      )
    }));
  };

  const addSegment = () => {
    const newSegment = {
      id: crypto.randomUUID(),
      segment_type: 'content',
      source: {
        source_type: 'static',
        filename: ''
      }
    };
    setTemplate(prev => ({ ...prev, segments: [...prev.segments, newSegment] }));
  };
  
  const deleteSegment = (segmentId) => {
    setTemplate(prev => ({...prev, segments: prev.segments.filter(seg => seg.id !== segmentId)}));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save template.');
      }
      onTemplateSaved();
      onBack();
    } catch(err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSegmentEditor = (segment) => {
    return (
      <Card key={segment.id} className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
               <div className="flex items-center gap-4">
                <Select value={segment.segment_type} onValueChange={(value) => handleSegmentChange(segment.id, 'segment_type', value)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{['intro', 'outro', 'commercial', 'content'].map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={segment.source.source_type} onValueChange={(value) => handleSourceChange(segment.id, 'source_type', value)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{['static', 'ai_generated', 'tts'].map(type => <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                {segment.source.source_type === 'static' && (
                  <Select value={segment.source.filename} onValueChange={(value) => handleSourceChange(segment.id, 'filename', value)}>
                    <SelectTrigger><SelectValue placeholder="Select a media file..." /></SelectTrigger>
                    <SelectContent>{mediaFiles.map(mf => <SelectItem key={mf.id} value={mf.filename}>{mf.filename.split('_').slice(1).join('_')}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                {segment.source.source_type === 'ai_generated' && (
                  <Textarea placeholder="Enter AI prompt..." value={segment.source.prompt} onChange={(e) => handleSourceChange(segment.id, 'prompt', e.target.value)} />
                )}
                {segment.source.source_type === 'tts' && (
                  <Textarea placeholder="Enter text-to-speech script..." value={segment.source.script} onChange={(e) => handleSourceChange(segment.id, 'script', e.target.value)} />
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="ml-4 text-red-500 hover:text-red-700" onClick={() => deleteSegment(segment.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={onBack} variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</> }</Button>
      </div>
      <Card>
        <CardHeader>
            {isLoading ? <CardTitle>Loading...</CardTitle> : 
            <Input className="text-2xl font-bold" value={template?.name || ''} onChange={(e) => handleTemplateChange('name', e.target.value)} />
            }
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading template details...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {template && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Segments</h3>
              {template.segments.map(renderSegmentEditor)}
              <Button onClick={addSegment} variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" />Add Segment</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
