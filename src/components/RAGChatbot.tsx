import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { DocumentPanel } from "./DocumentPanel";
import { StudiesChart } from "./StudiesChart";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { PanelLeftOpen, PanelLeftClose, BarChart3, FileText } from "lucide-react";
import nasaHero from "@/assets/nasa-hero.jpg";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Document {
  id: string;
  title: string;
  score: number;
  snippet?: string;
}

interface Study {
  title: string;
  score: number;
}

interface ApiResponse {
  answer: string;
  docs: Document[];
  chart: Study[];
}

export function RAGChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your NASA RAG Assistant. Ask me anything about space missions, research, or NASA projects.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activePanel, setActivePanel] = useState<'documents' | 'chart'>('documents');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setDocuments(data.docs || []);
      setStudies(data.chart || []);

      if (data.docs?.length > 0 || data.chart?.length > 0) {
        setShowSidebar(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Demo response for development
      const demoResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${message}". This is a demo response since the backend isn't connected yet. The RAG system would typically retrieve relevant NASA documents and provide research-backed answers about space missions, technology, and scientific discoveries.`,
        isUser: false,
        timestamp: new Date(),
      };

      const demoDocs: Document[] = [
        { id: '1', title: 'Apollo Mission Technical Report', score: 0.92, snippet: 'Comprehensive analysis of lunar mission objectives and outcomes...' },
        { id: '2', title: 'Mars Exploration Program Overview', score: 0.87, snippet: 'Current and future Mars exploration initiatives and rover missions...' },
        { id: '3', title: 'International Space Station Research', score: 0.81, snippet: 'Scientific experiments and international collaboration in space...' },
      ];

      const demoStudies: Study[] = [
        { title: 'Lunar Sample Analysis', score: 0.89 },
        { title: 'Mars Soil Composition', score: 0.85 },
        { title: 'Solar Panel Efficiency', score: 0.78 },
        { title: 'Rocket Propulsion Systems', score: 0.72 },
      ];

      setMessages(prev => [...prev, demoResponse]);
      setDocuments(demoDocs);
      setStudies(demoStudies);
      setShowSidebar(true);

      toast({
        title: "Demo Mode",
        description: "Backend not connected. Showing demo data.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={nasaHero} alt="NASA" className="h-8 w-12 object-cover rounded" />
            <h1 className="text-xl font-semibold text-foreground">NASA RAG Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePanel('documents')}
              className={activePanel === 'documents' ? 'bg-primary text-primary-foreground' : ''}
            >
              <FileText className="h-4 w-4 mr-1" />
              Docs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePanel('chart')}
              className={activePanel === 'chart' ? 'bg-primary text-primary-foreground' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Studies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
            </div>
          </ScrollArea>
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-l bg-card">
            {activePanel === 'documents' ? (
              <DocumentPanel documents={documents} isVisible={true} />
            ) : (
              <StudiesChart studies={studies} isVisible={true} />
            )}
          </div>
        )}
      </div>

      {/* Mobile Collapsible Panels */}
      <div className="md:hidden">
        {showSidebar && (
          <Card className="m-4 mt-0">
            {activePanel === 'documents' ? (
              <DocumentPanel documents={documents} isVisible={true} />
            ) : (
              <StudiesChart studies={studies} isVisible={true} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}