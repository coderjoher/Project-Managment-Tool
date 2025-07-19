-- Enable realtime for ChatMessage table
ALTER TABLE "ChatMessage" REPLICA IDENTITY FULL;

-- Add ChatMessage table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "ChatMessage";