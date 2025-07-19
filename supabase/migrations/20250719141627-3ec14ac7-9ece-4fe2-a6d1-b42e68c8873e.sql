-- Add RLS policies for Chat and ChatMessage tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project chats" ON public."Chat";
DROP POLICY IF EXISTS "Users can create project chats" ON public."Chat";
DROP POLICY IF EXISTS "Users can view chat messages" ON public."ChatMessage";
DROP POLICY IF EXISTS "Users can insert chat messages" ON public."ChatMessage";

-- Create policies for Chat table
CREATE POLICY "Users can view project chats" 
ON public."Chat" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "Chat"."projectId"
    AND (
      p."managerId" = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public."Offer" o 
        WHERE o."projectId" = p.id AND o."freelancerId" = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create project chats" 
ON public."Chat" 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = "Chat"."projectId"
    AND (
      p."managerId" = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public."Offer" o 
        WHERE o."projectId" = p.id AND o."freelancerId" = auth.uid()
      )
    )
  )
);

-- Create policies for ChatMessage table to handle both project and direct chats
CREATE POLICY "Users can view chat messages" 
ON public."ChatMessage" 
FOR SELECT 
USING (
  -- Project/offer chats
  ("chatId" IS NOT NULL AND EXISTS (
    SELECT 1 FROM public."Chat" c, public."Project" p
    WHERE c.id = "ChatMessage"."chatId" 
    AND c."projectId" = p.id
    AND (
      p."managerId" = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public."Offer" o 
        WHERE o."projectId" = p.id AND o."freelancerId" = auth.uid()
      )
    )
  )) OR
  -- Direct chats
  ("directChatId" IS NOT NULL AND EXISTS (
    SELECT 1 FROM public."DirectChat" dc
    WHERE dc.id = "ChatMessage"."directChatId"
    AND (dc."participant1Id" = auth.uid() OR dc."participant2Id" = auth.uid())
  ))
);

CREATE POLICY "Users can insert chat messages" 
ON public."ChatMessage" 
FOR INSERT 
WITH CHECK (
  "senderId" = auth.uid() AND (
    -- Project/offer chats
    ("chatId" IS NOT NULL AND EXISTS (
      SELECT 1 FROM public."Chat" c, public."Project" p
      WHERE c.id = "ChatMessage"."chatId" 
      AND c."projectId" = p.id
      AND (
        p."managerId" = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public."Offer" o 
          WHERE o."projectId" = p.id AND o."freelancerId" = auth.uid()
        )
      )
    )) OR
    -- Direct chats
    ("directChatId" IS NOT NULL AND EXISTS (
      SELECT 1 FROM public."DirectChat" dc
      WHERE dc.id = "ChatMessage"."directChatId"
      AND (dc."participant1Id" = auth.uid() OR dc."participant2Id" = auth.uid())
    ))
  )
);