import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // Enhanced ADHD-focused AI responses
    const adhdResponses = {
      // Focus and productivity
      focus: "Try the Pomodoro technique! Work for 25 minutes, then take a 5-minute break. This helps maintain focus without overwhelming your brain.",
      productivity: "Break large tasks into smaller, manageable chunks. Celebrate each small win - your brain loves those dopamine hits!",
      motivation: "Remember, progress isn't always linear. Some days are harder than others, and that's completely normal. You're doing great!",
      
      // Task management
      tasks: "Prioritize your tasks using the 'brain dump' method. Write everything down, then pick just 1-3 most important items for today.",
      overwhelmed: "When feeling overwhelmed, try the 2-minute rule: if something takes less than 2 minutes, do it now. Otherwise, schedule it.",
      
      // Emotional support
      struggling: "It's okay to have difficult days. Try some deep breathing: inhale for 4 counts, hold for 4, exhale for 6. You've got this!",
      anxiety: "Ground yourself with the 5-4-3-2-1 technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
      
      // Default responses
      default: [
        "I'm here to help you stay focused and productive! What's on your mind?",
        "Let's tackle this together! What would you like to work on?",
        "Your ADHD brain is unique and powerful. How can I support you today?",
        "Remember, different doesn't mean deficient. What's your biggest challenge right now?"
      ]
    };
    
    // Simple keyword matching for ADHD-specific responses
    const lowerMessage = message.toLowerCase();
    let reply = "";
    
    if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate')) {
      reply = adhdResponses.focus;
    } else if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('work')) {
      reply = adhdResponses.tasks;
    } else if (lowerMessage.includes('overwhelm') || lowerMessage.includes('too much')) {
      reply = adhdResponses.overwhelmed;
    } else if (lowerMessage.includes('struggle') || lowerMessage.includes('hard') || lowerMessage.includes('difficult')) {
      reply = adhdResponses.struggling;
    } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worry') || lowerMessage.includes('stress')) {
      reply = adhdResponses.anxiety;
    } else if (lowerMessage.includes('motivat') || lowerMessage.includes('energy')) {
      reply = adhdResponses.motivation;
    } else if (lowerMessage.includes('productiv')) {
      reply = adhdResponses.productivity;
    } else {
      // Random default response
      const defaults = adhdResponses.default;
      reply = defaults[Math.floor(Math.random() * defaults.length)];
    }
    
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ 
      reply: "I'm having trouble processing that right now. Try asking about focus, tasks, or how you're feeling today!",
      error: "Processing error" 
    }, { status: 200 }); // Return 200 so the voice agent can still speak the fallback
  }
}
