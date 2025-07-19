import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, Shield, Zap, AlertCircle } from 'lucide-react';

interface Invitation {
  email: string;
  role: 'MANAGER' | 'FREELANCER';
  token: string;
}

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'FREELANCER'>('FREELANCER');
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check for invite token
  useEffect(() => {
    const inviteToken = searchParams.get('token');
    if (inviteToken) {
      validateInviteToken(inviteToken);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    setInvitationLoading(true);
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        toast({
          title: 'Invalid or expired token',
          description: 'This signup link is no longer valid.',
          variant: 'destructive',
        });
        navigate('/', { replace: true });
      } else {
        setRole(invite.role as 'MANAGER' | 'FREELANCER');
        setInvitation({
          email: invite.email,
          role: invite.role as 'MANAGER' | 'FREELANCER',
          token: invite.token,
        });
        // Pre-fill email if provided in invitation
        if (invite.email) {
          setEmail(invite.email);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error loading invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if signup is invitation-only
    if (!invitation) {
      toast({
        title: "Invitation Required",
        description: "You need an invitation to sign up. Please contact an administrator.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate name field
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password, role);

    if (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      try {
        // Create user profile
        const { error: profileError } = await supabase
          .from('User')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name.trim(),
            role: role,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw profileError;
        }

        // Mark invitation as used using the complete-invitation function
        try {
          const { error: completeError } = await supabase.functions.invoke('complete-invitation', {
            body: {
              token: invitation.token,
              userId: data.user.id,
              name: name.trim()
            }
          });

          if (completeError) {
            console.error('Complete invitation function error:', completeError);
            // Fallback: try direct update
            const { error: directError } = await supabase
              .from('invitations')
              .update({ used_at: new Date().toISOString() })
              .eq('token', invitation.token);
            
            if (directError) {
              console.error('Direct update also failed:', directError);
            }
          } else {
            console.log('Successfully marked invitation as used via function');
          }
        } catch (functionError) {
          console.error('Function invocation failed:', functionError);
          // Fallback: try direct update
          const { error: directError } = await supabase
            .from('invitations')
            .update({ used_at: new Date().toISOString() })
            .eq('token', invitation.token);
          
          if (directError) {
            console.error('Direct update also failed:', directError);
          }
        }

        toast({
          title: "Welcome!",
          description: `Your ${role.toLowerCase()} account has been created successfully.`,
        });
      } catch (error: any) {
        console.error('Error completing signup:', error);
        toast({
          title: "Signup Error",
          description: "Account created but there was an issue setting up your profile. Please try signing in.",
          variant: "destructive",
        });
      }
    }

    setLoading(false);
  };

  if (invitationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg">Validating invitation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            OfferSync Sphere
          </h1>
          <p className="text-muted-foreground mt-2">
            Collaborate, Create, Succeed Together
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl bg-card/95 backdrop-blur-sm border border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {invitation ? `Join as ${invitation.role}` : 'Welcome'}
            </CardTitle>
            <CardDescription>
              {invitation 
                ? `You've been invited to join as a ${invitation.role.toLowerCase()}`
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
            {invitation && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Invitation for: <strong>{invitation.email}</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={invitation ? "signup" : "signin"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" disabled={!!invitation}>Sign In</TabsTrigger>
                <TabsTrigger value="signup">
                  {invitation ? 'Complete Signup' : 'Sign Up'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !!invitation}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  {invitation && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You have an invitation. Please complete the signup process instead.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      readOnly={invitation?.email ? true : false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {!invitation && (
                    <>
                      <div className="space-y-3">
                        <Label>Account Type</Label>
                        <RadioGroup value={role} onValueChange={(value) => setRole(value as 'MANAGER' | 'FREELANCER')}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="FREELANCER" id="freelancer" />
                            <Label htmlFor="freelancer" className="flex items-center gap-2 cursor-pointer">
                              <Briefcase className="w-4 h-4" />
                              Freelancer
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MANAGER" id="manager" />
                            <Label htmlFor="manager" className="flex items-center gap-2 cursor-pointer">
                              <Users className="w-4 h-4" />
                              Manager
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Signup requires an invitation link. Please contact an administrator for access.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                  {invitation && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        You're joining as a <strong>{invitation.role}</strong> with email: <strong>{invitation.email}</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading || (!invitation)}>
                    {loading ? 'Creating account...' : invitation ? 'Complete Signup' : 'Invitation Required'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/20 backdrop-blur-sm border border-white/10">
            <Briefcase className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-sm font-medium">Projects</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 backdrop-blur-sm border border-white/10">
            <Users className="w-6 h-6 text-secondary mx-auto mb-2" />
            <div className="text-sm font-medium">Collaboration</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 backdrop-blur-sm border border-white/10">
            <Zap className="w-6 h-6 text-tertiary mx-auto mb-2" />
            <div className="text-sm font-medium">Real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;