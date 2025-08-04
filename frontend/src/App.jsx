import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx'; 
import PodcastPlusDashboard from '@/components/dashboard.jsx'; // The regular user dashboard
import AdminDashboard from '@/components/admin-dashboard.jsx'; // The new admin dashboard
import LandingPage from '@/components/landing-page.jsx';

// --- IMPORTANT ---
// This should match the actual email address you set for ADMIN_EMAIL in your .env file.
const ADMIN_EMAIL = "scott@scottgerhardt.com";

export default function App() {
    const { isAuthenticated, token, login, logout } = useAuth();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to handle Google OAuth redirect
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const urlToken = params.get('access_token');
            if (urlToken) {
                login(urlToken);
                window.location.hash = ''; 
            }
        }
    }, [login]);

    // Effect to fetch user data once authenticated
    useEffect(() => {
        const fetchUser = async () => {
            if (isAuthenticated && token) {
                try {
                    const response = await fetch('/api/auth/users/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        // --- DEBUGGING LINE ---
                        // This will print the fetched user data to the browser console.
                        console.log("User data fetched:", userData); 
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };
        
        if(isAuthenticated) {
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, token, logout]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <LandingPage />;
    }

    if (user) {
        // This comparison is where the magic happens (or doesn't).
        if (user.email === ADMIN_EMAIL) {
            return <AdminDashboard />;
        } else {
            return <PodcastPlusDashboard />;
        }
    }
    
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
}