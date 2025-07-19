-- Drop existing update policies
DROP POLICY IF EXISTS "Managers can manage their projects" ON "Project";
DROP POLICY IF EXISTS "Freelancers can update project status" ON "Project";

-- Create new policies with specific rules

-- 1. Managers can manage their non-OPEN projects (all operations except status change for OPEN)
CREATE POLICY "Managers can manage their non-open projects" ON "Project"
    FOR ALL USING (
        "managerId" = auth.uid()
    ) WITH CHECK (
        "managerId" = auth.uid() AND
        OLD.status != 'OPEN'  -- Prevents updating OPEN projects
    );

-- 2. Freelancers can update status of their accepted projects (except OPEN)
CREATE POLICY "Freelancers can update accepted project status" ON "Project"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        ) AND "status" != 'OPEN'  -- Can't update if project is OPEN
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Offer" o 
            WHERE o."projectId" = "Project"."id" 
            AND o."freelancerId" = auth.uid() 
            AND o."status" = 'ACCEPTED'
        ) AND OLD.status != 'OPEN'  -- Can't update if project was OPEN
    );

-- Add a trigger to validate status changes
CREATE OR REPLACE FUNCTION validate_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing status of OPEN projects
    IF OLD.status = 'OPEN' THEN
        RAISE EXCEPTION 'Cannot change status of OPEN projects';
    END IF;

    -- Only allow specific status transitions
    IF NEW.status NOT IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid status transition. Status can only be changed to IN_PROGRESS, COMPLETED, or CANCELLED';
    END IF;

    -- For freelancers, only allow specific transitions
    IF EXISTS (
        SELECT 1 FROM "Offer" o 
        WHERE o."projectId" = NEW.id 
        AND o."freelancerId" = auth.uid() 
        AND o."status" = 'ACCEPTED'
    ) AND auth.uid() != OLD."managerId" THEN
        -- Freelancers can only:
        -- 1. Change IN_PROGRESS to COMPLETED
        -- 2. Change IN_PROGRESS to CANCELLED
        IF NOT (
            (OLD.status = 'IN_PROGRESS' AND NEW.status IN ('COMPLETED', 'CANCELLED'))
        ) THEN
            RAISE EXCEPTION 'Freelancers can only mark projects as COMPLETED or CANCELLED from IN_PROGRESS state';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status validation
DROP TRIGGER IF EXISTS validate_project_status_trigger ON "Project";
CREATE TRIGGER validate_project_status_trigger
    BEFORE UPDATE OF status ON "Project"
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_status_change();
