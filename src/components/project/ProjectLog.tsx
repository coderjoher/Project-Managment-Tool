import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, User, FileText, Edit3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectLogEntry {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: any;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface ProjectLogProps {
  projectId: string;
}

const ProjectLog: React.FC<ProjectLogProps> = ({ projectId }) => {
  const [logEntries, setLogEntries] = useState<ProjectLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogEntries();
  }, [projectId]);

  const fetchLogEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('ProjectLog')
        .select(`
          *,
          user:User!ProjectLog_userId_fkey (
            name,
            email
          )
        `)
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setLogEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading project log",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'status_change':
        return <RefreshCw className="w-4 h-4" />;
      case 'title_change':
      case 'description_change':
        return <Edit3 className="w-4 h-4" />;
      case 'project_created':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'bg-blue-500/10 text-blue-500';
      case 'title_change':
      case 'description_change':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'project_created':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatActionDescription = (entry: ProjectLogEntry) => {
    const userName = entry.user.name || entry.user.email;
    
    switch (entry.action) {
      case 'status_change':
        return `${userName} changed status from "${entry.oldValue}" to "${entry.newValue}"`;
      case 'title_change':
        return `${userName} changed title from "${entry.oldValue}" to "${entry.newValue}"`;
      case 'description_change':
        return `${userName} updated project description`;
      case 'project_created':
        return `${userName} created the project`;
      default:
        return entry.description || `${userName} performed ${entry.action}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Project Log
          </CardTitle>
          <CardDescription>
            Track all project changes and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Project Log
        </CardTitle>
        <CardDescription>
          Track all project changes and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logEntries.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No activity logged yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {formatActionDescription(entry)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  {entry.description && entry.description !== formatActionDescription(entry) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {entry.action.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {entry.user.name || entry.user.email}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectLog;
