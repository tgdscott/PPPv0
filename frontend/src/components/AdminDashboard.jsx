"use client"

import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import {
  Headphones,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  Shield,
  Play,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "../AuthContext"

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("users") // Default to users view
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null); // State for analytics data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        // Fetch users and stats in parallel
        const [usersResponse, statsResponse] = await Promise.all([
            fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!usersResponse.ok) throw new Error('Failed to fetch users. Are you an admin?');
        if (!statsResponse.ok) throw new Error('Failed to fetch platform stats.');

        const usersData = await usersResponse.json();
        const statsData = await statsResponse.json();
        
        setUsers(usersData);
        setAnalytics(statsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, [token]);


  const navigationItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "podcasts", label: "Podcasts", icon: Play },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "help", label: "Help & Docs", icon: HelpCircle },
  ]

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge className="bg-green-100 text-green-800">Active</Badge> : 
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  }

  const getTierBadge = (tier) => {
    switch (tier.toLowerCase()) {
      case "premium":
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case "pro":
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>;
      case "free":
      default:
        return <Badge className="bg-gray-100 text-gray-800">Free</Badge>;
    }
  }
  
  const renderUserContent = () => {
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
    if (error) return <p className="text-red-500 p-4">{error}</p>
    return (
       <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">User</TableHead>
                <TableHead className="font-semibold text-gray-700">Tier</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Google User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                         <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-800">{user.email}</div>
                        <div className="text-sm text-gray-500">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTierBadge(user.tier)}</TableCell>
                  <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                  <TableCell className="text-gray-600">{user.google_id ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  const renderDashboardOverview = () => {
      if (isLoading || !analytics) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
      if (error) return <p className="text-red-500 p-4">{error}</p>
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-sm bg-white"><CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_users.toLocaleString()}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm bg-white"><CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">New Sign-ups (30 Days)</p>
                  <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.new_signups_30d}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm bg-white"><CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Episodes</p>
                  <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_episodes.toLocaleString()}</p>
              </CardContent></Card>
               <Card className="border-0 shadow-sm bg-white"><CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Media Files</p>
                  <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_media_items.toLocaleString()}</p>
              </CardContent></Card>
          </div>
      )
  }

  const renderAnalyticsContent = () => {
    if (isLoading || !analytics) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>
    if (error) return <p className="text-red-500 p-4">{error}</p>
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}><CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Active Users</p>
                            <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_users.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100"><Users className="w-8 h-8 text-blue-600" /></div>
                    </div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}><CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">New Sign-ups (30 Days)</p>
                            <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.new_signups_30d}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100"><Calendar className="w-8 h-8 text-green-600" /></div>
                    </div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}><CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Episodes Published</p>
                            <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_episodes.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100"><Play className="w-8 h-8 text-purple-600" /></div>
                    </div>
                </CardContent></Card>
                <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}><CardContent className="p-6">
                     <p className="text-sm font-medium text-gray-600">Total Media Files</p>
                     <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>{analytics.total_media_items.toLocaleString()}</p>
                </CardContent></Card>
            </div>
             {/* Placeholder for charts */}
            <Card className="border-0 shadow-sm bg-white">
                <CardHeader><CardTitle>User Growth Trend (Placeholder)</CardTitle></CardHeader>
                <CardContent><div className="h-64 bg-gray-100 rounded-md flex items-center justify-center"><p className="text-gray-500">Chart will be implemented here</p></div></CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Headphones className="w-8 h-8" style={{ color: "#2C3E50" }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#2C3E50" }}>Podcast Plus</h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${ activeTab === item.id ? "text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
                  style={{ backgroundColor: activeTab === item.id ? "#2C3E50" : "transparent" }}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8"><AvatarFallback><Shield className="w-4 h-4" /></AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
            </div>
          </div>
          <Button onClick={logout} variant="ghost" size="sm" className="w-full justify-start text-gray-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                {navigationItems.find((item) => item.id === activeTab)?.label}
            </h1>
        </header>
        <main className="flex-1 p-6">
          {activeTab === "dashboard" && renderDashboardOverview()}
          {activeTab === "users" && renderUserContent()}
          {activeTab === "analytics" && renderAnalyticsContent()}
          {activeTab !== "users" && activeTab !== "dashboard" && activeTab !== "analytics" && <p>This section is under construction.</p>}
        </main>
      </div>
    </div>
  );
}
