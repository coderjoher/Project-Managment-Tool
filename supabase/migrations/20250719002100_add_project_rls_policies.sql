-- Enable Row Level Security for Project table
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Project table

-- Policy 1: Managers can view all their projects
CREATE POLICY "Managers can view their projects" ON "Project"
    FOR SELECT USING (
        "managerId" = auth.uid()
    );

-- Policy 2: Freelancers can view projects they have accepted offers for
CREATE POLICY "Freelancers can view projects with accepted offers" ON "Project"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        )
    );

-- Policy 3: Freelancers can view open projects (for browsing and making offers)
CREATE POLICY "Freelancers can view open projects" ON "Project"
    FOR SELECT USING (
        "status" = 'OPEN'
    );

-- Policy 4: Managers can manage (insert, update, delete) their projects
CREATE POLICY "Managers can manage their projects" ON "Project"
    FOR ALL USING (
        "managerId" = auth.uid()
    );

-- Policy 5: Freelancers with accepted offers can update project status
CREATE POLICY "Freelancers can update project status" ON "Project"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        )
    );
