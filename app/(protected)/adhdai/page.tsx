import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import VapiVoiceAgent from "@/components/voice/vapi-voice-agent";

export const metadata = constructMetadata({
  title: "ADHD AI - Rapid Voice Assistant",
  description: "Your AI-powered ADHD productivity assistant with rapid voice responses powered by Vapi AI",
});

export default async function ADHDAIDashboard() {
  const user = await getCurrentUser();

  return (
    <VapiVoiceAgent fullScreen={true} />
  );
}
