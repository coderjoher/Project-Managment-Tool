-- Drop the existing policy that allows freelancers to view all open projects
DROP POLICY IF EXISTS "Freelancers can view open projects" ON "Project";

-- Update the policy for freelancers to only see projects they have offers for
-- This prevents them from browsing open projects
DROP POLICY IF EXISTS "Freelancers can view projects with accepted offers" ON "Project";

-- Create a new policy that allows freelancers to view projects only if they have ANY offer (not just accepted)
-- This allows them to track their pending offers
CREATE POLICY "Freelancers can view projects they have offers for" ON "Project"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid()
        )
    );

-- Also update the related tables policies to match this restriction
-- Update CustomerDetails policy
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
            )
        )
    );
