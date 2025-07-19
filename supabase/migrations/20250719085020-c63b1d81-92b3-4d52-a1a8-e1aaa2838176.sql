-- Allow freelancers to view open projects again
DROP POLICY IF EXISTS "Freelancers can view open projects" ON "Project";

CREATE POLICY "Freelancers can view open projects" ON "Project"
    FOR SELECT USING (
        "status" = 'OPEN'
    );

-- Update related tables to allow freelancers to view open project details
DROP POLICY IF EXISTS "Users can view customer details of accessible projects" ON "CustomerDetails";

CREATE POLICY "Users can view customer details of accessible projects" ON "CustomerDetails"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "CustomerDetails"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid()
                )
                OR
                -- Freelancers can see OPEN projects
                p."status" = 'OPEN'
            )
        )
    );

-- Update ProjectFinancial policy
DROP POLICY IF EXISTS "Users can view financial details of accessible projects" ON "ProjectFinancial";

CREATE POLICY "Users can view financial details of accessible projects" ON "ProjectFinancial"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectFinancial"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid()
                )
                OR
                -- Freelancers can see OPEN projects
                p."status" = 'OPEN'
            )
        )
    );

-- Update ProjectLog policy
DROP POLICY IF EXISTS "Users can view logs of accessible projects" ON "ProjectLog";

CREATE POLICY "Users can view logs of accessible projects" ON "ProjectLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectLog"."projectId" 
            AND (
                -- Managers can see their projects
                p."managerId" = auth.uid() 
                OR 
                -- Freelancers can see projects they have offers for
                EXISTS (
                    SELECT 1 FROM "Offer" o 
                    WHERE o."projectId" = p."id" 
                    AND o."freelancerId" = auth.uid()
                )
                OR
                -- Freelancers can see OPEN projects
                p."status" = 'OPEN'
            )
        )
    );