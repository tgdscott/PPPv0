"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Headphones,
  Plus,
  Edit,
  Trash2,
  Share2,
  Play,
  Download,
  Users,
  LogOut,
  Bell,
  Search,
  Target,
  Zap,
  Mic,
  Upload,
  FileText,
  Music,
  BarChart3,
  Loader2,
  Podcast,
  ArrowLeft,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/AuthContext"
// --- THIS LINE IS FIXED ---
import { useToast } from "@/components/ui/use-toast.js"

// Import the components for each view
import TemplateEditor from "@/components/dashboard/TemplateEditor"
import PodcastCreator from "@/components/dashboard/PodcastCreator"
import MediaLibrary from "@/components/dashboard/MediaLibrary"
import EpisodeHistory from "@/components/dashboard/EpisodeHistory"
import PodcastManager from "@/components/dashboard/PodcastManager"

// --- Main Dashboard Component ---
export default function PodcastPlusDashboard() {
  const { token, logout } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications] = useState(3);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // --- START: Data Fetching and Handlers ---
  const fetchData = () => {
    if (token) {
      Promise.all([
        fetch('/api/auth/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/templates/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users/me/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/podcasts/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]).then(async ([userRes, templatesRes, statsRes, podcastsRes]) => {
        if (!userRes.ok || !templatesRes.ok || !statsRes.ok || !podcastsRes.ok) { logout(); return; }
        const userData = await userRes.json();
        const templatesData = await templatesRes.json();
        const statsData = await statsRes.json();
        const podcastsData = await podcastsRes.json();
        setUser(userData);
        setTemplates(templatesData);
        setStats(statsData);
        setPodcasts(podcastsData);
      }).catch(err => { console.error("Failed to fetch dashboard data:", err); logout(); });
    }
  };

  useEffect(fetchData, [token, logout]);

  const handleEditTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    setCurrentView('editTemplate');
  };

  const handleBackToDashboard = () => {
    setSelectedTemplateId(null);
    setCurrentView('dashboard');
  };
  
  const handleBackToTemplateManager = () => {
      setSelectedTemplateId(null);
      setCurrentView('templateManager');
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template? This cannot be undone.")) return;
    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete template.');
        toast({ title: "Success", description: "Template deleted." });
        fetchData(); // Refresh all data
    } catch (err) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };
  // --- END: Data Fetching and Handlers ---


  // --- START: View for the Template Manager ---
  const renderTemplateManager = () => (
    <div className="p-6">
       <Button onClick={() => setCurrentView('dashboard')} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Template Manager</h1>
        <Button onClick={() => handleEditTemplate('new')}><Plus className="w-4 h-4 mr-2" />Create New Template</Button>
      </div>
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
                       <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template.id)}><Edit className="w-4 h-4 mr-2"/>Edit</Button>
                       <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No templates found. Get started by creating one!</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
  // --- END: View for the Template Manager ---


  // --- START: Main Dashboard View ---
  const renderDashboardContent = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Performance Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#2C3E50" }}>Your Podcast Performance</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Play className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Total Episodes</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.total_episodes : <Loader2 className="h-6 w-6 animate-spin" />}</div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Download className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Total Downloads</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.total_downloads.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Users className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Monthly Listeners</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.monthly_listeners : <Loader2 className="h-6 w-6 animate-spin" />}</div></CardContent></Card>
          </div>
        </section>
        {/* Templates Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>Your Podcast Templates</h2>
            {/* THIS BUTTON NOW WORKS */}
            <Button onClick={() => setCurrentView('templateManager')} variant="outline" className="border-2 bg-transparent hover:bg-gray-50" style={{ borderColor: "#2C3E50", color: "#2C3E50" }}>Manage All Templates</Button>
          </div>
          <div className="space-y-4">
            {templates.length > 0 ? (
              templates.slice(0, 3).map((template) => ( // Show first 3 templates
                <Card key={template.id} className="border-0 shadow-md hover:shadow-lg transition-all bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-12 h-12 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate" style={{ color: "#2C3E50" }}>{template.name}</h3>
                        <p className="text-sm text-gray-600">Contains {template.segments.length} segments.</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleEditTemplate(template.id)} variant="ghost" size="sm" className="p-2"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="p-2"><Share2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (<p className="text-gray-500">You haven't created any templates yet.</p>)}
          </div>
        </section>
      </div>
      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="border-0 shadow-md bg-white"><CardHeader><CardTitle>Quick Tools</CardTitle></CardHeader><CardContent className="space-y-3">
            <Button onClick={() => setCurrentView('podcastManager')} variant="outline" className="w-full justify-start bg-transparent"><Podcast className="w-4 h-4 mr-2" />Manage Shows</Button>
            <Button onClick={() => setCurrentView('episodeHistory')} variant="outline" className="w-full justify-start bg-transparent"><BarChart3 className="w-4 h-4 mr-2" />Episode History</Button>
            <Button onClick={() => setCurrentView('mediaLibrary')} variant="outline" className="w-full justify-start bg-transparent"><Music className="w-4 h-4 mr-2" />Media Library</Button>
        </CardContent></Card>
      </div>
    </div>
  );
  // --- END: Main Dashboard View ---


  // --- START: Main View Router ---
  const renderCurrentView = () => {
    // --- Prerequisite Checks ---
    if (currentView !== 'podcastManager' && podcasts.length === 0) {
        return (
            <div className="text-center py-20">
                <Podcast className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No shows created</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first show.</p>
                <div className="mt-6"><Button onClick={() => setCurrentView('podcastManager')}>Create a Show</Button></div>
            </div>
        )
    }
    if (currentView !== 'podcastManager' && currentView !== 'templateManager' && currentView !== 'editTemplate' && templates.length === 0) {
        return (
            <div className="text-center py-20">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates created</h3>
                <p className="mt-1 text-sm text-gray-500">Create a template to define your episode structure.</p>
                <div className="mt-6"><Button onClick={() => setCurrentView('templateManager')}>Create a Template</Button></div>
            </div>
        )
    }

    switch (currentView) {
      case 'templateManager':
        return renderTemplateManager(); // New view for the list
      case 'editTemplate':
        return <TemplateEditor templateId={selectedTemplateId} onBack={handleBackToTemplateManager} token={token} onTemplateSaved={fetchData} />;
      case 'createEpisode':
        return <PodcastCreator onBack={handleBackToDashboard} token={token} templates={templates} podcasts={podcasts} />;
      case 'mediaLibrary':
        return <MediaLibrary onBack={handleBackToDashboard} token={token} />;
      case 'episodeHistory':
        return <EpisodeHistory onBack={handleBackToDashboard} token={token} />;
      case 'podcastManager':
        return <PodcastManager onBack={handleBackToDashboard} token={token} podcasts={podcasts} setPodcasts={setPodcasts}/>;
      case 'dashboard':
      default:
        return (
          <div>
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div><h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#2C3E50" }}>Welcome Back, {user ? user.email.split('@')[0] : '...'}! 👋</h1><p className="text-lg text-gray-600">You're doing great! Here's what's happening with your podcast.</p></div>
              </div>
              <div className="text-center"><Button size="lg" onClick={() => setCurrentView('createEpisode')} className="text-xl px-12 py-6 rounded-xl font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-lg" style={{ backgroundColor: "#2C3E50" }}><Plus className="w-6 h-6 mr-3" />Create New Episode</Button></div>
            </div>
            {renderDashboardContent()}
          </div>
        );
    }
  };
  // --- END: Main View Router ---

  
  // --- START: Main Component Return ---
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 px-4 py-4 bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center space-x-3"><Headphones className="w-8 h-8" style={{ color: "#2C3E50" }} /><span className="text-2xl font-bold" style={{ color: "#2C3E50" }}>Podcast Plus</span></div>
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8"><div className="relative w-full"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search templates, episodes..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div></div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative"><Bell className="w-5 h-5" />{notifications > 0 && (<Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">{notifications}</Badge>)}</Button>
            <div className="flex items-center space-x-3"><Avatar className="h-8 w-8"><AvatarImage src={user?.picture} /><AvatarFallback>{user?.email ? user.email.substring(0, 2).toUpperCase() : '...'}</AvatarFallback></Avatar><span className="hidden md:block text-sm font-medium" style={{ color: "#2C3E50" }}>{user ? user.email : 'Loading...'}</span></div>
            <Button onClick={logout} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800"><LogOut className="w-4 h-4 mr-1" /><span className="hidden md:inline">Logout</span></Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto max-w-7xl px-4 py-6">
        {renderCurrentView()}
      </main>
    </div>
  );
  // --- END: Main Component Return ---
}