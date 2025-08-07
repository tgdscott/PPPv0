"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function Settings({ token }) {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isSpreakerConnected, setIsSpreakerConnected] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsSpreakerConnected(!!userData.spreaker_access_token);
      } else {
        // Handle error, maybe log out or show a message
        console.error("Failed to fetch user data in settings.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    // Check for spreaker_connected query param after redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('spreaker_connected') === 'true') {
      toast({ title: "Spreaker Connected", description: "Your Spreaker account has been successfully connected!" });
      // Clear the query param to prevent toast on subsequent visits
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  const handleConnectSpreaker = async () => {
    try {
      const response = await fetch('/api/spreaker/auth/login', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      } else {
        toast({ title: "Error", description: "Failed to connect to Spreaker.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleDisconnectSpreaker = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Spreaker account?")) return;
    try {
      const response = await fetch('/api/spreaker/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Spreaker Disconnected", description: "Your Spreaker account has been successfully disconnected." });
        fetchUser(); // Re-fetch user data to update UI
      } else {
        toast({ title: "Error", description: "Failed to disconnect Spreaker.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Connected Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Connect your accounts from other services to streamline your workflow.
              </p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <h4 className="font-semibold">Spreaker</h4>
                <p className="text-sm text-muted-foreground">
                  Publish your episodes directly to Spreaker.
                </p>
              </div>
              {isSpreakerConnected ? (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">Connected</span>
                  <Button onClick={handleDisconnectSpreaker} variant="destructive">
                    Disconnect from Spreaker
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnectSpreaker}>
                  Connect to Spreaker
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}