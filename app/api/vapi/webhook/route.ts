import { NextRequest, NextResponse } from 'next/server';

// Vapi webhook handler for voice events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log Vapi events for debugging
    console.log('Vapi webhook event:', {
      type: body.type,
      timestamp: new Date().toISOString(),
      data: body
    });

    // Handle different Vapi event types
    switch (body.type) {
      case 'call-start':
        console.log('Call started:', body.call?.id);
        break;
        
      case 'call-end':
        console.log('Call ended:', body.call?.id, 'Duration:', body.call?.duration);
        break;
        
      case 'transcript':
        console.log('Transcript:', body.transcript);
        break;
        
      case 'function-call':
        // Handle function calls from the AI assistant
        return handleFunctionCall(body);
        
      default:
        console.log('Unknown event type:', body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleFunctionCall(body: any) {
  const { functionCall } = body;
  
  switch (functionCall.name) {
    case 'get_focus_tips':
      return NextResponse.json({
        result: {
          tips: [
            "Try the Pomodoro Technique: 25 minutes focused work, 5 minute break",
            "Remove distractions from your workspace",
            "Break large tasks into smaller, manageable chunks",
            "Use background music or white noise if it helps you concentrate"
          ]
        }
      });
      
    case 'track_mood':
      // In a real app, you'd save this to your database
      const mood = functionCall.parameters?.mood;
      console.log('User mood tracked:', mood);
      return NextResponse.json({
        result: {
          message: `Mood "${mood}" tracked successfully. Thank you for sharing how you're feeling.`
        }
      });
      
    case 'create_task':
      // In a real app, you'd save this to your database
      const task = functionCall.parameters?.task;
      console.log('Task created:', task);
      return NextResponse.json({
        result: {
          message: `Task "${task}" added to your list. You're doing great staying organized!`
        }
      });
      
    default:
      return NextResponse.json({
        error: `Unknown function: ${functionCall.name}`
      });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Vapi webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
