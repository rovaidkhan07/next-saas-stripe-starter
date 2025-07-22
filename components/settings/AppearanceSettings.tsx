'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Icons } from '@/components/shared/icons';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  const [density, setDensity] = useState('normal');
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
              { value: 'system', label: 'System', icon: 'laptop' },
            ].map((option) => {
              const Icon = Icons[option.icon as keyof typeof Icons];
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border p-4 transition-all',
                    theme === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  )}
                  onClick={() => handleThemeChange(option.value as Theme)}
                >
                  <div className="mb-2 rounded-md bg-muted p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Font Size</Label>
            <div className="flex items-center gap-4 mt-2">
              <Icons.settings className="h-5 w-5 text-muted-foreground" />
              <Slider 
                value={[fontSize]} 
                onValueChange={([value]) => setFontSize(value)}
                min={12}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-right text-sm text-muted-foreground">
                {fontSize}px
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Density</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'comfortable', label: 'Comfortable' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'rounded-md border p-3 text-center text-sm font-medium transition-all',
                    density === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  )}
                  onClick={() => setDensity(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <Label>Accent Color</Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: 'blue', color: 'bg-blue-500' },
              { value: 'green', color: 'bg-green-500' },
              { value: 'purple', color: 'bg-purple-500' },
              { value: 'pink', color: 'bg-pink-500' },
              { value: 'orange', color: 'bg-orange-500' },
            ].map((color) => (
              <button
                key={color.value}
                type="button"
                className={`h-10 w-full rounded-md ${color.color} transition-transform hover:scale-105`}
                aria-label={`${color.value} theme`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
