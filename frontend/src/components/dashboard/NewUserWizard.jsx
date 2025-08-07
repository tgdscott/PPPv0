import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewUserWizard({ isOpen, onClose, onSave, token }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover_path: "",
    podcast_type: "episodic",
    language: "en",
    copyright_line: "",
    owner_name: "",
    author_name: "",
    spreaker_show_id: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/podcasts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create podcast.");
      }

      const newPodcast = await response.json();
      onSave(newPodcast);
      toast({ title: "Success", description: "Podcast created successfully." });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 1: Basic Podcast Info</DialogTitle>
              <DialogDescription>Let's start with the basics of your new podcast.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" value={formData.description} onChange={handleChange} className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={nextStep}>Next</Button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Cover Art & Type</DialogTitle>
              <DialogDescription>Give your podcast a visual identity and define its structure.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cover_path" className="text-right">Cover Image URL</Label>
                <Input id="cover_path" value={formData.cover_path} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="podcast_type" className="text-right">Podcast Type</Label>
                <Select
                  value={formData.podcast_type}
                  onValueChange={(value) => handleSelectChange("podcast_type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="episodic">Episodic</SelectItem>
                    <SelectItem value="serial">Serial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline">Previous</Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 3: Language & Legal</DialogTitle>
              <DialogDescription>Set your podcast's language and add legal information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="language" className="text-right">Language</Label>
                <Input id="language" value={formData.language} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="copyright_line" className="text-right">Copyright Line</Label>
                <Input id="copyright_line" value={formData.copyright_line} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="owner_name" className="text-right">Owner Name</Label>
                <Input id="owner_name" value={formData.owner_name} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="author_name" className="text-right">Author Name</Label>
                <Input id="author_name" value={formData.author_name} onChange={handleChange} className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline">Previous</Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 4: Spreaker Integration</DialogTitle>
              <DialogDescription>Connect your podcast to Spreaker for publishing.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="spreaker_show_id" className="text-right">Spreaker Show ID</Label>
                <Input id="spreaker_show_id" value={formData.spreaker_show_id} onChange={handleChange} className="col-span-3" />
              </div>
              <p className="col-span-4 text-sm text-gray-500">If you don't have a Spreaker Show ID, please create a show on Spreaker.com first.</p>
            </div>
            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline">Previous</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : ""}Finish Setup
              </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </DialogContent>
    </Dialog>
  );
}
