'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/shared/icons';

const avatarOptions = [
  { id: 'avatar1', name: 'Avatar 1', src: '/avatars/avatar1.png' },
  { id: 'avatar2', name: 'Avatar 2', src: '/avatars/avatar2.png' },
  { id: 'avatar3', name: 'Avatar 3', src: '/avatars/avatar3.png' },
  { id: 'avatar4', name: 'Avatar 4', src: '/avatars/avatar4.png' },
];

export default function ProfileSettings() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await update({ name });
      // TODO: Update avatar in database
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={`/avatars/${selectedAvatar}.png`} />
            <AvatarFallback>{name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {avatarOptions.map((avatar) => (
              <div 
                key={avatar.id}
                className={`relative cursor-pointer rounded-full border-2 ${
                  selectedAvatar === avatar.id 
                    ? 'border-primary ring-2 ring-primary' 
                    : 'border-transparent hover:border-primary/50'
                }`}
                onClick={() => setSelectedAvatar(avatar.id)}
              >
                <img 
                  src={avatar.src} 
                  alt={avatar.name} 
                  className="h-16 w-16 rounded-full"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={session?.user?.email || ''} 
              placeholder="Your email"
              disabled
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Bio</Label>
          <textarea 
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us a little about yourself..."
          />
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
