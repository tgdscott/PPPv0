import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Bot, User, ArrowLeft } from 'lucide-react';

export default function TemplateWizard({ user, token, onBack, onTemplateCreated }) {
  const [history, setHistory] = useState([
    { role: 'assistant', content: "Hello! I'm the Podcast Pro Plus Template Wizard. I'm here to help you create a new podcast template. First, what would you like to name your podcast?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newHistory = [...history, { role: 'user', content: userInput }];
    setHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/wizard/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ history: newHistory, user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from the wizard.');
      }

      const data = await response.json();

      if (data.is_template) {
        // The wizard has finished and returned a template
        await fetch('/api/templates/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data.template),
        });
        onTemplateCreated();
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <Card className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Bot /> Podcast Template Wizard</CardTitle>
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {history.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <Bot className="w-6 h-6 text-blue-500" />}
              <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 text-gray-500" />}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}