import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import Layout from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';

const PrivateRoute: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [userProfile, setUserProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('User')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout userProfile={userProfile}>
      <Outlet />
    </Layout>
  );
};

export default PrivateRoute;

