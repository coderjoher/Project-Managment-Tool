import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteInvitationRequest {
  token: string;
  userId: string;
  name?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { token, userId, name }: CompleteInvitationRequest = await req.json();

    if (!token || !userId) {
      return new Response('Missing token or userId', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      return new Response('Invalid invitation token', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Check if invitation is still valid (not expired and not used)
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt || invitation.used_at) {
      return new Response('Invitation is no longer valid', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ used_at: now.toISOString() })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response('Failed to complete invitation', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Create user profile with the correct role
    const { error: profileError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: invitation.email,
        role: invitation.role,
        name: name || invitation.email.split('@')[0], // Use provided name or default from email
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return new Response('Failed to create user profile', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log(`Invitation completed successfully for user ${userId} with role ${invitation.role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation completed successfully',
        role: invitation.role
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in complete-invitation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});