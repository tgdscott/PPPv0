import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import PodcastPublisherTool from "./components/dashboard/PodcastPublisherTool";
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx'; 
import PodcastPlusDashboard from '@/components/dashboard.jsx'; // The regular user dashboard
import AdminDashboard from '@/components/admin-dashboard.jsx'; // The new admin dashboard
import LandingPage from '@/components/landing-page.jsx';
import Settings from '@/components/dashboard/Settings.jsx'; // Import the Settings component

// --- IMPORTANT ---
// This should match the actual email address you set for ADMIN_EMAIL in your .env file.
const ADMIN_EMAIL = "scott@scottgerhardt.com";

export default function App() {
    const { isAuthenticated, token, login, logout } = useAuth();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const processAuth = async () => {
            const hash = window.location.hash;
            let effectiveToken = token;

            // 1. Check for token in URL hash from Google redirect
            if (hash) {
                const params = new URLSearchParams(hash.substring(1));
                const urlToken = params.get('access_token');
                if (urlToken) {
                    login(urlToken);
                    effectiveToken = urlToken;
                    window.location.hash = ''; // Clean the URL
                }
            }

            // 2. If we have a token (from URL or localStorage), fetch the user
            if (effectiveToken) {
                try {
                    const response = await fetch('/api/auth/users/me', {
                        headers: { 'Authorization': `Bearer ${effectiveToken}` }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        // Token is invalid, log out
                        logout();
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                    logout();
                    setUser(null);
                }
            }
            
            // 3. We are done loading
            setIsLoading(false);
        };

        processAuth();
    }, [token, login, logout]); // Rerun if the token changes

    // Prioritize /dashboard/settings route
    if (window.location.pathname === '/dashboard/settings') {
        return <Settings token={token} />;
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <LandingPage />;
    }

    if (user) {
        // Default dashboard rendering
        if (user.email === ADMIN_EMAIL) {
            return <AdminDashboard />;
        } else {
            return <PodcastPlusDashboard />;
        }
    }
    
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
}