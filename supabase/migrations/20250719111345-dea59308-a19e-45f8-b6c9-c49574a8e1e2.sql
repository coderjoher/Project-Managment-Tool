-- Update the superadmin policy to check is_superadmin column instead of email
DROP POLICY IF EXISTS "Superadmin can create manager invitations" ON public.invitations;

CREATE POLICY "Superadmin can create manager invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND 
    role = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM public."User" u 
      WHERE u.id = auth.uid() AND u.is_superadmin = true
    )
  );

-- Also allow superadmin to delete invitations
CREATE POLICY "Superadmin can delete manager invitations" ON public.invitations
  FOR DELETE USING (
    role = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM public."User" u 
      WHERE u.id = auth.uid() AND u.is_superadmin = true
    )
  );