import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from 'lucide-react';

const WizardStep = ({ children }) => <div className="py-4">{children}</div>;

const NewUserWizard = ({ open, onOpenChange, token, onPodcastCreated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    podcastName: '',
    podcastDescription: '',
    coverArt: null,
    elevenlabsApiKey: '',
  });
  const [isSpreakerConnected, setIsSpreakerConnected] = useState(false);
  const { toast } = useToast();

  const wizardSteps = [
    { id: 'welcome', title: 'Welcome!' },
    { id: 'showDetails', title: 'Tell Us About Your Show' },
    { id: 'coverArt', title: 'Your Podcast\'s Cover Art' },
    { id: 'spreaker', title: 'Connect to the World' },
    { id: 'elevenlabs', title: 'Optional: AI Voices' },
    { id: 'finish', title: 'Ready to Go!' },
  ];
  const totalSteps = wizardSteps.length;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data === 'spreaker_connected') {
        setIsSpreakerConnected(true);
        toast({ title: "Success!", description: "Your Spreaker account is now connected." });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [id]: files ? files[0] : value }));
  };

  const handleConnectSpreaker = async () => {
    try {
      const response = await fetch('/api/spreaker/auth/login', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not start the Spreaker connection process.');
      const { auth_url } = await response.json();
      
      const popup = window.open(auth_url, 'spreakerAuth', 'width=600,height=700');
      
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetch("/api/auth/users/me", { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(user => {
              if(user.spreaker_access_token) {
                setIsSpreakerConnected(true);
              }
            });
        }
      }, 1000);

    } catch (error) {
      toast({ title: "Connection Error", description: error.message, variant: "destructive" });
    }
  };

  const handleFinish = async () => {
    try {
      if (formData.elevenlabsApiKey) {
        const keyRes = await fetch('/api/users/me/elevenlabs-key', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ api_key: formData.elevenlabsApiKey }),
        });
        if (!keyRes.ok) throw new Error('Failed to save your ElevenLabs API key.');
      }

      const podcastPayload = new FormData();
      podcastPayload.append('name', formData.podcastName);
      podcastPayload.append('description', formData.podcastDescription);
      if (formData.coverArt) {
        podcastPayload.append('cover_image', formData.coverArt);
      }

      const podcastRes = await fetch('/api/podcasts/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: podcastPayload,
      });

      if (!podcastRes.ok) {
        const errorData = await podcastRes.json();
        throw new Error(errorData.detail || 'Failed to create the podcast show.');
      }
      const newPodcast = await podcastRes.json();

      toast({ title: "Success!", description: "Your new podcast show has been created." });
      onPodcastCreated(newPodcast); // Pass the new podcast object back to the parent

    } catch (error) {
      toast({ title: "An Error Occurred", description: error.message, variant: "destructive" });
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Let's Create Your First Podcast! (Step {step} of {totalSteps})</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Welcome!</h3>
            <p className="text-sm text-gray-600">
              We're excited to help you start your podcasting journey. This wizard will walk you through everything, one step at a time. No technical experience needed!
            </p>
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Tell Us About Your Show</h3>
            <DialogDescription className="mb-4">
              This is the basic information for your podcast. Think of it like the title and summary on the back of a book.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="podcastName" className="text-right">Name</Label>
                <Input id="podcastName" value={formData.podcastName} onChange={handleChange} className="col-span-3" placeholder="e.g., 'The Morning Cup'" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="podcastDescription" className="text-right">Description</Label>
                <Textarea id="podcastDescription" value={formData.podcastDescription} onChange={handleChange} className="col-span-3" placeholder="e.g., 'A daily podcast about the latest tech news.'" />
              </div>
            </div>
          </WizardStep>
        )}

        {step === 3 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Your Podcast's Cover Art</h3>
            <DialogDescription className="mb-4">
              Your cover art is the first thing people see! It should be a square image that represents your show. You can create one for free using tools like Canva.
            </DialogDescription>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coverArt" className="text-right">Image</Label>
              <Input id="coverArt" type="file" onChange={handleChange} className="col-span-3" accept="image/png, image/jpeg" />
            </div>
          </WizardStep>
        )}

        {step === 4 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Connect to the World</h3>
            <DialogDescription className="mb-4">
              To get your podcast on platforms like Spotify and Apple Podcasts, you need a host. We use a service called Spreaker for this. Click the button below to connect your Spreaker account. You can create a new account for free if you don't have one.
            </DialogDescription>
            <div className="flex justify-center items-center p-6 bg-gray-50 rounded-md">
              {isSpreakerConnected ? (
                <Button variant="secondary" disabled className="bg-green-500 text-white hover:bg-green-500">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Connected
                </Button>
              ) : (
                <Button onClick={handleConnectSpreaker}>Connect to Spreaker</Button>
              )}
            </div>
          </WizardStep>
        )}

        {step === 5 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Optional: AI Voices</h3>
            <DialogDescription className="mb-4">
               ElevenLabs is a service that creates realistic AI voices from text. If you want to use AI for intros or other segments, you'll need an API key from them. You can get one for free from their website.
            </DialogDescription>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="elevenlabsApiKey" className="text-right">ElevenLabs API Key</Label>
              <Input id="elevenlabsApiKey" type="password" value={formData.elevenlabsApiKey} onChange={handleChange} className="col-span-3" placeholder="(Optional) Paste your key here" />
            </div>
          </WizardStep>
        )}

        {step === 6 && (
          <WizardStep>
            <h3 className="text-lg font-semibold mb-2">Ready to Go!</h3>
            <p className="text-sm text-gray-600">
              You've done it! Click 'Finish' to create your new podcast show. You'll then be taken to your dashboard where you can start creating content.
            </p>
          </WizardStep>
        )}

        <DialogFooter>
          {step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}
          {step < totalSteps && <Button onClick={nextStep}>Next</Button>}
          {step === totalSteps && <Button onClick={handleFinish}>Finish & Create My Show</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewUserWizard;
