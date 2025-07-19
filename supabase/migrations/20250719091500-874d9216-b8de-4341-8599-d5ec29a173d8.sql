-- Create invitations table for managing one-time signup links
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('MANAGER', 'FREELANCER')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations table
-- Managers can create freelancer invitations
CREATE POLICY "Managers can create freelancer invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND 
    role = 'FREELANCER' AND
    EXISTS (
      SELECT 1 FROM public."User" u 
      WHERE u.id = auth.uid() AND u.role = 'MANAGER'
    )
  );

-- Superadmin can create manager invitations (we'll identify superadmin by email for now)
CREATE POLICY "Superadmin can create manager invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND 
    role = 'MANAGER' AND
    auth.email() = 'superadmin@yourcompany.com'
  );

-- Users can view invitations they created
CREATE POLICY "Users can view their invitations" ON public.invitations
  FOR SELECT USING (invited_by = auth.uid());

-- Anyone can read invitations by token (for signup validation)
CREATE POLICY "Public can read invitations by token" ON public.invitations
  FOR SELECT USING (true);

-- Users can update invitations they created (mark as used)
CREATE POLICY "Users can update their invitations" ON public.invitations
  FOR UPDATE USING (invited_by = auth.uid());

-- Create index for faster token lookups
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Add superadmin flag to User table
ALTER TABLE public."User" ADD COLUMN is_superadmin BOOLEAN DEFAULT false;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on invitations
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();