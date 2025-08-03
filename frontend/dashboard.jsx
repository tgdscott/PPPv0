"use client"

import { Button } from "./src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./src/components/ui/card"
import { Badge } from "./src/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./src/components/ui/avatar"
import {
  Headphones,
  Plus,
  Settings,
  Share2,
  Play,
  Edit,
  TrendingUp,
  Users,
  Download,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Star,
  CheckCircle,
  AlertCircle,
  Mic,
  Upload,
  FileText,
  Music,
  BarChart3,
  Loader2,
  Podcast, // Added for the new button
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "./src/AuthContext"

// Import the newly separated components
import TemplateEditor from "./src/components/dashboard/TemplateEditor"
import PodcastCreator from "./src/components/dashboard/PodcastCreator"
import MediaLibrary from "./src/components/dashboard/MediaLibrary"
import EpisodeHistory from "./src/components/dashboard/EpisodeHistory"
import PodcastManager from "./src/components/dashboard/PodcastManager"


// --- Main Dashboard Component ---
export default function PodcastPlusDashboard() {
  const { token, logout } = useAuth();
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
  
  const [recentActivity] = useState([ { id: 1, type: "download", message: "Your episode 'My Latest Adventures' reached 200 downloads!", time: "2 hours ago", icon: Download }, { id: 2, type: "comment", message: "New review: 'Amazing content, keep it up!' ⭐⭐⭐⭐⭐", time: "5 hours ago", icon: MessageCircle }, { id: 3, type: "milestone", message: "Congratulations! You've reached 1,500 total downloads!", time: "1 day ago", icon: Target } ]);
  const quickActions = [ { icon: Mic, label: "Record Now", color: "bg-red-500" }, { icon: Upload, label: "Upload Audio", color: "bg-blue-500" }, { icon: Edit, label: "Edit Draft", color: "bg-yellow-500" }, { icon: Share2, label: "Share Latest", color: "bg-green-500" } ];

  const handleEditTemplate = (templateId) => { setSelectedTemplateId(templateId); setCurrentView('editTemplate'); };
  const handleBackToDashboard = () => { setSelectedTemplateId(null); setCurrentView('dashboard'); };
  
  const renderDashboardContent = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Performance Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#2C3E50" }}>Your Podcast Performance</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Play className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Total Episodes</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.total_episodes : <Loader2 className="h-6 w-6 animate-spin" />}</div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Download className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Total Downloads</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.total_downloads.toLocaleString() : <Loader2 className="h-6 w-6 animate-spin" />}</div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div className="flex items-center"><Users className="w-5 h-5 mr-2" style={{ color: "#2C3E50" }} /><span className="text-sm text-gray-600">Monthly Listeners</span></div></div><div className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{stats ? stats.monthly_listeners : <Loader2 className="h-6 w-6 animate-spin" />}</div><div className="flex items-center mt-1"><Star className="w-3 h-3 text-yellow-500 mr-1" /><span className="text-xs text-gray-500">{stats ? `${stats.avg_rating} avg rating` : '...'}</span></div></CardContent></Card>
          </div>
        </section>
        {/* Templates Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>Your Podcast Templates</h2>
            <Button variant="outline" className="border-2 bg-transparent hover:bg-gray-50" style={{ borderColor: "#2C3E50", color: "#2C3E50" }}>Manage All Templates</Button>
          </div>
          <div className="space-y-4">
            {templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} className="border-0 shadow-md hover:shadow-lg transition-all bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-12 h-12 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate" style={{ color: "#2C3E50" }}>{template.name}</h3>
                        <p className="text-sm text-gray-600">Contains {template.segments.length} segments.</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="p-2"><Play className="w-4 h-4" /></Button>
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
        <Card className="border-0 shadow-md bg-white"><CardHeader><CardTitle className="flex items-center" style={{ color: "#2C3E50" }}><Zap className="w-5 h-5 mr-2" />Recent Activity</CardTitle></CardHeader><CardContent className="space-y-4">{recentActivity.map((activity) => (<div key={activity.id} className="flex items-start space-x-3"><div className="flex-shrink-0"><activity.icon className="w-5 h-5 text-gray-500" /></div><div className="flex-1 min-w-0"><p className="text-sm text-gray-800">{activity.message}</p><p className="text-xs text-gray-500 mt-1">{activity.time}</p></div></div>))}<Button variant="ghost" size="sm" className="w-full mt-4 text-gray-600">View All Activity</Button></CardContent></Card>
        <Card className="border-0 shadow-md" style={{ backgroundColor: "#ECF0F1" }}><CardHeader><CardTitle className="flex items-center" style={{ color: "#2C3E50" }}><Target className="w-5 h-5 mr-2" />Pro Tips</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-start space-x-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-medium" style={{ color: "#2C3E50" }}>Consistency is Key</p><p className="text-xs text-gray-600">Publishing regularly helps build your audience</p></div></div><div className="flex items-start space-x-3"><AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-medium" style={{ color: "#2C3E50" }}>Engage with Listeners</p><p className="text-xs text-gray-600">Respond to comments to build community</p></div></div></CardContent></Card>
        <Card className="border-0 shadow-md bg-white"><CardHeader><CardTitle style={{ color: "#2C3E50" }}>Quick Tools</CardTitle></CardHeader><CardContent className="space-y-3">
            <Button onClick={() => setCurrentView('podcastManager')} variant="outline" className="w-full justify-start bg-transparent" style={{ borderColor: "#ECF0F1" }}><Podcast className="w-4 h-4 mr-2" />Manage Shows</Button>
            <Button onClick={() => setCurrentView('episodeHistory')} variant="outline" className="w-full justify-start bg-transparent" style={{ borderColor: "#ECF0F1" }}><BarChart3 className="w-4 h-4 mr-2" />Episode History</Button>
            <Button onClick={() => setCurrentView('mediaLibrary')} variant="outline" className="w-full justify-start bg-transparent" style={{ borderColor: "#ECF0F1" }}><Music className="w-4 h-4 mr-2" />Media Library</Button>
        </CardContent></Card>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'editTemplate':
        return <TemplateEditor templateId={selectedTemplateId} onBack={handleBackToDashboard} token={token} onTemplateSaved={fetchData} />;
      case 'createEpisode':
        return <PodcastCreator onBack={handleBackToDashboard} token={token} templates={templates} podcasts={podcasts} />;
      case 'mediaLibrary':
        return <MediaLibrary onBack={handleBackToDashboard} token={token} />;
      case 'episodeHistory':
        return <EpisodeHistory onBack={handleBackToDashboard} token={token} />;
      case 'podcastManager':
        return <PodcastManager onBack={handleBackToDashboard} token={token} />;
      case 'dashboard':
      default:
        return (
          <div>
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div><h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#2C3E50" }}>Welcome Back, {user ? user.email.split('@')[0] : '...'}! 👋</h1><p className="text-lg text-gray-600">You're doing great! Here's what's happening with your podcast.</p></div>
                <div className="flex space-x-2 mt-4 lg:mt-0">{quickActions.map((action, index) => (<Button key={index} variant="outline" size="sm" className="flex items-center space-x-2 hover:shadow-md transition-all bg-transparent"><action.icon className={`w-4 h-4 text-white p-1 rounded ${action.color}`} /><span className="hidden sm:inline">{action.label}</span></Button>))}</div>
              </div>
              <div className="text-center"><Button size="lg" onClick={() => setCurrentView('createEpisode')} className="text-xl px-12 py-6 rounded-xl font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105 shadow-lg" style={{ backgroundColor: "#2C3E50" }}><Plus className="w-6 h-6 mr-3" />Create New Episode</Button></div>
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
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8"><div className="relative w-full"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search templates, episodes..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div></div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative"><Bell className="w-5 h-5" />{notifications > 0 && (<Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">{notifications}</Badge>)}</Button>
            <div className="flex items-center space-x-3"><Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/32x32/E2E8F0/A0AEC0?text=User" /><AvatarFallback>{user?.email ? user.email.substring(0, 2).toUpperCase() : '...'}</AvatarFallback></Avatar><span className="hidden md:block text-sm font-medium" style={{ color: "#2C3E50" }}>{user ? user.email : 'Loading...'}</span></div>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800"><HelpCircle className="w-4 h-4 mr-1" /><span className="hidden md:inline">Help</span></Button>
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
