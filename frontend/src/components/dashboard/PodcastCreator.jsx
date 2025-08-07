import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Progress } from "../ui/progress"
import { toast } from "../../hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  FileAudio,
  Wand2,
  CheckCircle,
  Mic,
  Settings,
  Globe,
  Loader2,
  BookText,
  FileUp,
  FileImage,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function PodcastCreator({ onBack, token, templates, podcasts }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedFilename, setUploadedFilename] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAssembling, setIsAssembling] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [ttsValues, setTtsValues] = useState({})
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [episodeDetails, setEpisodeDetails] = useState({
    season: '1',
    episodeNumber: '',
    title: '',
    description: '',
    coverArt: null,
    coverArtPreview: null,
  })

  const [jobId, setJobId] = useState(null);
  const [spreakerShows, setSpreakerShows] = useState([]);
  const [selectedSpreakerShow, setSelectedSpreakerShow] = useState(null);

  const fileInputRef = useRef(null)
  const coverArtInputRef = useRef(null)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch media library');
        const data = await response.json();
        setMediaLibrary(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMedia();
    fetchSpreakerShows(); // Fetch Spreaker shows on mount
  }, [token]);

  const fetchSpreakerShows = async () => {
    try {
      const response = await fetch('/api/spreaker/shows', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Spreaker Not Authenticated",
            description: "Please connect your Spreaker account in settings.",
            variant: "destructive",
          });
        }
        throw new Error('Failed to fetch Spreaker shows.');
      }
      const data = await response.json();
      setSpreakerShows(data.shows);
      if (data.shows.length > 0) {
        setSelectedSpreakerShow(data.shows[0].show_id);
      }
    } catch (err) {
      toast({
        title: "Error fetching Spreaker shows",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/episodes/status/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          // Stop polling if the job is not found or there's a server error
          clearInterval(interval);
          setError('Could not retrieve episode status.');
          return;
        }
        const data = await response.json();
        setStatusMessage(data.status);

        if (data.status === 'processed' || data.status === 'error') {
          clearInterval(interval);
          setIsAssembling(false);
          if (data.status === 'processed') {
            setCurrentStep(6); // Success step
            setStatusMessage('Episode assembly has been queued.'); // Corrected message
            toast({ title: "Success!", description: "Your episode has been assembled and queued for publishing." });
          } else {
            setError(data.error || 'An error occurred during processing.');
            toast({ variant: "destructive", title: "Error", description: data.error || 'An error occurred during processing.' });
          }
        }
      } catch (err) {
        clearInterval(interval);
        setError('Failed to poll for job status.');
        setIsAssembling(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [jobId, token]);

  const steps = [
    { number: 1, title: "Select Template", icon: BookText },
    { number: 2, title: "Upload Content", icon: FileUp },
    { number: 3, title: "Assemble Episode", icon: Wand2 },
    { number: 4, title: "Episode Details", icon: Settings },
    { number: 5, title: "Publishing", icon: Globe },
    { number: 6, title: "Done!", icon: CheckCircle },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  const handleFileChange = async (file) => {
    if (!file) return
    setUploadedFile(file)
    setIsUploading(true)
    setStatusMessage('Uploading audio file...')
    setError('')

    const formData = new FormData()
    formData.append("files", file)
    formData.append("friendly_names", JSON.stringify([file.name]))

    try {
      const response = await fetch('/api/media/upload/main_content', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) throw new Error('File upload failed.')
      
      const result = await response.json()
      setUploadedFilename(result[0].filename)
      setStatusMessage('Upload successful!')
      setCurrentStep(3)
    } catch (err) {
      setError(err.message)
      setStatusMessage('')
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCoverArtChange = (file) => {
    if (file) {
      setEpisodeDetails(prev => ({ ...prev, coverArt: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setEpisodeDetails(prev => ({ ...prev, coverArtPreview: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTtsChange = (promptId, value) => {
    setTtsValues(prev => ({ ...prev, [promptId]: value }))
  }

  const handleDetailsChange = (field, value) => {
    setEpisodeDetails(prev => ({ ...prev, [field]: value }))
  }

  const handlePublish = async () => {
    if (!uploadedFilename || !selectedTemplate || !episodeDetails.title) {
        setError("A template, title, and audio file are required.");
        return;
    }
    setIsAssembling(true);
    setStatusMessage('Assembling your episode...');
    setError('');

    try {
        const response = await fetch('/api/episodes/assemble', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                template_id: selectedTemplate.id,
                main_content_filename: uploadedFilename,
                output_filename: episodeDetails.title.toLowerCase().replace(/\s+/g, '-'),
                tts_values: ttsValues,
                episode_details: episodeDetails,
                spreaker_show_id: selectedSpreakerShow,
                auto_published_at: episodeDetails.publishDate && episodeDetails.publishTime ? `${episodeDetails.publishDate}T${episodeDetails.publishTime}:00Z` : null,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to assemble episode.');
        }

        const result = await response.json();
        setJobId(result.job_id);
        setStatusMessage(`Episode assembly has been queued. Job ID: ${result.job_id}`);
        setCurrentStep(5); // Stay on the publish step to show progress
    } catch (err) {
        setError(err.message);
        setStatusMessage('');
        setIsAssembling(false);
    }
  };

  

  const canProceedToStep5 = episodeDetails.title.trim() && episodeDetails.season.trim() && episodeDetails.episodeNumber.trim()

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Select Template
        return (
          <div className="space-y-8">
            <CardHeader className="text-center"><CardTitle style={{ color: "#2C3E50" }}>Step 1: Choose a Template</CardTitle></CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleTemplateSelect(template)}>
                  <CardContent className="p-6 text-center space-y-4">
                    <BookText className="w-12 h-12 mx-auto text-blue-600" />
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <p className="text-gray-500 text-sm">{template.description || "No description available."}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      case 2: // Upload Content
        return (
          <div className="space-y-8">
            <CardHeader className="text-center"><CardTitle style={{ color: "#2C3E50" }}>Step 2: Upload Main Content</CardTitle></CardHeader>
            <Card className="border-2 border-dashed border-gray-200 bg-white">
              <CardContent className="p-8">
                <div className="border-2 border-dashed rounded-xl p-12 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0])}}>
                  {uploadedFile ? (
                    <div className="space-y-6">
                      <FileAudio className="w-16 h-16 mx-auto text-green-600" />
                      <p className="text-xl font-semibold text-green-600">File Ready!</p>
                      <p className="text-gray-600">{uploadedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Mic className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-2xl font-semibold text-gray-700">Drag your audio file here</p>
                      <p className="text-gray-500">or</p>
                      <Button onClick={() => fileInputRef.current?.click()} size="lg" className="text-white" style={{ backgroundColor: "#2C3E50" }} disabled={isUploading}>
                        {isUploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5 mr-2" /> Choose Audio File</>}
                      </Button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                </div>
              </CardContent>
            </Card>
             <div className="flex justify-start pt-8">
                <Button onClick={() => setCurrentStep(1)} variant="outline" size="lg"><ArrowLeft className="w-5 h-5 mr-2" />Back to Templates</Button>
            </div>
          </div>
        )
      case 3: { // Assemble Episode
        const getSegmentContent = (segment) => {
          if (segment.segment_type === 'content') {
            return (
              <div className="mt-2 bg-blue-50 p-3 rounded-md">
                <p className="font-semibold text-blue-800">Your Uploaded Audio:</p>
                <p className="text-gray-700">{uploadedFile?.name || 'No file uploaded'}</p>
              </div>
            );
          }

          if (segment.source.source_type === 'tts') {
            return (
              <div className="mt-4">
                <Label htmlFor={segment.id} className="text-sm font-medium text-gray-700 mb-2 block">
                  {segment.source.text_prompt || 'TTS Script'}
                </Label>
                <Textarea
                  id={segment.id}
                  placeholder="Enter text to be converted to speech..."
                  className="min-h-[100px] resize-none text-base bg-white"
                  value={ttsValues[segment.id] || ''}
                  onChange={(e) => handleTtsChange(segment.id, e.target.value)}
                />
              </div>
            );
          }

          if (segment.source.source_type === 'static') {
            const mediaItem = mediaLibrary.find(item => item.filename.endsWith(segment.source.filename));
            const friendlyName = mediaItem ? mediaItem.friendly_name : segment.source.filename;
            return (
              <p className="text-gray-600 mt-2">
                <span className="font-semibold text-gray-700">Audio File:</span> {friendlyName}
              </p>
            );
          }

          return <p className="text-red-500 mt-2">Unknown segment source type</p>;
        };

        return (
          <div className="space-y-8">
            <CardHeader className="text-center">
              <CardTitle style={{ color: "#2C3E50" }}>Step 3: Assemble Your Episode</CardTitle>
              <p className="text-md text-gray-500 pt-2">Review the structure and fill in the required text for any AI-generated segments.</p>
            </CardHeader>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6 space-y-4">
                {selectedTemplate && selectedTemplate.segments ? (
                  selectedTemplate.segments.map((segment, index) => (
                    <div key={segment.id || index} className="p-4 rounded-md bg-gray-50 border border-gray-200">
                      <h4 className="font-semibold text-lg text-gray-800 capitalize">
                        {segment.segment_type.replace('_', ' ')}
                      </h4>
                      {getSegmentContent(segment)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-gray-600">This template has no segments to display.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between pt-8">
              <Button onClick={() => setCurrentStep(2)} variant="outline" size="lg"><ArrowLeft className="w-5 h-5 mr-2" />Back to Upload</Button>
              <Button onClick={() => setCurrentStep(4)} size="lg" className="px-8 py-3 text-lg font-semibold text-white" style={{ backgroundColor: "#2C3E50" }}>Continue to Details<ArrowLeft className="w-5 h-5 ml-2 rotate-180" /></Button>
            </div>
          </div>
        );
      }
      case 4: // Episode Details
        return (
          <div className="space-y-8">
            <CardHeader className="text-center"><CardTitle style={{ color: "#2C3E50" }}>Step 4: Episode Details</CardTitle></CardHeader>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Episode Title *</Label>
                    <Input id="title" placeholder="e.g., The Future of AI" value={episodeDetails.title} onChange={(e) => handleDetailsChange('title', e.target.value)} />
                  </div>
                   <div>
                      <Label htmlFor="podcast-select">Show *</Label>
                      <p className="text-sm text-gray-500"> (Coming soon)</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="season">Season Number *</Label>
                    <Input id="season" type="number" placeholder="e.g., 1" value={episodeDetails.season} onChange={(e) => handleDetailsChange('season', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="episodeNumber">Episode Number *</Label>
                    <Input id="episodeNumber" type="number" placeholder="e.g., 12" value={episodeDetails.episodeNumber} onChange={(e) => handleDetailsChange('episodeNumber', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Episode Cover Art</Label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      {episodeDetails.coverArtPreview ? <img src={episodeDetails.coverArtPreview} alt="Cover art preview" className="w-full h-full object-cover rounded-lg" /> : <FileImage className="w-12 h-12 text-gray-400" />}
                    </div>
                    <Button onClick={() => coverArtInputRef.current?.click()} variant="outline">
                      <Upload className="w-4 h-4 mr-2" /> Upload Image
                    </Button>
                    <input ref={coverArtInputRef} type="file" accept="image/*" onChange={(e) => handleCoverArtChange(e.target.files[0])} className="hidden" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Episode Description / Show Notes</Label>
                  <Textarea id="description" placeholder="Describe what this episode is about..." className="min-h-[120px]" value={episodeDetails.description} onChange={(e) => handleDetailsChange('description', e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between pt-8">
              <Button onClick={() => setCurrentStep(3)} variant="outline" size="lg"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
              <Button onClick={() => setCurrentStep(5)} disabled={!canProceedToStep5} size="lg" className="px-8 py-3 text-lg font-semibold text-white" style={{ backgroundColor: "#2C3E50" }}>Continue to Publish<ArrowLeft className="w-5 h-5 ml-2 rotate-180" /></Button>
            </div>
          </div>
        )
      case 5: // Publishing
        return (
          <div className="space-y-8">
            <CardHeader className="text-center"><CardTitle style={{ color: "#2C3E50" }}>Step 5: Publishing</CardTitle></CardHeader>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6 space-y-6">
                
                {spreakerShows.length > 0 && (
                  <div className="space-y-4">
                    <Label htmlFor="spreaker-show">Select a show to publish to:</Label>
                    <Select onValueChange={setSelectedSpreakerShow}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a show..." />
                      </SelectTrigger>
                      <SelectContent>
                        {spreakerShows.map(show => (
                          <SelectItem key={show.show_id} value={show.show_id}>{show.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>


                    <Button onClick={handlePublish} size="lg" className="w-full px-12 py-4 text-xl font-semibold text-white" style={{ backgroundColor: "#2C3E50" }} disabled={isAssembling || !selectedSpreakerShow}>
                      {isAssembling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Assembling...</> : "🚀 Publish to Spreaker"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between pt-8">
              <Button onClick={() => setCurrentStep(4)} variant="outline" size="lg"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
              <Button onClick={() => setCurrentStep(6)} size="lg" className="px-8 py-3 text-lg font-semibold text-white" style={{ backgroundColor: "#2C3E50" }}>Continue to Done!<ArrowLeft className="w-5 h-5 ml-2 rotate-180" /></Button>
            </div>
          </div>
        );
       case 6: // Success
        return (
             <div className="text-center space-y-6">
                <CheckCircle className="w-24 h-24 mx-auto text-green-500" />
                <h2 className="text-3xl font-bold" style={{ color: "#2C3E50" }}>Episode Queued for Publishing!</h2>
                <p className="text-lg text-gray-600">{statusMessage}</p>
                <Button onClick={onBack} size="lg">Back to Dashboard</Button>
             </div>
        );
      default:
        return <div>Invalid Step</div>
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="border-b border-gray-200 px-4 py-6 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-gray-600" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: "#2C3E50" }}>Podcast Creator</h1>
            <div className="w-48 text-right">
                {selectedTemplate && <span className="text-sm text-gray-500">Template: {selectedTemplate.name}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <Progress value={progressPercentage} className="h-2 mb-6" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.number} className={`flex flex-col items-center transition-all w-40 text-center ${currentStep >= step.number ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${currentStep >= step.number ? "text-white shadow-lg" : "bg-gray-100 text-gray-400"}`} style={{ backgroundColor: currentStep >= step.number ? "#2C3E50" : undefined }}>
                  {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                </div>
                <div className="font-semibold text-sm">{step.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {renderStepContent()}
      </main>
    </div>
  )
}