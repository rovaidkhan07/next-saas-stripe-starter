'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/shared/icons';
import { toast } from '@/components/ui/use-toast';

export default function AccountSettings() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real app, you would validate the form and make an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
    
    setIsLoading(false);
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'delete my account') {
      toast({
        title: "Error",
        description: "Please type 'delete my account' to confirm.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // In a real app, you would make an API call to delete the account
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
    });
    
    // Sign out and redirect to home
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password" 
                required 
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                required 
                minLength={8}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                required 
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download a copy of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a copy of all your data, including tasks, focus sessions, and settings.
            </p>
            <div>
              <Button variant="outline" disabled={isLoading}>
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Export My Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <div className="mt-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                  >
                    Delete My Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    To confirm, type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">delete my account</span> below:
                  </p>
                  <Input 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="delete my account"
                    className="max-w-md"
                  />
                  <div className="flex space-x-2">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={isLoading || deleteConfirmation !== 'delete my account'}
                    >
                      {isLoading ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Permanently Delete Account'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmation('');
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex flex-col space-y-2">
                <h4 className="font-medium">Delete All Data</h4>
                <p className="text-sm text-muted-foreground">
                  Delete all your tasks, focus sessions, and settings, but keep your account.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isLoading}
                    onClick={() => {
                      // This would be implemented to delete all user data
                      toast({
                        title: "Not implemented",
                        description: "This feature is not yet implemented.",
                        variant: "destructive",
                      });
                    }}
                  >
                    Delete All My Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>ADHDAI v1.0.0</p>
        <p>© {new Date().getFullYear()} ADHDAI. All rights reserved.</p>
      </div>
    </div>
  );
}
