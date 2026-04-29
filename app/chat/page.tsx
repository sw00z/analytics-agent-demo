import { ChatShell } from "./chat-shell";

export const metadata = {
  title: "Analytics Agent · Demo",
  description:
    "Natural-language BI agent over a public e-commerce dataset. Generates SQL, runs it through a four-layer safety filter, and renders charts.",
};

export default function ChatPage() {
  return <ChatShell />;
}
