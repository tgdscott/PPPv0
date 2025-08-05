import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Loader2,
  GripVertical,
  FileText,
  Mic,
  Music,
  Bot,
  Settings2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// --- Helper Functions & Constants ---
const msToSeconds = (ms) => (ms || 0) / 1000;
const secondsToMs = (s) => parseFloat(s || 0) * 1000;
const DEFAULT_VOICE_ID = "19B4gjtpL5m876wS3Dfg"; // A default voice for TTS/AI

// --- UI Components ---
const segmentIcons = {
    intro: <Music className="w-5 h-5 text-blue-500" />,
    outro: <Music className="w-5 h-5 text-purple-500" />,
    content: <FileText className="w-5 h-5 text-green-500" />,
    commercial: <Mic className="w-5 h-5 text-orange-500" />,
};

const sourceIcons = {
    static: <FileText className="w-4 h-4 mr-2" />,
    ai_generated: <Bot className="w-4 h-4 mr-2" />,
    tts: <Mic className="w-4 h-4 mr-2" />,
};

const AddSegmentButton = ({ type, onClick, disabled }) => (
    <Button 
        variant="outline" 
        className="flex flex-col h-24 justify-center items-center gap-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-50"
        onClick={() => onClick(type)}
        disabled={disabled}
    >
        {segmentIcons[type]}
        <span className="text-sm font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </Button>
);

