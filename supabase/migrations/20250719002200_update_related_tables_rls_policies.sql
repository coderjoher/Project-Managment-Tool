-- Update RLS policies for CustomerDetails, ProjectFinancial, and ProjectLog
-- to allow freelancers to view data for OPEN projects

-- Drop existing policies and create new ones for CustomerDetails
DROP POLICY IF EXISTS "Users can view customer details of their projects" ON "CustomerDetails";

CREATE POLICY "Users can view customer details of accessible projects" ON "CustomerDetails"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "CustomerDetails"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have accepted offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid() 
                    AND o."status" = 'ACCEPTED'
                )
                OR
                -- Freelancers can see OPEN projects
                (p."status" = 'OPEN')
            )
        )
    );

-- Drop existing policies and create new ones for ProjectFinancial
DROP POLICY IF EXISTS "Users can view financial details of their projects" ON "ProjectFinancial";

CREATE POLICY "Users can view financial details of accessible projects" ON "ProjectFinancial"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectFinancial"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have accepted offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid() 
                    AND o."status" = 'ACCEPTED'
                )
                OR
                -- Freelancers can see OPEN projects
                (p."status" = 'OPEN')
            )
        )
    );

-- Drop existing policies and create new ones for ProjectLog
DROP POLICY IF EXISTS "Users can view logs of their projects" ON "ProjectLog";

CREATE POLICY "Users can view logs of accessible projects" ON "ProjectLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectLog"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have accepted offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid() 
                    AND o."status" = 'ACCEPTED'
                )
                OR
                -- Freelancers can see OPEN projects
                (p."status" = 'OPEN')
            )
        )
    );

-- Keep the insert/update/delete policies for ProjectLog as they are
-- (only for managers and freelancers with accepted offers)
-- The "Users can create logs for their projects" policy is already correct
