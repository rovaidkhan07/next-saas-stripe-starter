'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';

type VoiceGender = 'male' | 'female' | 'neutral';
type VoiceSpeed = 'slow' | 'normal' | 'fast';
type AIStyle = 'professional' | 'casual' | 'encouraging' | 'direct';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

export default function AISettings() {
  const [aiVoiceEnabled, setAIVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('neutral');
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>('normal');
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [aiStyle, setAIStyle] = useState<AIStyle>('encouraging');
  const [language, setLanguage] = useState('en');
  
  const playSampleVoice = () => {
    if (typeof window === 'undefined') return;
    
    const utterance = new SpeechSynthesisUtterance('This is a sample of how I will sound.');
    utterance.rate = voiceSpeed === 'slow' ? 0.8 : voiceSpeed === 'fast' ? 1.2 : 1;
    utterance.volume = voiceVolume / 100;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => {
      if (voiceGender === 'male') return voice.name.toLowerCase().includes('male') || voice.name.includes('Google UK English Male');
      if (voiceGender === 'female') return voice.name.toLowerCase().includes('female') || voice.name.includes('Google UK English Female');
      return true;
    });
    
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>Customize your AI assistant's behavior and voice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">AI Voice</h4>
              <p className="text-sm text-muted-foreground">Enable voice feedback from your AI assistant</p>
            </div>
            <Switch 
              checked={aiVoiceEnabled} 
              onCheckedChange={setAIVoiceEnabled} 
            />
          </div>
          
          {aiVoiceEnabled && (
            <div className="ml-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="voice-gender">Voice Gender</Label>
                  <Select 
                    value={voiceGender} 
                    onValueChange={(value) => setVoiceGender(value as VoiceGender)}
                  >
                    <SelectTrigger id="voice-gender">
                      <SelectValue placeholder="Select voice gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voice-speed">Voice Speed</Label>
                  <Select 
                    value={voiceSpeed} 
                    onValueChange={(value) => setVoiceSpeed(value as VoiceSpeed)}
                  >
                    <SelectTrigger id="voice-speed">
                      <SelectValue placeholder="Select voice speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Voice Volume: {voiceVolume}%</Label>
                <div className="flex items-center gap-4">
                  <Icons.settings className="h-4 w-4 text-muted-foreground" />
                  <Slider 
                    value={[voiceVolume]} 
                    onValueChange={([value]) => setVoiceVolume(value)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Icons.settings className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={playSampleVoice}
                >
                  <Icons.settings className="h-4 w-4" />
                  <span>Preview Voice</span>
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-style">AI Communication Style</Label>
            <Select 
              value={aiStyle} 
              onValueChange={(value) => setAIStyle(value as AIStyle)}
            >
              <SelectTrigger id="ai-style">
                <SelectValue placeholder="Select communication style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="encouraging">Encouraging</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {aiStyle === 'professional' && 'The AI will use formal language and professional tone.'}
              {aiStyle === 'casual' && 'The AI will use a friendly, conversational tone.'}
              {aiStyle === 'encouraging' && 'The AI will provide positive reinforcement and encouragement.'}
              {aiStyle === 'direct' && 'The AI will be concise and to the point.'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select 
              value={language} 
              onValueChange={setLanguage}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">AI Features</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Task Suggestions</Label>
                <p className="text-sm text-muted-foreground">Get AI-powered task suggestions</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Focus Session Insights</Label>
                <p className="text-sm text-muted-foreground">Receive insights after focus sessions</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Productivity Analysis</Label>
                <p className="text-sm text-muted-foreground">Get weekly productivity reports</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
