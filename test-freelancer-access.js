// Test script to verify freelancers CANNOT see open projects (after migration)
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFreelancerAccess() {
  try {
    // 1. Sign in as a freelancer (replace with actual freelancer credentials)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'freelancer@example.com', // Replace with actual freelancer email
      password: 'freelancer_password' // Replace with actual password
    });

    if (authError) {
      console.error('Authentication error:', authError);
      return;
    }

    console.log('Authenticated as:', authData.user.email);
    console.log('\n--- Testing Project Access After Migration ---\n');

    // 2. Try to fetch open projects (should be empty now)
    const { data: openProjects, error: openError } = await supabase
      .from('Project')
      .select('id, title, status, managerId')
      .eq('status', 'OPEN');

    if (openError) {
      console.error('Error fetching open projects:', openError);
    } else {
      console.log('Open projects visible to freelancer:', openProjects);
      console.log('Number of open projects:', openProjects?.length || 0);
      console.log('Expected: 0 (freelancers should NOT see open projects)');
    }

    // 3. Fetch all projects (should only see projects with offers)
    const { data: allProjects, error: allError } = await supabase
      .from('Project')
      .select('id, title, status');

    if (allError) {
      console.error('Error fetching all projects:', allError);
    } else {
      console.log('\nAll projects visible to freelancer:', allProjects);
      console.log('Number of projects:', allProjects?.length || 0);
      console.log('Expected: Only projects where freelancer has submitted offers');
    }

    // 4. Fetch freelancer's offers to verify which projects they should see
    const { data: offers, error: offersError } = await supabase
      .from('Offer')
      .select(`
        id,
        status,
        Project (
          id,
          title,
          status
        )
      `)
      .eq('freelancerId', authData.user.id);

    if (offersError) {
      console.error('Error fetching offers:', offersError);
    } else {
      console.log('\nFreelancer offers with project details:', offers);
      console.log('These are the only projects the freelancer should be able to see');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testFreelancerAccess();
