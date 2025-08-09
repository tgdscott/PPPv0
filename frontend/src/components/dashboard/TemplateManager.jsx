import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, ArrowLeft, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import TemplateEditor from "./TemplateEditor"; // We will use the editor as a sub-component

export default function TemplateManager({ onBack, token, setCurrentView }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null); // This will control which view is shown

  const fetchTemplates = async () => {
    setIsLoading(true);
    setEditingTemplateId(null); // Always return to list view after a fetch
    try {
      const response = await fetch('/api/templates/', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch templates.');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const handleCreateNew = () => {
    setEditingTemplateId('new'); // Use 'new' as a special ID for creation
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete template.');
        // Refresh the list after deleting
        fetchTemplates();
    } catch (err) {
        setError(err.message);
    }
  };

  // If we are editing or creating, show the editor component
  if (editingTemplateId) {
    return (
      <TemplateEditor
        templateId={editingTemplateId}
        onBack={() => setEditingTemplateId(null)} // Go back to the manager list
        token={token}
        onTemplateSaved={fetchTemplates} // Refresh the list after saving
      />
    );
  }

  // Otherwise, show the list of templates
  return (
    <div className="p-6">
       <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Template Manager</h1>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('templateWizard')} variant="outline"><Bot className="w-4 h-4 mr-2" />Create with AI Wizard</Button>
          <Button onClick={handleCreateNew}><Plus className="w-4 h-4 mr-2" />Create New Template</Button>
        </div>
      </div>
      {isLoading && <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Your Templates</CardTitle>
            <CardDescription>Select a template to edit or create a new one.</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <span className="font-semibold">{template.name}</span>
                    <div className="space-x-2">
                       <Button variant="outline" size="sm" onClick={() => setEditingTemplateId(template.id)}><Edit className="w-4 h-4 mr-2"/>Edit</Button>
                       <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No templates found. Get started by creating one!</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}