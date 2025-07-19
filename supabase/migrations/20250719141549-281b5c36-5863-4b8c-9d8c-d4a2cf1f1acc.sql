-- Create a more comprehensive chat system

-- First, let's create a table for user-to-user direct chats (not tied to projects/offers)
CREATE TABLE IF NOT EXISTS public."DirectChat" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "participant1Id" UUID NOT NULL,
  "participant2Id" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for DirectChat
ALTER TABLE public."DirectChat" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their direct chats" 
ON public."DirectChat" 
FOR SELECT 
USING (
  auth.uid() = "participant1Id" OR 
  auth.uid() = "participant2Id"
);

CREATE POLICY "Users can create direct chats" 
ON public."DirectChat" 
FOR INSERT 
WITH CHECK (
  auth.uid() = "participant1Id" OR 
  auth.uid() = "participant2Id"
);

-- Update ChatMessage table to support direct chats
ALTER TABLE public."ChatMessage" ADD COLUMN IF NOT EXISTS "directChatId" UUID REFERENCES public."DirectChat"(id) ON DELETE CASCADE;

-- Make chatId nullable since we now have two types of chats
ALTER TABLE public."ChatMessage" ALTER COLUMN "chatId" DROP NOT NULL;

-- Add constraint to ensure message belongs to either a project chat or direct chat
ALTER TABLE public."ChatMessage" ADD CONSTRAINT "chat_message_type_check" 
CHECK (
  ("chatId" IS NOT NULL AND "directChatId" IS NULL) OR 
  ("chatId" IS NULL AND "directChatId" IS NOT NULL)
);

-- Enable RLS on existing tables if not already enabled
ALTER TABLE public."Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_direct_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_direct_chat_updated_at
    BEFORE UPDATE ON public."DirectChat"
    FOR EACH ROW
    EXECUTE FUNCTION public.update_direct_chat_updated_at();