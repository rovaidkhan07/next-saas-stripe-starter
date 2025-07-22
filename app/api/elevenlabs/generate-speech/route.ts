import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id, voice_settings } = await req.json();
    
    // Debug logging
    console.log('ElevenLabs API Request:', {
      text: text?.substring(0, 50) + '...',
      voice_id,
      voice_settings
    });
    
    // Check if ElevenLabs API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.warn('ElevenLabs API key not configured, falling back to browser speech synthesis');
      return NextResponse.json({ 
        error: "ElevenLabs API key not configured" 
      }, { status: 400 });
    }
    
    // Validate voice_id
    if (!voice_id) {
      console.error('No voice_id provided');
      return NextResponse.json({ 
        error: "Voice ID is required" 
      }, { status: 400 });
    }

    // ElevenLabs Text-to-Speech API call
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1', // Fast, high-quality model
        voice_settings: {
          stability: voice_settings?.stability || 0.75,
          similarity_boost: voice_settings?.similarity_boost || 0.75,
          style: voice_settings?.style || 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // Return specific error messages based on status
      if (response.status === 401) {
        return NextResponse.json({ 
          error: "Invalid ElevenLabs API key" 
        }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ 
          error: "ElevenLabs rate limit exceeded. Please try again later." 
        }, { status: 429 });
      } else if (response.status === 422) {
        return NextResponse.json({ 
          error: "Invalid voice ID or text too long" 
        }, { status: 422 });
      } else {
        return NextResponse.json({ 
          error: "ElevenLabs service temporarily unavailable" 
        }, { status: 503 });
      }
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio data with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache', // Don't cache audio responses
      },
    });

  } catch (error) {
    console.error('ElevenLabs API route error:', error);
    return NextResponse.json({ 
      error: "Failed to generate speech" 
    }, { status: 500 });
  }
}
