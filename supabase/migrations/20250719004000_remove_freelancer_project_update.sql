-- Remove the policy that allows freelancers to update project status
-- Freelancers should not be able to change project status, only managers can
DROP POLICY IF EXISTS "Freelancers can update project status" ON "Project";

-- Ensure only managers can update their projects (this policy should already exist)
-- The "Managers can manage their projects" policy covers all operations (SELECT, INSERT, UPDATE, DELETE)
-- No additional policies needed
