import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EditPodcastDialog({ isOpen, onClose, podcast, onSave, token }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover_path: "",
    podcast_type: "",
    language: "",
    copyright_line: "",
    owner_name: "",
    author_name: "",
    spreaker_show_id: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (podcast) {
      setFormData({
        name: podcast.name || "",
        description: podcast.description || "",
        cover_path: podcast.cover_path || "",
        podcast_type: podcast.podcast_type || "",
        language: podcast.language || "",
        copyright_line: podcast.copyright_line || "",
        owner_name: podcast.owner_name || "",
        author_name: podcast.author_name || "",
        spreaker_show_id: podcast.spreaker_show_id || "",
      });
    }
  }, [podcast]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/podcasts/${podcast.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update podcast.");
      }

      const updatedPodcast = await response.json();
      onSave(updatedPodcast); // Update state in parent component
      toast({ title: "Success", description: "Podcast updated successfully." });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Podcast</DialogTitle>
          <DialogDescription>Make changes to your podcast here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={formData.description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cover_path" className="text-right">
                Cover Image URL
              </Label>
              <Input id="cover_path" value={formData.cover_path} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="podcast_type" className="text-right">
                Podcast Type
              </Label>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="text-right">
                Language
              </Label>
              <Input id="language" value={formData.language} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="copyright_line" className="text-right">
                Copyright Line
              </Label>
              <Input id="copyright_line" value={formData.copyright_line} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner_name" className="text-right">
                Owner Name
              </Label>
              <Input id="owner_name" value={formData.owner_name} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="author_name" className="text-right">
                Author Name
              </Label>
              <Input id="author_name" value={formData.author_name} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spreaker_show_id" className="text-right">
                Spreaker Show ID
              </Label>
              <Input id="spreaker_show_id" value={formData.spreaker_show_id} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : ""}Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

