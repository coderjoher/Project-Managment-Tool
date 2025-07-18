import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  MessageSquare, 
  DollarSign, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Shield,
  Globe,
  Star
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Briefcase,
      title: "Project Management",
      description: "Create, manage, and track projects with integrated ClickUp sync",
      gradient: "gradient-primary"
    },
    {
      icon: Users,
      title: "Collaboration Hub",
      description: "Connect managers with talented freelancers seamlessly",
      gradient: "gradient-secondary"
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Built-in messaging with WhatsApp and Telegram integration",
      gradient: "gradient-tertiary"
    },
    {
      icon: DollarSign,
      title: "Financial Tracking",
      description: "Monitor budgets, payments, and invoices in one place",
      gradient: "gradient-primary"
    }
  ];

  const benefits = [
    "Role-based access control",
    "Real-time collaboration",
    "Secure file storage",
    "Financial transparency",
    "Multi-platform messaging",
    "ClickUp integration"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-gradient-card backdrop-blur-glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">OfferSync Sphere</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 bg-gradient-primary/10 border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              Next-Gen Collaboration Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Collaborate, Create,
              </span>
              <br />
              <span className="text-foreground">Succeed Together</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The ultimate platform for managers and freelancers to work together. 
              Manage projects, track finances, and communicate in real-time with 
              integrated tools that streamline your workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="xl" onClick={() => navigate('/auth')}>
                <Users className="w-5 h-5 mr-2" />
                Start Collaborating
              </Button>
              <Button size="xl" variant="outline">
                <Shield className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline collaboration between 
              managers and freelancers in one integrated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-white/10 hover:shadow-elegant transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why choose <span className="bg-gradient-primary bg-clip-text text-transparent">OfferSync Sphere</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Built specifically for modern collaboration workflows, our platform 
                combines the best tools and integrations to maximize productivity 
                and transparency between teams.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
                  <Star className="w-5 h-5 mr-2" />
                  Join Now - It's Free
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-card rounded-2xl p-8 border border-white/10 backdrop-blur-glass">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-primary/10 rounded-lg border border-primary/20">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Manager Dashboard</h4>
                      <p className="text-sm text-muted-foreground">Create projects, review offers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gradient-tertiary/10 rounded-lg border border-tertiary/20">
                    <div className="w-10 h-10 bg-gradient-tertiary rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-tertiary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Freelancer Portal</h4>
                      <p className="text-sm text-muted-foreground">Submit offers, track progress</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gradient-secondary/10 rounded-lg border border-secondary/20">
                    <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Real-time Chat</h4>
                      <p className="text-sm text-muted-foreground">Instant communication</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of managers and freelancers already using OfferSync Sphere 
            to streamline their collaboration and boost productivity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" onClick={() => navigate('/auth')}>
              <Globe className="w-5 h-5 mr-2" />
              Get Started Today
            </Button>
            <Button size="xl" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-card border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">OfferSync Sphere</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">
                © 2024 OfferSync Sphere. Built with modern collaboration in mind.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
