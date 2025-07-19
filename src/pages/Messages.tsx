import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MessageSquare, Send, Users, Search, Plus, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectChat {
  id: string;
  projectId: string;
  offerId: string;
  createdAt: string;
  Project: {
    title: string;
  };
  Offer: {
    price: number;
    User: {
      name: string | null;
      email: string;
    };
  };
}

interface DirectChat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  createdAt: string;
  updatedAt: string;
  participant1: {
    name: string | null;
    email: string;
  };
  participant2: {
    name: string | null;
    email: string;
  };
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

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface UserProfile {
  role: 'MANAGER' | 'FREELANCER';
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projectChats, setProjectChats] = useState<ProjectChat[]>([]);
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ProjectChat | DirectChat | null>(null);
  const [selectedChatType, setSelectedChatType] = useState<'project' | 'direct'>('project');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
    fetchAllChats();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedChat) {
      if (selectedChatType === 'project') {
        fetchMessages(selectedChat.id, null);
      } else {
        fetchMessages(null, selectedChat.id);
      }
    }
  }, [selectedChat, selectedChatType]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('User')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAllChats = async () => {
    try {
      await Promise.all([fetchProjectChats(), fetchDirectChats(), fetchAvailableUsers()]);
    } catch (error: any) {
      toast({
        title: "Error loading chats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectChats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('Chat')
        .select(`
          *,
          Project(title),
          Offer(price, User(name, email))
        `)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setProjectChats(data || []);
    } catch (error: any) {
      console.error('Error fetching project chats:', error);
    }
  };

  const fetchDirectChats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('DirectChat')
        .select(`
          id,
          participant1Id,
          participant2Id,
          createdAt,
          updatedAt
        `)
        .or(`participant1Id.eq.${user.id},participant2Id.eq.${user.id}`)
        .order('updatedAt', { ascending: false });
      
      if (error) throw error;

      // Fetch participant details separately to avoid complex joins
      const chatsWithParticipants = await Promise.all(
        (data || []).map(async (chat) => {
          const [participant1Response, participant2Response] = await Promise.all([
            supabase.from('User').select('name, email').eq('id', chat.participant1Id).single(),
            supabase.from('User').select('name, email').eq('id', chat.participant2Id).single()
          ]);

          return {
            ...chat,
            participant1: participant1Response.data || { name: null, email: 'Unknown' },
            participant2: participant2Response.data || { name: null, email: 'Unknown' }
          };
        })
      );

      setDirectChats(chatsWithParticipants);
    } catch (error: any) {
      console.error('Error fetching direct chats:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id, name, email')
        .neq('id', user.id);
      
      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (chatId: string | null, directChatId: string | null) => {
    try {
      let query = supabase
        .from('ChatMessage')
        .select(`
          *,
          User(name, email)
        `)
        .order('createdAt', { ascending: true });

      if (chatId) {
        query = query.eq('chatId', chatId);
      } else if (directChatId) {
        query = query.eq('directChatId', directChatId);
      }

      const { data, error } = await query;
      
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
    if (!newMessage.trim() || !selectedChat || !user) return;

    setSendingMessage(true);
    try {
      const messageId = crypto.randomUUID();
      
      const messageData = {
        id: messageId,
        chatId: selectedChatType === 'project' ? selectedChat.id : null,
        directChatId: selectedChatType === 'direct' ? selectedChat.id : null,
        senderId: user.id,
        content: newMessage.trim(),
        platform: 'IN_APP' as const
      };

      const { error } = await supabase
        .from('ChatMessage')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      if (selectedChatType === 'project') {
        fetchMessages(selectedChat.id, null);
      } else {
        fetchMessages(null, selectedChat.id);
      }
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

  const handleCreateDirectChat = async () => {
    if (!selectedUserId || !user) return;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('DirectChat')
        .select('id')
        .or(`and(participant1Id.eq.${user.id},participant2Id.eq.${selectedUserId}),and(participant1Id.eq.${selectedUserId},participant2Id.eq.${user.id})`)
        .maybeSingle();

      if (existingChat) {
        toast({
          title: "Chat already exists",
          description: "You already have a conversation with this user.",
        });
        setShowNewChatDialog(false);
        return;
      }

      const chatId = crypto.randomUUID();
      const { error } = await supabase
        .from('DirectChat')
        .insert({
          id: chatId,
          participant1Id: user.id,
          participant2Id: selectedUserId
        });

      if (error) throw error;

      toast({
        title: "Chat created",
        description: "New conversation started successfully.",
      });

      setShowNewChatDialog(false);
      setSelectedUserId('');
      fetchDirectChats();
    } catch (error: any) {
      toast({
        title: "Error creating chat",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getChatDisplayName = (chat: ProjectChat | DirectChat, type: 'project' | 'direct') => {
    if (type === 'project') {
      const projectChat = chat as ProjectChat;
      return projectChat.Project?.title || 'Untitled Project';
    } else {
      const directChat = chat as DirectChat;
      const otherParticipant = directChat.participant1Id === user?.id 
        ? directChat.participant2 
        : directChat.participant1;
      return otherParticipant?.name || otherParticipant?.email || 'Unknown User';
    }
  };

  const getChatSecondaryInfo = (chat: ProjectChat | DirectChat, type: 'project' | 'direct') => {
    if (type === 'project') {
      const projectChat = chat as ProjectChat;
      return `with ${projectChat.Offer?.User?.name || projectChat.Offer?.User?.email || 'Unknown'}`;
    } else {
      return 'Direct message';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Loading messages...</span>
        </div>
      </div>
    );
  }

  const currentChats = selectedChatType === 'project' ? projectChats : directChats;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Real-time project and direct communication</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Chat List */}
          <Card className="bg-gradient-card border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Conversations
                </CardTitle>
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4 mr-1" />
                      New Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Chat</DialogTitle>
                      <DialogDescription>
                        Select a user to start a direct conversation with.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateDirectChat} 
                          disabled={!selectedUserId}
                          className="flex-1"
                        >
                          Start Chat
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNewChatDialog(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Tabs value={selectedChatType} onValueChange={(value) => {
                setSelectedChatType(value as 'project' | 'direct');
                setSelectedChat(null);
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="project">Project Chats</TabsTrigger>
                  <TabsTrigger value="direct">Direct Messages</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {currentChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {selectedChatType === 'project' 
                      ? 'Project conversations will appear here when you start collaborating.'
                      : 'Direct messages will appear here when you start chatting with users.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/20'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {getChatDisplayName(chat, selectedChatType)}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {getChatSecondaryInfo(chat, selectedChatType)}
                          </p>
                        </div>
                        {selectedChatType === 'project' && (
                          <Badge variant="outline" className="text-xs">
                            ${(chat as ProjectChat).Offer?.price || 0}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          No messages yet
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chat.createdAt), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2 bg-gradient-card border-white/10">
            {selectedChat ? (
              <>
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-lg">
                    {getChatDisplayName(selectedChat, selectedChatType)}
                  </CardTitle>
                  <CardDescription>
                    {getChatSecondaryInfo(selectedChat, selectedChatType)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-[500px]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
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
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-white/10">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sendingMessage}
                    />
                    <Button type="submit" size="icon" disabled={sendingMessage || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the left to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;