// --- Main Template Editor Component ---
export default function TemplateEditor({ templateId, onBack, token, onTemplateSaved }) {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const isNewTemplate = templateId === 'new';

  // --- Memoized lists for filtered media files ---
  const introFiles = useMemo(() => mediaFiles.filter(mf => mf.category === 'intro'), [mediaFiles]);
  const outroFiles = useMemo(() => mediaFiles.filter(mf => mf.category === 'outro'), [mediaFiles]);
  const musicFiles = useMemo(() => mediaFiles.filter(mf => mf.category === 'music'), [mediaFiles]);
  const commercialFiles = useMemo(() => mediaFiles.filter(mf => mf.category === 'commercial'), [mediaFiles]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const mediaResponse = await fetch('/api/media/', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!mediaResponse.ok) throw new Error('Failed to fetch media files');
        const mediaData = await mediaResponse.json();
        setMediaFiles(mediaData);

        if (isNewTemplate) {
          setTemplate({
            name: 'My New Podcast Template',
            segments: [
                { id: crypto.randomUUID(), segment_type: 'intro', source: { source_type: 'static', filename: '' } },
                { id: crypto.randomUUID(), segment_type: 'content', source: { source_type: 'tts', script: 'Placeholder for main content.', voice_id: DEFAULT_VOICE_ID } },
                { id: crypto.randomUUID(), segment_type: 'outro', source: { source_type: 'static', filename: '' } },
            ],
            background_music_rules: [],
            timing: { content_start_offset_s: 0, outro_start_offset_s: 0 },
          });
        } else {
          const templateResponse = await fetch(`/api/templates/${templateId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (!templateResponse.ok) throw new Error('Failed to fetch template details');
          const templateData = await templateResponse.json();
          setTemplate(templateData);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [templateId, token, isNewTemplate]);

  // --- State Handlers ---
  const handleTemplateChange = (field, value) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const handleTimingChange = (field, valueInSeconds) => {
    const newTiming = { ...template.timing, [field]: valueInSeconds };
    setTemplate(prev => ({ ...prev, timing: newTiming }));
  };

  const handleBackgroundMusicChange = (index, field, value) => {
    const newRules = [...template.background_music_rules];
    newRules[index][field] = value;
    setTemplate(prev => ({ ...prev, background_music_rules: newRules }));
  };

  const addBackgroundMusicRule = () => {
    const newRule = { id: crypto.randomUUID(), apply_to_segments: ['content'], music_filename: '', start_offset_s: 0, end_offset_s: 0, fade_in_s: 2, fade_out_s: 3, volume_db: -15 };
    setTemplate(prev => ({ ...prev, background_music_rules: [...(prev.background_music_rules || []), newRule] }));
  };

  const removeBackgroundMusicRule = (index) => {
    const newRules = [...template.background_music_rules];
    newRules.splice(index, 1);
    setTemplate(prev => ({ ...prev, background_music_rules: newRules }));
  };

  const handleSegmentChange = (segmentId, field, value) => {
    setTemplate(prev => ({
      ...prev,
      segments: prev.segments.map(seg =>
        seg.id === segmentId ? { ...seg, [field]: value } : seg
      )
    }));
  };
  
  const handleSourceChange = (segmentId, source) => {
     setTemplate(prev => ({
      ...prev,
      segments: prev.segments.map(seg =>
        seg.id === segmentId ? { ...seg, source } : seg
      )
    }));
  };

  const addSegment = (type) => {
    const newSegment = {
      id: crypto.randomUUID(),
      segment_type: type,
      source: { source_type: 'static', filename: '' },
    };
    const segments = [...template.segments];
    const contentIndex = segments.findIndex(s => s.segment_type === 'content');
    
    if (type === 'intro') {
        segments.splice(contentIndex !== -1 ? contentIndex : 0, 0, newSegment);
    } else if (type === 'outro') {
        segments.push(newSegment);
    } else { // commercials
        segments.splice(contentIndex !== -1 ? contentIndex + 1 : segments.length, 0, newSegment);
    }
    setTemplate(prev => ({ ...prev, segments }));
  };

  const deleteSegment = (segmentId) => {
    setTemplate(prev => ({...prev, segments: prev.segments.filter(seg => seg.id !== segmentId)}));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(template.segments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Enforce structure rules
    const contentIndex = items.findIndex(item => item.segment_type === 'content');
    const firstOutroIndex = items.findIndex(item => item.segment_type === 'outro');

    if (contentIndex !== -1) {
        // Rule: Intros must be before content
        if (reorderedItem.segment_type === 'intro' && result.destination.index > contentIndex) return;
        // Rule: Content cannot be dragged before an intro
        if (reorderedItem.segment_type === 'content' && items.some((item, index) => item.segment_type === 'intro' && index > result.destination.index)) return;
    }
    if (firstOutroIndex !== -1) {
        // Rule: Outros must be after content
        if (reorderedItem.segment_type === 'outro' && contentIndex !== -1 && result.destination.index < contentIndex) return;
        // Rule: Content cannot be dragged after an outro
        if (reorderedItem.segment_type === 'content' && result.destination.index > firstOutroIndex) return;
    }

    setTemplate(prev => ({ ...prev, segments: items }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const url = isNewTemplate ? '/api/templates/' : `/api/templates/${templateId}`;
      const method = isNewTemplate ? 'POST' : 'PUT';
      const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(template) });
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

  // --- Render Logic ---
  if (isLoading) return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;
  if (!template) return null;

  const hasContentSegment = template.segments.some(s => s.segment_type === 'content');

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex justify-between items-center">
            <Button onClick={onBack} variant="ghost" className="text-gray-700"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <h1 className="text-2xl font-bold text-gray-800">Template Editor</h1>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Template</> }
            </Button>
        </div>

        <Card className="shadow-sm"><CardContent className="p-6">
            <Label htmlFor="template-name" className="text-sm font-medium text-gray-600">Template Name</Label>
            <Input id="template-name" className="text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-blue-500 transition-colors p-0" value={template.name || ''} onChange={(e) => handleTemplateChange('name', e.target.value)} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Add Segments</CardTitle><CardDescription>Add the building blocks for your episode.</CardDescription></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AddSegmentButton type="intro" onClick={addSegment} />
            <AddSegmentButton type="content" onClick={addSegment} disabled={hasContentSegment} />
            <AddSegmentButton type="outro" onClick={addSegment} />
            <AddSegmentButton type="commercial" onClick={addSegment} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Episode Structure</CardTitle><CardDescription>Drag and drop segments to reorder them.</CardDescription></CardHeader><CardContent>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="segments">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {template.segments.map((segment, index) => (
                            <Draggable key={segment.id} draggableId={segment.id} index={index} isDragDisabled={segment.segment_type === 'content'}>
                                {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <SegmentEditor segment={segment} onDelete={() => deleteSegment(segment.id)} onSourceChange={handleSourceChange} mediaFiles={{intro: introFiles, outro: outroFiles, commercial: commercialFiles}} isDragging={snapshot.isDragging}/>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="w-6 h-6 text-gray-600"/> Advanced Settings</CardTitle><CardDescription>Fine-tune the timing and background music for your podcast.</CardDescription></CardHeader><CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Content Start Delay (seconds)</Label>
                    <Input type="number" step="0.5" value={template.timing?.content_start_offset_s} onChange={(e) => handleTimingChange('content_start_offset_s', parseFloat(e.target.value || 0))} />
                    <p className="text-xs text-gray-500 mt-1">Delay before the main content starts after the intro ends.</p>
                </div>
                <div>
                    <Label>Outro Start Delay (seconds)</Label>
                    <Input type="number" step="0.5" value={template.timing?.outro_start_offset_s} onChange={(e) => handleTimingChange('outro_start_offset_s', parseFloat(e.target.value || 0))} />
                    <p className="text-xs text-gray-500 mt-1">Delay before the outro starts after the main content ends.</p>
                </div>
            </div>
            <div><h4 className="text-lg font-semibold mb-2">Background Music</h4><div className="space-y-4">
                {(template.background_music_rules || []).map((rule, index) => (
                    <div key={rule.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold">Music Rule #{index + 1}</Label>
                            <Button variant="destructive" size="sm" onClick={() => removeBackgroundMusicRule(index)}><Trash2 className="w-4 h-4 mr-2"/>Remove</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Apply to Section</Label><Select value={rule.apply_to_segments[0]} onValueChange={(v) => handleBackgroundMusicChange(index, 'apply_to_segments', [v])}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                                <SelectItem value="intro">Intro Section</SelectItem>
                                <SelectItem value="content">Content Section</SelectItem>
                                <SelectItem value="outro">Outro Section</SelectItem>
                            </SelectContent></Select></div>
                            <div><Label>Music File</Label><Select value={rule.music_filename} onValueChange={(v) => handleBackgroundMusicChange(index, 'music_filename', v)}><SelectTrigger><SelectValue placeholder="Select music..." /></SelectTrigger><SelectContent>{musicFiles.map(f => <SelectItem key={f.id} value={f.filename}>{f.friendly_name || f.filename.split('_').slice(1).join('_')}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><Label>Start Offset (sec)</Label><Input type="number" step="0.5" value={rule.start_offset_s} onChange={(e) => handleBackgroundMusicChange(index, 'start_offset_s', parseFloat(e.target.value || 0))} /></div>
                            <div><Label>End Offset (sec)</Label><Input type="number" step="0.5" value={rule.end_offset_s} onChange={(e) => handleBackgroundMusicChange(index, 'end_offset_s', parseFloat(e.target.value || 0))} /></div>
                            <div><Label>Fade In (sec)</Label><Input type="number" step="0.5" value={rule.fade_in_s} onChange={(e) => handleBackgroundMusicChange(index, 'fade_in_s', parseFloat(e.target.value || 0))} /></div>
                            <div><Label>Fade Out (sec)</Label><Input type="number" step="0.5" value={rule.fade_out_s} onChange={(e) => handleBackgroundMusicChange(index, 'fade_out_s', parseFloat(e.target.value || 0))} /></div>
                        </div>
                    </div>
                ))}
            </div><Button onClick={addBackgroundMusicRule} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2"/>Add Music Rule</Button></div>
        </CardContent></Card>

        <div className="flex justify-end items-center mt-6">
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Template</> }
            </Button>
        </div>
    </div>
  );
}

const SegmentEditor = ({ segment, onDelete, onSourceChange, mediaFiles, isDragging }) => {
    const filesForType = mediaFiles[segment.segment_type] || [];

    const handleSourceChangeLocal = (field, value) => {
        const newSource = { ...segment.source, [field]: value };
        // When changing source type, reset relevant fields
        if (field === 'source_type') {
            if (value === 'static') {
                newSource.prompt = undefined;
                newSource.script = undefined;
            } else if (value === 'ai_generated') {
                newSource.filename = undefined;
                newSource.script = undefined;
            }
        }
        onSourceChange(segment.id, newSource);
    };

    if (segment.segment_type === 'content') {
        return (
            <Card className={`transition-shadow ${isDragging ? 'shadow-2xl scale-105' : 'shadow-md'} border-green-500 border-2`}>
                <CardHeader className="flex flex-row items-center justify-between p-4 bg-green-100">
                    <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        {segmentIcons.content}
                        <span className="font-semibold text-green-800">Main Content</span>
                    </div>
                    <p className="text-sm text-gray-600">Cannot be deleted</p>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-gray-600 italic">The main content for your episode will be added here during episode creation. This block serves as a placeholder for its position in the template.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`transition-shadow ${isDragging ? 'shadow-2xl scale-105' : 'shadow-md'}`}>
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-gray-100 border-b">
                <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    {segmentIcons[segment.segment_type]}
                    <span className="font-semibold text-gray-800">{segment.segment_type.charAt(0).toUpperCase() + segment.segment_type.slice(1)}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:bg-red-100 hover:text-red-700 w-8 h-8"><Trash2 className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div>
                    <Label className="text-sm font-medium text-gray-600">Source Type</Label>
                    <Select value={segment.source.source_type} onValueChange={(v) => handleSourceChangeLocal('source_type', v)}>
                        <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select source type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="static">{sourceIcons.static} Static Audio File</SelectItem>
                            <SelectItem value="ai_generated">{sourceIcons.ai_generated} AI Generated Audio</SelectItem>
                            <SelectItem value="tts">{sourceIcons.tts} Text-to-Speech</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    {segment.source.source_type === 'static' && (
                        <div>
                            <Label>Audio File</Label>
                            <Select value={segment.source.filename} onValueChange={(v) => handleSourceChangeLocal('filename', v)}>
                                <SelectTrigger className="w-full mt-1"><SelectValue placeholder={`Select a ${segment.segment_type} file...`} /></SelectTrigger>
                                <SelectContent>{filesForType.map(mf => <SelectItem key={mf.id} value={mf.filename}>{mf.friendly_name || mf.filename.split('_').slice(1).join('_')}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    )}
                    {segment.source.source_type === 'ai_generated' && (
                        <div>
                            <Label>AI Prompt</Label>
                            <Textarea placeholder="e.g., A 30-second upbeat intro with a synth melody..." value={segment.source.prompt || ''} onChange={(e) => handleSourceChangeLocal('prompt', e.target.value)} className="mt-1" />
                        </div>
                    )}
                    {segment.source.source_type === 'tts' && (
                        <div>
                            <Label>Script</Label>
                            <Textarea placeholder="e.g., Welcome to the Podcast Plus show..." value={segment.source.script || ''} onChange={(e) => handleSourceChangeLocal('script', e.target.value)} className="mt-1" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}