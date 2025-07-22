import { NextRequest, NextResponse } from "next/server";

// Enhanced ADHD-focused responses tailored to each voice agent's personality
const getAgentResponse = (message: string, agent: any, conversationHistory: any[] = []) => {
  const lowerMessage = message.toLowerCase();
  
  // Agent-specific response styles
  const agentResponses = {
    sarah: {
      // Calm & Supportive - gentle, nurturing responses
      focus: "Take a deep breath with me. Let's try a gentle 15-minute focus session. Remember, it's okay to start small and build up gradually.",
      overwhelmed: "I hear you, and what you're feeling is completely valid. Let's break this down into tiny, manageable pieces. What's the smallest step we can take right now?",
      anxiety: "You're safe right now. Let's ground ourselves together. Can you name 3 things you can see around you? I'm here with you through this.",
      struggling: "Some days are harder than others, and that's perfectly normal. You're being so brave by reaching out. What would feel most supportive right now?",
      default: "I'm here to support you with gentle guidance. What's weighing on your heart today?"
    },
    alex: {
      // Energetic & Motivating - high-energy, enthusiastic responses
      focus: "YES! Let's channel that energy! Time for a power session - 25 minutes of pure focus. You've got this champion!",
      motivation: "You're a productivity POWERHOUSE! Every small win is building momentum. Let's ride this wave and crush those goals!",
      energy: "I can feel your energy! Let's harness it - what's the most exciting task on your list? Let's tackle it with full force!",
      goals: "Dream BIG! What's your wildest productivity goal? Let's break it down and make it happen step by step!",
      default: "Ready to ENERGIZE your day? I'm pumped to help you achieve amazing things! What adventure are we tackling?"
    },
    maya: {
      // Organized & Strategic - structured, methodical responses
      planning: "Let's create a strategic plan. First, let's prioritize using the Eisenhower Matrix - urgent vs important. What are your top 3 tasks?",
      organization: "Organization is key to ADHD success. Let's implement the PARA method - Projects, Areas, Resources, Archive. Where shall we start?",
      tasks: "Time for systematic task management. Let's use time-blocking and the 2-minute rule. What's your biggest challenge right now?",
      overwhelmed: "When overwhelmed, we need structure. Let's do a brain dump, then categorize and prioritize. Ready to organize your thoughts?",
      default: "Strategic thinking leads to success. What system or process can we optimize together today?"
    },
    marcus: {
      // Wise & Patient - thoughtful, understanding responses
      patience: "Progress isn't always linear, and that's wisdom worth remembering. Every step forward, no matter how small, matters deeply.",
      wisdom: "In my experience, the most profound growth comes from self-compassion. What would you tell a dear friend in your situation?",
      struggling: "Difficult days teach us resilience. You've overcome challenges before, and you carry that strength within you now.",
      reflection: "Sometimes we need to pause and reflect. What patterns do you notice in your most productive moments?",
      default: "Wisdom comes from understanding ourselves. What insight are you seeking today, my friend?"
    },
    zoe: {
      // Creative & Inspiring - imaginative, innovative responses
      creativity: "Your ADHD brain is a creativity SUPERPOWER! Let's think outside the box - what unconventional approach could work here?",
      inspiration: "Innovation happens when we embrace our unique thinking patterns. What wild idea has been sparking in your mind?",
      problem_solving: "Every problem is a puzzle waiting for a creative solution. Let's brainstorm - no idea is too wild or wonderful!",
      stuck: "When we're stuck, it's time to shift perspectives! What if we approached this like an artist, inventor, or explorer?",
      default: "Your creative mind is magnificent! What inspiring project or idea shall we explore together?"
    },
    ryan: {
      // Tech-Savvy & Practical - efficient, solution-focused responses
      productivity: "Let's optimize your workflow! Have you tried the Pomodoro Technique with focus apps? I can recommend some game-changing tools.",
      technology: "Technology can be your ADHD ally. Let's set up automated systems - task managers, calendar blocking, and notification controls.",
      efficiency: "Efficiency is about working smarter, not harder. What repetitive tasks can we automate or streamline today?",
      tools: "The right tools make all the difference. Let's build your productivity tech stack - apps, shortcuts, and systems that actually work.",
      default: "Ready to hack your productivity? What technical challenge or optimization opportunity are we solving today?"
    }
  };

  // Get agent-specific responses
  const responses = agentResponses[agent.id as keyof typeof agentResponses] || agentResponses.sarah;
  
  // Match keywords to agent specialties and personality
  let reply = "";
  
  if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate')) {
    reply = (responses as any).focus || responses.default;
  } else if (lowerMessage.includes('overwhelm') || lowerMessage.includes('too much')) {
    reply = (responses as any).overwhelmed || responses.default;
  } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worry') || lowerMessage.includes('stress')) {
    reply = (responses as any).anxiety || responses.default;
  } else if (lowerMessage.includes('struggle') || lowerMessage.includes('hard') || lowerMessage.includes('difficult')) {
    reply = (responses as any).struggling || responses.default;
  } else if (lowerMessage.includes('motivat') || lowerMessage.includes('energy')) {
    reply = (responses as any).motivation || (responses as any).energy || responses.default;
  } else if (lowerMessage.includes('plan') || lowerMessage.includes('organiz')) {
    reply = (responses as any).planning || (responses as any).organization || responses.default;
  } else if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
    reply = (responses as any).tasks || responses.default;
  } else if (lowerMessage.includes('creativ') || lowerMessage.includes('idea')) {
    reply = (responses as any).creativity || (responses as any).inspiration || responses.default;
  } else if (lowerMessage.includes('tool') || lowerMessage.includes('app') || lowerMessage.includes('productiv')) {
    reply = (responses as any).productivity || (responses as any).tools || responses.default;
  } else if (lowerMessage.includes('stuck') || lowerMessage.includes('block')) {
    reply = (responses as any).stuck || (responses as any).problem_solving || responses.default;
  } else {
    reply = responses.default;
  }
  
  // Add contextual follow-up based on conversation history
  if (conversationHistory.length > 0) {
    const lastUserMessage = conversationHistory.filter(msg => msg.type === 'user').pop();
    if (lastUserMessage && agent.id === 'maya') {
      reply += " Building on what you shared earlier, shall we create an action plan?";
    } else if (lastUserMessage && agent.id === 'alex') {
      reply += " You're building great momentum - let's keep this energy flowing!";
    }
  }
  
  return reply;
};

export async function POST(req: NextRequest) {
  try {
    const { message, agent, conversationHistory } = await req.json();
    
    if (!message || !agent) {
      return NextResponse.json({ 
        reply: "I didn't receive your message clearly. Could you try again?",
        error: "Missing message or agent data" 
      }, { status: 200 });
    }
    
    // Generate agent-specific response
    const reply = getAgentResponse(message, agent, conversationHistory || []);
    
    // Add response timing optimization
    const responseTime = Date.now();
    
    return NextResponse.json({ 
      reply,
      agent: agent.name,
      responseTime,
      success: true
    });
    
  } catch (err) {
    console.error('Multi-voice AI chat error:', err);
    return NextResponse.json({ 
      reply: "I'm having trouble processing that right now. Let's try a different approach - what's the most important thing on your mind?",
      error: "Processing error",
      success: false
    }, { status: 200 }); // Return 200 so the voice agent can still speak the fallback
  }
}
