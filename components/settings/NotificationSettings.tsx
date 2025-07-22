'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>('immediate');
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [browserSupportsNotifications, setBrowserSupportsNotifications] = useState(true);
  
  // Check if browser supports notifications
  useEffect(() => {
    setBrowserSupportsNotifications('Notification' in window);
  }, []);
  
  // Request notification permission if needed
  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled && browserSupportsNotifications && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushNotifications(false);
        return;
      }
    }
    setPushNotifications(enabled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Notification Channels</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
              </div>
              <Switch 
                checked={pushNotifications} 
                onCheckedChange={handlePushNotificationToggle} 
                disabled={!browserSupportsNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications within the app</p>
              </div>
              <Switch 
                checked={inAppNotifications} 
                onCheckedChange={setInAppNotifications} 
              />
            </div>
            
            {!browserSupportsNotifications && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Your browser does not support push notifications
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about upcoming and overdue tasks</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Break Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded to take breaks</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Goal Progress</Label>
                <p className="text-sm text-muted-foreground">Receive updates on your progress</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Productivity Tips</Label>
                <p className="text-sm text-muted-foreground">Get helpful productivity tips and suggestions</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notification Frequency</h4>
              <p className="text-sm text-muted-foreground">How often you want to receive notifications</p>
            </div>
            <Select 
              value={notificationFrequency} 
              onValueChange={(value) => setNotificationFrequency(value as NotificationFrequency)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Do Not Disturb</h4>
              <p className="text-sm text-muted-foreground">Pause notifications during specific hours</p>
            </div>
            <Switch 
              checked={dndEnabled} 
              onCheckedChange={setDndEnabled} 
            />
          </div>
          
          {dndEnabled && (
            <div className="ml-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dnd-start">Start Time</Label>
                  <Input 
                    id="dnd-start" 
                    type="time" 
                    value={dndStart} 
                    onChange={(e) => setDndStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dnd-end">End Time</Label>
                  <Input 
                    id="dnd-end" 
                    type="time" 
                    value={dndEnd} 
                    onChange={(e) => setDndEnd(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Notifications will be paused from {dndStart} to {dndEnd}
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Notification Sounds</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Sounds</Label>
                <p className="text-sm text-muted-foreground">Play sound for notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="space-y-2">
              <Label>Notification Sound</Label>
              <Select defaultValue="default">
                <SelectTrigger>
                  <SelectValue placeholder="Select sound" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="chime">Chime</SelectItem>
                  <SelectItem value="bell">Bell</SelectItem>
                  <SelectItem value="ding">Ding</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Volume</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Quiet</span>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4"></div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Loud</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
