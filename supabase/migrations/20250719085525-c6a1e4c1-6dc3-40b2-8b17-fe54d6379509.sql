-- Drop all existing project policies first
DROP POLICY IF EXISTS "Managers can view their projects" ON "Project";
DROP POLICY IF EXISTS "Managers can insert projects" ON "Project";
DROP POLICY IF EXISTS "Managers can update non-open projects" ON "Project";
DROP POLICY IF EXISTS "Managers can delete their projects" ON "Project";
DROP POLICY IF EXISTS "Freelancers can update accepted project status" ON "Project";

-- Create new policies that prevent status changes of OPEN projects

-- Managers can view all their projects
CREATE POLICY "Managers can view their projects" ON "Project"
    FOR SELECT USING (
        "managerId" = auth.uid()
    );

-- Managers can create new projects
CREATE POLICY "Managers can insert projects" ON "Project"
    FOR INSERT WITH CHECK (
        "managerId" = auth.uid()
    );

-- Managers can update their projects but NOT if status is OPEN
CREATE POLICY "Managers can update non-open projects" ON "Project"
    FOR UPDATE USING (
        "managerId" = auth.uid() AND "status" != 'OPEN'
    );

-- Managers can delete their projects but NOT if status is OPEN
CREATE POLICY "Managers can delete their projects" ON "Project"
    FOR DELETE USING (
        "managerId" = auth.uid() AND "status" != 'OPEN'
    );

-- Freelancers can update status of projects they have accepted offers for
-- but NOT if the current status is OPEN
CREATE POLICY "Freelancers can update accepted project status" ON "Project"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        ) AND "status" != 'OPEN'
    );