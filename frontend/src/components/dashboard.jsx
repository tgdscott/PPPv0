"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Rss,
  AlertTriangle,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/AuthContext";
import { useToast } from "@/hooks/use-toast";

import TemplateEditor from "@/components/dashboard/TemplateEditor";
import PodcastCreator from "@/components/dashboard/PodcastCreator";
import MediaLibrary from "@/components/dashboard/MediaLibrary";
import EpisodeHistory from "@/components/dashboard/EpisodeHistory";
import PodcastManager from "@/components/dashboard/PodcastManager";
import RssImporter from "@/components/dashboard/RssImporter";
import DevTools from "@/components/dashboard/DevTools";
import TemplateWizard from "@/components/dashboard/TemplateWizard";
import Settings from "@/components/dashboard/Settings";
import TemplateManager from "@/components/dashboard/TemplateManager";

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

  const fetchData = () => {
    if (token) {
      Promise.all([
        fetch('/api/auth/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/templates/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users/me/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/podcasts/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]).then(async ([userRes, templatesRes, statsRes, podcastsRes]) => {
        if (!userRes.ok || !templatesRes.ok || !statsRes.ok || !podcastsRes.ok) { logout(); return; }
        const [userData, templatesData, statsData, podcastsData] = await Promise.all([userRes.json(), templatesRes.json(), statsRes.json(), podcastsRes.json()]);
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
        fetchData(); 
    } catch (err) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const renderDashboardContent = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>Your Podcast Templates</h2>
            <Button onClick={() => setCurrentView('templateManager')} variant="outline" className="border-2 bg-transparent hover:bg-gray-50" style={{ borderColor: "#2C3E50", color: "#2C3E50" }}>Manage All Templates</Button>
          </div>
          <div className="space-y-4">
            {templates.length > 0 ? (
              templates.slice(0, 3).map((template) => (
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
      <div className="space-y-6">
        <Card className="border-0 shadow-md bg-white"><CardHeader><CardTitle>Quick Tools</CardTitle></CardHeader><CardContent className="space-y-3">
            <Button onClick={() => setCurrentView('podcastManager')} variant="outline" className="w-full justify-start bg-transparent"><Podcast className="w-4 h-4 mr-2" />Manage Shows</Button>
            <Button onClick={() => setCurrentView('episodeHistory')} variant="outline" className="w-full justify-start bg-transparent"><BarChart3 className="w-4 h-4 mr-2" />Episode History</Button>
            <Button onClick={() => setCurrentView('mediaLibrary')} variant="outline" className="w-full justify-start bg-transparent"><Music className="w-4 h-4 mr-2" />Media Library</Button>
            <Button onClick={() => setCurrentView('rssImporter')} variant="outline" className="w-full justify-start bg-transparent"><Rss className="w-4 h-4 mr-2" />Import from RSS</Button>
            <Button onClick={() => setCurrentView('settings')} variant="outline" className="w-full justify-start bg-transparent"><SettingsIcon className="w-4 h-4 mr-2" />Settings</Button>
            <Button onClick={() => setCurrentView('devTools')} variant="ghost" className="w-full justify-start text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                <AlertTriangle className="w-4 h-4 mr-2" />Developer Tools
            </Button>
        </CardContent></Card>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'templateManager':
        return <TemplateManager onBack={() => setCurrentView('dashboard')} token={token} setCurrentView={setCurrentView} />;
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
      case 'rssImporter':
        return <RssImporter onBack={handleBackToDashboard} token={token} />;
      case 'devTools':
        return <DevTools token={token} />;
      case 'settings':
        return <Settings token={token} />;
      case 'templateWizard':
        return <TemplateWizard user={user} token={token} onBack={() => setCurrentView('templateManager')} onTemplateCreated={() => { fetchData(); setCurrentView('templateManager'); }} />;
      case 'dashboard':
      default:
        const canCreateEpisode = podcasts.length > 0 && templates.length > 0;
        return (
          <div>
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div><h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#2C3E50" }}>Welcome Back, {user ? user.email.split('@')[0] : '...'}! 👋</h1><p className="text-lg text-gray-600">You're doing great! Here's what's happening with your podcast.</p></div>
              </div>
              <div className="text-center">
                {canCreateEpisode ? (
                    <Button size="lg" onClick={() => setCurrentView('createEpisode')} className="text-xl px-12 py-6 rounded-xl font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-lg" style={{ backgroundColor: "#2C3E50" }}>
                        <Plus className="w-6 h-6 mr-3" />Create New Episode
                    </Button>
                ) : (
                    <Card className="max-w-2xl mx-auto p-6 bg-amber-50 border-amber-200">
                        <CardTitle className="text-amber-800">Ready to create an episode?</CardTitle>
                        <CardDescription className="text-amber-700 mt-2">
                            {podcasts.length === 0 && "You need to create a Show first. "}
                            {templates.length === 0 && "You need to create a Template first."}
                        </CardDescription>
                        <div className="mt-4 flex justify-center gap-4">
                            {podcasts.length === 0 && <Button onClick={() => setCurrentView('podcastManager')}>Create a Show</Button>}
                            {templates.length === 0 && <Button onClick={() => setCurrentView('templateManager')}>Create a Template</Button>}
                        </div>
                    </Card>
                )}
              </div>
            </div>
            {renderDashboardContent()}
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 px-4 py-4 bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center space-x-3"><Headphones className="w-8 h-8" style={{ color: "#2C3E50" }} /><span className="text-2xl font-bold" style={{ color: "#2C3E50" }}>Podcast Plus</span></div>
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
}
