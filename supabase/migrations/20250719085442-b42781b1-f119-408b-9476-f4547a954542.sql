-- Update project status policies to allow freelancers to change status of accepted projects
-- but prevent anyone from changing status of OPEN projects

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can manage their projects" ON "Project";
DROP POLICY IF EXISTS "Freelancers can update project status" ON "Project";

-- Create new policy for managers - they can manage their projects but cannot change status of OPEN projects
CREATE POLICY "Managers can manage their projects" ON "Project"
    FOR ALL USING (
        "managerId" = auth.uid() AND "status" != 'OPEN'
    );

-- Create separate policies for different operations on manager's projects
CREATE POLICY "Managers can view their projects" ON "Project"
    FOR SELECT USING (
        "managerId" = auth.uid()
    );

CREATE POLICY "Managers can insert projects" ON "Project"
    FOR INSERT WITH CHECK (
        "managerId" = auth.uid()
    );

CREATE POLICY "Managers can update non-open projects" ON "Project"
    FOR UPDATE USING (
        "managerId" = auth.uid() AND "status" != 'OPEN'
    );

CREATE POLICY "Managers can delete their projects" ON "Project"
    FOR DELETE USING (
        "managerId" = auth.uid() AND "status" != 'OPEN'
    );

-- Create new policy for freelancers - they can update status of projects they have accepted offers for
-- but cannot change status of OPEN projects
CREATE POLICY "Freelancers can update accepted project status" ON "Project"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        ) AND "status" != 'OPEN'
    );