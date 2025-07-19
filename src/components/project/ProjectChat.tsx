import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectChatProps {
  projectId: string;
  projectTitle: string;
}

interface ChatMessage {
  id: string;
  chatId: string | null;
  directChatId: string | null;
  senderId: string;
  content: string;
  platform: string;
  createdAt: string;
  User: {
    name: string | null;
    email: string;
  };
}

interface ProjectUser {
  id: string;
  name: string | null;
  email: string;
  role: 'MANAGER' | 'FREELANCER';
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, projectTitle }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && user) {
      initializeProjectChat();
    }
  }, [projectId, user]);

  const initializeProjectChat = async () => {
    try {
      // Get project users (manager + accepted freelancers)
      await fetchProjectUsers();
      
      // Get or create project chat
      await getOrCreateProjectChat();
      
    } catch (error: any) {
      toast({
        title: "Error initializing chat",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectUsers = async () => {
    if (!user) return;

    try {
      // Get project manager
      const { data: project, error: projectError } = await supabase
        .from('Project')
        .select('managerId, User!Project_managerId_fkey(name, email)')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get accepted freelancers
      const { data: offers, error: offersError } = await supabase
        .from('Offer')
        .select('freelancerId, User!Offer_freelancerId_fkey(name, email)')
        .eq('projectId', projectId)
        .eq('status', 'ACCEPTED');

      if (offersError) throw offersError;

      const users: ProjectUser[] = [];
      
      // Add manager
      if (project?.User) {
        users.push({
          id: project.managerId,
          name: project.User.name,
          email: project.User.email,
          role: 'MANAGER'
        });
      }

      // Add accepted freelancers
      offers?.forEach(offer => {
        if (offer.User) {
          users.push({
            id: offer.freelancerId,
            name: offer.User.name,
            email: offer.User.email,
            role: 'FREELANCER'
          });
        }
      });

      setProjectUsers(users);
    } catch (error: any) {
      console.error('Error fetching project users:', error);
    }
  };

  const getOrCreateProjectChat = async () => {
    if (!user) return;

    try {
      // Check if project chat already exists
      const { data: existingChats, error: chatError } = await supabase
        .from('Chat')
        .select('id')
        .eq('projectId', projectId)
        .limit(1);

      if (chatError) throw chatError;

      let projectChatId: string;

      if (existingChats && existingChats.length > 0) {
        projectChatId = existingChats[0].id;
      } else {
        // Create new project chat - need an offer to create a chat
        const { data: offers, error: offerError } = await supabase
          .from('Offer')
          .select('id')
          .eq('projectId', projectId)
          .eq('status', 'ACCEPTED')
          .limit(1);

        if (offerError) throw offerError;

        if (offers && offers.length > 0) {
          const newChatId = crypto.randomUUID();
          const { error: createError } = await supabase
            .from('Chat')
            .insert({
              id: newChatId,
              projectId: projectId,
              offerId: offers[0].id
            });

          if (createError) throw createError;
          projectChatId = newChatId;
        } else {
          // No accepted offers yet, can't create project chat
          setChatId(null);
          return;
        }
      }

      setChatId(projectChatId);
      await fetchMessages(projectChatId);
    } catch (error: any) {
      console.error('Error getting/creating project chat:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select(`
          *,
          User(name, email)
        `)
        .eq('chatId', chatId)
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    setSendingMessage(true);
    try {
      const messageId = crypto.randomUUID();
      
      const messageData = {
        id: messageId,
        chatId: chatId,
        directChatId: null,
        senderId: user.id,
        content: newMessage.trim(),
        platform: 'IN_APP' as const
      };

      const { error } = await supabase
        .from('ChatMessage')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(chatId);
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-white/10">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span>Loading chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chatId) {
    return (
      <Card className="bg-gradient-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Project Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No project chat available</h3>
            <p className="text-sm text-muted-foreground text-center">
              Project chat will be available once an offer is accepted.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Project Chat
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {projectUsers.length} participant{projectUsers.length !== 1 ? 's' : ''}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-background/50 rounded-lg">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    message.senderId === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {message.User.name || message.User.email}
                    </span>
                    <span className="text-xs opacity-70">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sendingMessage}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sendingMessage || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};