import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Progress } from "../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
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
} from "lucide-react"
import { useState, useRef } from "react"

export default function PodcastCreator({ onBack, token, templates, podcasts }) { // Receive podcasts
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    episodeTitle: "",
    episodeDescription: "",
    selectedTemplateId: "",
    selectedPodcastId: "", // <-- ADD THIS LINE
  })

  const steps = [
    { number: 1, title: "Add Content", icon: Mic },
    { number: 2, title: "Details & Review", icon: Settings },
    { number: 3, title: "Publish", icon: Globe },
  ]

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleFileChange = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setIsUploading(true);
    setStatusMessage('Uploading audio file...');
    setError('');

    const formData = new FormData();
    formData.append("files", file);
    formData.append("friendly_names", JSON.stringify([file.name]));

    try {
      const response = await fetch('/api/media/upload/main_content', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('File upload failed.');
      
      const result = await response.json();
      setUploadedFilename(result[0].filename);
      setStatusMessage('Upload successful!');
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePublish = async () => {
    if (!uploadedFilename || !formData.episodeTitle || !formData.selectedTemplateId || !formData.selectedPodcastId) { // <-- ADD CHECK
        setError("A show, template, title, and audio file are required.");
        return;
    }
    setIsAssembling(true);
    setStatusMessage('Assembling your episode...');
    setError('');

    try {
        const response = await fetch('/api/episodes/process-and-assemble', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: formData.selectedTemplateId,
                podcast_id: formData.selectedPodcastId, // <-- ADD THIS LINE
                main_content_filename: uploadedFilename,
                output_filename: formData.episodeTitle.toLowerCase().replace(/\s+/g, '-'),
                cleanup_options: { removePauses: true, removeFillers: true },
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Episode assembly failed.');
        }

        const result = await response.json();
        setStatusMessage(`Episode published successfully! Final file: ${result.output_path}`);
        setCurrentStep(4);
    } catch (err) {
        setError(err.message);
        setStatusMessage('');
    } finally {
        setIsAssembling(false);
    }
  };


  const canProceedToStep2 = uploadedFile && uploadedFilename;
  const canProceedToStep3 = formData.episodeTitle.trim() && formData.episodeDescription.trim() && formData.selectedTemplateId && formData.selectedPodcastId; // <-- ADD CHECK

  return (
    <div className="bg-gray-50">
      <header className="border-b border-gray-200 px-4 py-6 bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-gray-600" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: "#2C3E50" }}>Podcast Creator</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <Progress value={progressPercentage} className="h-2 mb-6" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.number} className={`flex flex-col items-center transition-all ${currentStep >= step.number ? "text-blue-600" : "text-gray-400"}`}>
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
        {currentStep === 1 && (
          <div className="space-y-8">
             <Tabs defaultValue="upload" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload" className="text-lg py-3"><Upload className="w-5 h-5 mr-2" />Upload Audio</TabsTrigger>
                <TabsTrigger value="generate" className="text-lg py-3" disabled><Wand2 className="w-5 h-5 mr-2" />Generate with AI (Coming Soon)</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-6">
                <Card className="border-2 border-dashed border-gray-200 bg-white">
                  <CardContent className="p-8">
                    <div className="border-2 border-dashed rounded-xl p-12 text-center" onDragOver={handleDragOver} onDrop={handleDrop}>
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
              </TabsContent>
            </Tabs>
            <div className="text-center pt-8">
              <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToStep2} size="lg" className="px-12 py-4 text-lg font-semibold text-white" style={{ backgroundColor: "#2C3E50" }}>
                Continue to Episode Details <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
            <div className="space-y-8">
                 <Card className="border-0 shadow-lg bg-white">
                  <CardHeader><CardTitle style={{ color: "#2C3E50" }}>Episode Information</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="podcast-select" className="text-sm font-medium text-gray-700 mb-2 block">Show *</Label>
                          <Select onValueChange={(value) => setFormData(f => ({...f, selectedPodcastId: value}))} value={formData.selectedPodcastId}>
                            <SelectTrigger id="podcast-select"><SelectValue placeholder="Choose a show..." /></SelectTrigger>
                            <SelectContent>
                              {podcasts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="template-select" className="text-sm font-medium text-gray-700 mb-2 block">Template *</Label>
                          <Select onValueChange={(value) => setFormData(f => ({...f, selectedTemplateId: value}))} value={formData.selectedTemplateId}>
                            <SelectTrigger id="template-select"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                            <SelectContent>
                              {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">Episode Title *</Label>
                      <Input id="title" placeholder="e.g., My Summer Reflections" className="text-base" value={formData.episodeTitle} onChange={(e) => setFormData({ ...formData, episodeTitle: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">Episode Description / Show Notes *</Label>
                      <Textarea id="description" placeholder="Describe what this episode is about..." className="min-h-[120px] resize-none text-base" value={formData.episodeDescription} onChange={(e) => setFormData({ ...formData, episodeDescription: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between pt-8">
                    <Button onClick={() => setCurrentStep(1)} variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
                    <Button onClick={() => setCurrentStep(3)} disabled={!canProceedToStep3} size="lg" className="px-8 py-3 text-lg font-semibold text-white" style={{ backgroundColor: "#2C3E50" }}>Continue to Publish<ArrowLeft className="w-5 h-5 ml-2 rotate-180" /></Button>
                </div>
            </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-8 text-center">
                <Card className="border-0 shadow-lg bg-white max-w-2xl mx-auto">
                    <CardHeader><CardTitle style={{ color: "#2C3E50" }}>Ready to Publish?</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p>Your episode "{formData.episodeTitle}" is ready to be assembled and published.</p>
                        {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </CardContent>
                </Card>
                <div className="flex justify-center gap-4 pt-8">
                    <Button onClick={() => setCurrentStep(2)} variant="outline" size="lg" className="px-8 py-3 text-lg bg-transparent"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
                    <Button onClick={handlePublish} size="lg" className="px-12 py-4 text-xl font-semibold text-white" style={{ backgroundColor: "#2C3E50" }} disabled={isAssembling}>
                        {isAssembling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Assembling...</> : "🚀 Publish Episode"}
                    </Button>
                </div>
            </div>
        )}

        {currentStep === 4 && (
             <div className="text-center space-y-6">
                <CheckCircle className="w-24 h-24 mx-auto text-green-500" />
                <h2 className="text-3xl font-bold" style={{ color: "#2C3E50" }}>Episode Published!</h2>
                <p className="text-lg text-gray-600">{statusMessage}</p>
                <Button onClick={onBack} size="lg">Back to Dashboard</Button>
             </div>
        )}
      </main>
    </div>
  );
}
