"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Headphones,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
  Search,
  Eye,
  Edit,
  UserX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  TrendingUp,
  Play,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Plus,
  Download,
} from "lucide-react"
import { useState } from "react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)

  // Mock user data
  const [users] = useState([
    {
      id: 1,
      name: "Alice Smith",
      email: "alice@example.com",
      tier: "Pro",
      status: "Active",
      lastLogin: "2025-01-29",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 24,
      joinDate: "2024-03-15",
    },
    {
      id: 2,
      name: "Bob Johnson",
      email: "bob@example.com",
      tier: "Creator",
      status: "Active",
      lastLogin: "2025-01-28",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 12,
      joinDate: "2024-06-22",
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@example.com",
      tier: "Free",
      status: "Suspended",
      lastLogin: "2025-01-20",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 3,
      joinDate: "2024-11-08",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david@example.com",
      tier: "Pro",
      status: "Active",
      lastLogin: "2025-01-29",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 45,
      joinDate: "2024-01-12",
    },
    {
      id: 5,
      name: "Emma Brown",
      email: "emma@example.com",
      tier: "Creator",
      status: "Active",
      lastLogin: "2025-01-27",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 18,
      joinDate: "2024-08-03",
    },
    {
      id: 6,
      name: "Frank Miller",
      email: "frank@example.com",
      tier: "Free",
      status: "Active",
      lastLogin: "2025-01-25",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 2,
      joinDate: "2024-12-15",
    },
    {
      id: 7,
      name: "Grace Lee",
      email: "grace@example.com",
      tier: "Pro",
      status: "Active",
      lastLogin: "2025-01-29",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 31,
      joinDate: "2024-04-20",
    },
    {
      id: 8,
      name: "Henry Taylor",
      email: "henry@example.com",
      tier: "Creator",
      status: "Active",
      lastLogin: "2025-01-26",
      avatar: "/placeholder.svg?height=40&width=40",
      episodeCount: 8,
      joinDate: "2024-09-10",
    },
  ])

  // Mock analytics data
  const [analytics] = useState({
    totalUsers: 2847,
    newSignups: 156,
    totalEpisodes: 12543,
    mostUsedModule: "Podcast Creator",
    activeUsers: 1923,
    revenue: 45670,
    avgEpisodesPerUser: 4.4,
    retentionRate: 78,
  })

  // Mock settings data
  const [settings, setSettings] = useState({
    aiShowNotes: true,
    guestAccess: false,
    maintenanceMode: false,
    openaiApiKey: "sk-****************************",
    maxFileSize: "500",
    autoBackup: true,
    emailNotifications: true,
  })

  const navigationItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "podcasts", label: "Podcasts", icon: Play },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "help", label: "Help & Docs", icon: HelpCircle },
  ]

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tier.toLowerCase().includes(searchTerm.toLowerCase()))

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "Suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "Inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  const getTierBadge = (tier) => {
    switch (tier) {
      case "Pro":
        return <Badge className="bg-purple-100 text-purple-800">Pro</Badge>;
      case "Creator":
        return <Badge className="bg-blue-100 text-blue-800">Creator</Badge>;
      case "Free":
        return <Badge className="bg-gray-100 text-gray-800">Free</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Headphones className="w-8 h-8" style={{ color: "#2C3E50" }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#2C3E50" }}>
                EffortlessCast
              </h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === item.id
                      ? "text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                  style={{
                    backgroundColor: activeTab === item.id ? "#2C3E50" : "transparent",
                  }}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Shield className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Platform Administrator</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                {navigationItems.find((item) => item.id === activeTab)?.label}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === "users" && "Manage platform users and their accounts"}
                {activeTab === "analytics" && "Monitor platform performance and user engagement"}
                {activeTab === "settings" && "Configure platform settings and features"}
                {activeTab === "dashboard" && "Overview of platform metrics and activity"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {/* Real-time Alerts */}
          <div className="mb-6">
            {settings.maintenanceMode && (
              <Card className="border-l-4 border-orange-500 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                    <div>
                      <p className="font-medium text-orange-800">Maintenance Mode Active</p>
                      <p className="text-sm text-orange-700">
                        Platform is currently in maintenance mode. Users cannot access the service.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto bg-transparent"
                      onClick={() => setSettings({ ...settings, maintenanceMode: false })}>
                      Disable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-l-4 border-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-800">System Update Available</p>
                    <p className="text-sm text-blue-700">
                      Version 2.1.0 is ready to install with new AI features and performance improvements.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-auto text-white"
                    style={{ backgroundColor: "#2C3E50" }}>
                    Update Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Enhanced Search and Bulk Actions */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <div
                    className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div
                      className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
                      <div className="relative flex-1 max-w-md">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search users by name, email, or tier..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Tiers</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="creator">Creator</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Bulk Message
                      </Button>
                      <Button size="sm" className="text-white" style={{ backgroundColor: "#2C3E50" }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700">User</TableHead>
                        <TableHead className="font-semibold text-gray-700">Email</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tier</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Episodes</TableHead>
                        <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-800">{user.name}</div>
                                <div className="text-sm text-gray-500">Joined {user.joinDate}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell>{getTierBadge(user.tier)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-gray-600">{user.episodeCount}</TableCell>
                          <TableCell className="text-gray-600">{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="p-2">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2 text-orange-600">
                                <UserX className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2 text-blue-600">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div
                    className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                      {filteredUsers.length} users
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Time Period Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#2C3E50" }}>
                    Platform Analytics
                  </h3>
                  <p className="text-gray-600">Comprehensive insights into platform performance</p>
                </div>
                <Select defaultValue="30d">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: "#ECF0F1" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Active Users</p>
                        <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>
                          {analytics.totalUsers.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600">+12% from last month</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Free: 1,247</span>
                        <span>Creator: 892</span>
                        <span>Pro: 708</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: "#ECF0F1" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">New Sign-ups (30 Days)</p>
                        <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>
                          {analytics.newSignups}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600">+8% from last month</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <Calendar className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        Daily average: {Math.round(analytics.newSignups / 30)} users
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: "#ECF0F1" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Episodes Published</p>
                        <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>
                          {analytics.totalEpisodes.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600">+23% from last month</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <Play className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600">This month: 1,247 episodes</div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: "#ECF0F1" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue (MRR)</p>
                        <p className="text-3xl font-bold" style={{ color: "#2C3E50" }}>
                          ${analytics.revenue.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600">+15% from last month</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        ARPU: ${(analytics.revenue / analytics.totalUsers).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Charts Section */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle
                      className="flex items-center justify-between"
                      style={{ color: "#2C3E50" }}>
                      User Growth Trend
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="h-64 flex items-end justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                      {[65, 78, 82, 95, 108, 125, 142, 156].map((height, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                            style={{ height: `${height}px` }}></div>
                          <span className="text-xs text-gray-500 mt-2">W{index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <span>Weekly new users</span>
                      <span className="text-green-600">↗ Trending up</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle
                      className="flex items-center justify-between"
                      style={{ color: "#2C3E50" }}>
                      Episode Creation Trends
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="h-64 flex items-end justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                      {[45, 52, 48, 67, 73, 69, 81, 89].map((height, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                            style={{ height: `${height * 2}px` }}></div>
                          <span className="text-xs text-gray-500 mt-2">W{index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                      <span>Episodes published per week</span>
                      <span className="text-green-600">↗ Growing steadily</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analytics */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle style={{ color: "#2C3E50" }}>Top Performing Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { title: "Tech Talk Weekly", downloads: "12.4K", growth: "+23%" },
                      { title: "Mindful Moments", downloads: "8.7K", growth: "+18%" },
                      { title: "Business Insights", downloads: "6.2K", growth: "+15%" },
                    ].map((podcast, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{podcast.title}</p>
                          <p className="text-sm text-gray-600">{podcast.downloads} downloads</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{podcast.growth}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle style={{ color: "#2C3E50" }}>User Engagement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Daily Active Users</span>
                          <span className="font-medium">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Weekly Retention</span>
                          <span className="font-medium">65%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Monthly Retention</span>
                          <span className="font-medium">42%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: "42%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle style={{ color: "#2C3E50" }}>Platform Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">98.7%</div>
                      <p className="text-sm text-gray-600">Uptime (30 days)</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg Response Time</span>
                        <span className="font-medium">245ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        <span className="font-medium text-green-600">0.03%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Connections</span>
                        <span className="font-medium">1,247</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Enhanced Dashboard Overview Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                          {analytics.activeUsers.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-green-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +12% vs last month
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                          ${analytics.revenue.toLocaleString()}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-green-600">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +18% vs last month
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Episodes Today</p>
                        <p className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
                          47
                        </p>
                        <div className="flex items-center mt-1 text-sm text-blue-600">
                          <Play className="w-3 h-3 mr-1" />
                          23 published, 24 drafts
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <Play className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">System Health</p>
                        <p className="text-2xl font-bold text-green-600">98.7%</p>
                        <div className="flex items-center mt-1 text-sm text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          All systems operational
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity and Quick Actions */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle
                        className="flex items-center justify-between"
                        style={{ color: "#2C3E50" }}>
                        Recent Platform Activity
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          View All
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          icon: Users,
                          color: "text-blue-600",
                          bg: "bg-blue-100",
                          title: "New user registration spike",
                          description: "23 new users signed up in the last hour",
                          time: "5 minutes ago",
                        },
                        {
                          icon: AlertTriangle,
                          color: "text-orange-600",
                          bg: "bg-orange-100",
                          title: "High server load detected",
                          description: "CPU usage at 78% - monitoring closely",
                          time: "12 minutes ago",
                        },
                        {
                          icon: Play,
                          color: "text-purple-600",
                          bg: "bg-purple-100",
                          title: "Episode milestone reached",
                          description: "Platform just hit 15,000 total episodes published",
                          time: "1 hour ago",
                        },
                        {
                          icon: TrendingUp,
                          color: "text-green-600",
                          bg: "bg-green-100",
                          title: "Revenue target exceeded",
                          description: "Monthly revenue goal reached 5 days early",
                          time: "2 hours ago",
                        },
                      ].map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-all">
                          <div className={`p-2 rounded-full ${activity.bg}`}>
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle style={{ color: "#2C3E50" }}>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <MessageSquare className="w-4 h-4 mr-3" />
                        Send Platform Announcement
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Download className="w-4 h-4 mr-3" />
                        Generate Monthly Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Settings className="w-4 h-4 mr-3" />
                        System Maintenance
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Users className="w-4 h-4 mr-3" />
                        User Support Queue
                      </Button>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}>
                    <CardHeader>
                      <CardTitle style={{ color: "#2C3E50" }}>System Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { service: "API Gateway", status: "operational", color: "text-green-600", icon: CheckCircle },
                        { service: "Database", status: "operational", color: "text-green-600", icon: CheckCircle },
                        { service: "AI Services", status: "operational", color: "text-green-600", icon: CheckCircle },
                        { service: "File Storage", status: "degraded", color: "text-orange-600", icon: AlertTriangle },
                        { service: "Email Service", status: "down", color: "text-red-600", icon: XCircle },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-sm font-medium text-gray-700">{item.service}</span>
                          </div>
                          <Badge
                            className={`text-xs ${
                              item.status === "operational"
                                ? "bg-green-100 text-green-800"
                                : item.status === "degraded"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                            }`}>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Feature Toggles */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle style={{ color: "#2C3E50" }}>Platform Features</CardTitle>
                  <p className="text-gray-600">Enable or disable platform-wide features</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Enable AI Show Notes (Beta)</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Allow users to generate show notes automatically using AI
                      </p>
                    </div>
                    <Switch
                      checked={settings.aiShowNotes}
                      onCheckedChange={(checked) => setSettings({ ...settings, aiShowNotes: checked })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Allow Guest Access to Podcasts</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Enable non-registered users to listen to public podcasts
                      </p>
                    </div>
                    <Switch
                      checked={settings.guestAccess}
                      onCheckedChange={(checked) => setSettings({ ...settings, guestAccess: checked })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500 mt-1">Temporarily disable platform access for maintenance</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {settings.maintenanceMode && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Auto Backup</Label>
                      <p className="text-sm text-gray-500 mt-1">Automatically backup user data daily</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })} />
                  </div>
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle style={{ color: "#2C3E50" }}>API Configuration</CardTitle>
                  <p className="text-gray-600">Configure external service integrations</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="openai-key" className="text-base font-medium text-gray-700">
                      OpenAI API Key
                    </Label>
                    <p className="text-sm text-gray-500 mt-1 mb-2">Required for AI-powered features</p>
                    <Input
                      id="openai-key"
                      type="password"
                      value={settings.openaiApiKey}
                      onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      placeholder="sk-..." />
                  </div>

                  <div>
                    <Label htmlFor="max-file-size" className="text-base font-medium text-gray-700">
                      Maximum File Size (MB)
                    </Label>
                    <p className="text-sm text-gray-500 mt-1 mb-2">Maximum audio file upload size</p>
                    <Input
                      id="max-file-size"
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                      placeholder="500" />
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="border-0 shadow-sm" style={{ backgroundColor: "#ECF0F1" }}>
                <CardHeader>
                  <CardTitle style={{ color: "#2C3E50" }}>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-800">Database</p>
                        <p className="text-sm text-green-600">Operational</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-800">AI Services</p>
                        <p className="text-sm text-green-600">Operational</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-800">Email Service</p>
                        <p className="text-sm text-red-600">Degraded</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other tabs placeholder */}
          {!["users", "analytics", "settings", "dashboard"].includes(activeTab) && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {navigationItems.find((item) => item.id === activeTab)?.label} Coming Soon
              </h3>
              <p className="text-gray-500">This section is under development and will be available soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
