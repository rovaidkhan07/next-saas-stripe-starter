import { NextRequest, NextResponse } from "next/server";

// Enhanced voice processing API for natural conversation flow
export async function POST(req: NextRequest) {
  try {
    const { 
      audioData, 
      transcript, 
      agent, 
      conversationContext,
      processingMode = "standard" // standard, continuous, interrupt
    } = await req.json();

    console.log('Enhanced voice processing request:', {
      transcript: transcript?.substring(0, 50) + '...',
      agent: agent?.name,
      mode: processingMode
    });

    // Enhanced transcript processing with context awareness
    const processedTranscript = await enhanceTranscript(transcript, conversationContext);
    
    // Determine response urgency and type
    const responseMetadata = analyzeResponseNeeds(processedTranscript, agent);
    
    // Generate contextually aware response
    const enhancedResponse = await generateContextualResponse(
      processedTranscript, 
      agent, 
      conversationContext,
      responseMetadata
    );

    return NextResponse.json({
      success: true,
      processedTranscript,
      response: enhancedResponse.text,
      responseMetadata: {
        urgency: responseMetadata.urgency,
        emotion: responseMetadata.emotion,
        shouldInterrupt: responseMetadata.shouldInterrupt,
        conversationFlow: responseMetadata.conversationFlow
      },
      voiceSettings: {
        speed: responseMetadata.emotion === 'excited' ? 1.1 : 
               responseMetadata.emotion === 'calm' ? 0.9 : 1.0,
        stability: responseMetadata.urgency === 'high' ? 0.8 : 0.75,
        clarity: 0.8
      }
    });

  } catch (error) {
    console.error('Enhanced voice processing error:', error);
    return NextResponse.json({
      success: false,
      error: "Voice processing failed",
      fallbackResponse: "I'm having trouble processing that. Could you repeat it?"
    }, { status: 500 });
  }
}

// Enhance transcript with context and noise reduction
async function enhanceTranscript(transcript: string, context: any[]): Promise<string> {
  if (!transcript) return "";
  
  // Basic transcript cleaning
  let enhanced = transcript
    .toLowerCase()
    .replace(/\b(um|uh|like|you know)\b/g, '') // Remove filler words
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Context-aware corrections based on ADHD conversation patterns
  const adhdPatterns = {
    'focus': ['focus', 'concentrate', 'attention'],
    'task': ['task', 'todo', 'work', 'assignment'],
    'time': ['time', 'schedule', 'deadline', 'timer'],
    'mood': ['feel', 'mood', 'emotion', 'stress', 'anxiety']
  };

  // Apply context-based corrections
  for (const [category, keywords] of Object.entries(adhdPatterns)) {
    if (keywords.some(keyword => enhanced.includes(keyword))) {
      // Add context markers for better AI response
      enhanced = `[${category}] ${enhanced}`;
      break;
    }
  }

  return enhanced;
}

// Analyze what type of response is needed
function analyzeResponseNeeds(transcript: string, agent: any) {
  const urgentKeywords = ['help', 'panic', 'overwhelmed', 'crisis', 'emergency'];
  const calmKeywords = ['relax', 'breathe', 'calm', 'peaceful'];
  const excitedKeywords = ['excited', 'motivated', 'energy', 'let\'s go'];
  
  const isUrgent = urgentKeywords.some(word => transcript.toLowerCase().includes(word));
  const isCalm = calmKeywords.some(word => transcript.toLowerCase().includes(word));
  const isExcited = excitedKeywords.some(word => transcript.toLowerCase().includes(word));

  return {
    urgency: isUrgent ? 'high' : 'normal',
    emotion: isExcited ? 'excited' : isCalm ? 'calm' : 'neutral',
    shouldInterrupt: isUrgent,
    conversationFlow: transcript.includes('?') ? 'question' : 'statement'
  };
}

// Generate contextually aware response
async function generateContextualResponse(
  transcript: string, 
  agent: any, 
  context: any[],
  metadata: any
) {
  // Enhanced ADHD-focused responses based on agent personality and context
  const responses = {
    sarah: {
      urgent: "I hear that you're feeling overwhelmed. Let's take this one step at a time. First, take a deep breath with me.",
      calm: "That sounds peaceful. It's wonderful when we can find those calm moments. How can I help you maintain this feeling?",
      excited: "I love your enthusiasm! Let's channel that energy into something productive. What would you like to focus on?",
      default: "I'm here to support you. Tell me more about what's on your mind."
    },
    maya: {
      urgent: "Let's break this down systematically. What's the most pressing thing we need to address right now?",
      calm: "Perfect timing for some planning. What goals would you like to organize today?",
      excited: "Great energy! Let's create a structured plan to make the most of this motivation.",
      default: "I can help you organize your thoughts and create a clear plan. What's your priority?"
    },
    alex: {
      urgent: "Hey, we've got this! Let's tackle this challenge head-on. What's the first small step we can take?",
      calm: "Nice! This is a great mindset for getting things done. What do you want to accomplish?",
      excited: "YES! I'm feeling that energy too! Let's turn this excitement into action. What's your goal?",
      default: "I'm pumped to help you succeed! What challenge are we conquering today?"
    },
    marcus: {
      urgent: "I understand this feels difficult right now. Remember, every challenge is an opportunity to grow stronger.",
      calm: "Wisdom often comes in quiet moments like these. What insights are you discovering?",
      excited: "Your enthusiasm is inspiring. How can we use this positive energy wisely?",
      default: "I'm here to offer guidance and support. What wisdom can I share with you today?"
    },
    zoe: {
      urgent: "Let's get creative with solutions! Sometimes the best answers come from thinking outside the box.",
      calm: "This peaceful energy is perfect for creative thinking. What ideas are flowing for you?",
      excited: "I love this creative spark! Let's brainstorm some innovative approaches to your goals.",
      default: "I'm excited to explore creative solutions with you. What's inspiring you today?"
    },
    ryan: {
      urgent: "Let's troubleshoot this efficiently. What's the core issue we need to solve?",
      calm: "Good mindset for focused work. What systems or tools can help you stay productive?",
      excited: "Great energy for tackling some serious productivity! What's your biggest goal right now?",
      default: "I'm here to optimize your workflow. What productivity challenge can I help solve?"
    }
  };

  const agentResponses = responses[agent.id] || responses.sarah;
  const responseText = agentResponses[metadata.emotion] || agentResponses.default;

  return {
    text: responseText,
    confidence: 0.9
  };
}
