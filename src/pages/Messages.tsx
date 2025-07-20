import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Pin,
  Phone,
  Video,
  MoreHorizontal,
  Send,
  Paperclip,
  Smile,
  Info,
  Bell,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  Users,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filterChats = (chats: (ProjectChat | DirectChat)[], searchTerm: string, type: 'project' | 'direct') => {
    if (!searchTerm) return chats;

    return chats.filter(chat => {
      const displayName = getChatDisplayName(chat, type).toLowerCase();
      return displayName.includes(searchTerm.toLowerCase());
    });
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

  const currentChats = filterChats(
    selectedChatType === 'project' ? projectChats : directChats,
    searchTerm,
    selectedChatType
  );

  return (
    <MainLayout userProfile={userProfile} >
      <div className="flex h-[90svh]">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 border-r border-border flex flex-col bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                Messages
              </h1>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <UserPlus className="w-4 h-4" />
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
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/30 border-border"
              />
            </div>

            {/* Chat Type Tabs */}
            <div className="flex bg-muted/30 rounded-lg p-1">
              <button
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${selectedChatType === 'project'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                onClick={() => {
                  setSelectedChatType('project');
                  setSelectedChat(null);
                }}
              >
                Projects
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${selectedChatType === 'direct'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                onClick={() => {
                  setSelectedChatType('direct');
                  setSelectedChat(null);
                }}
              >
                Direct
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {currentChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
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
              currentChats.map((chat) => {
                const displayName = getChatDisplayName(chat, selectedChatType);
                const isSelected = selectedChat?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator for direct chats */}
                      {selectedChatType === 'direct' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{displayName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(chat.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate text-muted-foreground">
                          {messages.length === 0 ? 'No messages yet' : 'Click to view messages'}
                        </p>
                        {selectedChatType === 'project' && (
                          <Badge className="bg-green-500 text-white text-xs h-5 px-1.5 rounded-full">
                            ${(chat as ProjectChat).Offer?.price || 0}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getInitials(getChatDisplayName(selectedChat, selectedChatType))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">{getChatDisplayName(selectedChat, selectedChatType)}</h2>
                      <p className="text-sm text-muted-foreground">{getChatSecondaryInfo(selectedChat, selectedChatType)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {format(new Date(), "MMMM d, yyyy")}
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    const senderName = message.User.name || message.User.email || 'Unknown';

                    return (
                      <div key={message.id} className={`flex gap-3 ${isOwn ? 'justify-end' : ''}`}>
                        {!isOwn && (
                          <Avatar className="w-8 h-8 mt-1">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                              {getInitials(senderName)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
                          {!isOwn && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-primary">{senderName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), 'h:mm a')}
                              </span>
                            </div>
                          )}

                          <div className={`rounded-2xl px-4 py-2 ${isOwn
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                            }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {isOwn && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {format(new Date(message.createdAt), 'h:mm a')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isOwn && (
                          <Avatar className="w-8 h-8 mt-1">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-xs">
                              You
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="pr-10 bg-muted/30 border-border"
                      disabled={sendingMessage}
                    />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the left to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Messages;