import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Users, Briefcase, Shield, Zap } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'FREELANCER'>('FREELANCER');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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

    const { error } = await signUp(email, password, role);

    if (error) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email for verification.",
      });
    }

    setLoading(false);
  };

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

        <Card className="bg-gradient-card border-white/10 backdrop-blur-glass shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/20 border-white/10"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/20 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/20 border-white/10"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>I am a...</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as 'MANAGER' | 'FREELANCER')}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <RadioGroupItem value="FREELANCER" id="freelancer" />
                        <Label htmlFor="freelancer" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-tertiary rounded-lg flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-tertiary-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">Freelancer</div>
                              <div className="text-sm text-muted-foreground">Submit offers and work on projects</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <RadioGroupItem value="MANAGER" id="manager" />
                        <Label htmlFor="manager" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-secondary-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">Manager</div>
                              <div className="text-sm text-muted-foreground">Create projects and manage teams</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    variant={role === 'MANAGER' ? 'secondary' : 'tertiary'}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Create Account
                      </>
                    )}
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