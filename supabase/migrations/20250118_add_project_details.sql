-- Add customer details table
CREATE TABLE "CustomerDetails" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" uuid NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text,
    "customerPhone" text,
    "customerAddress" text,
    "customerCompany" text,
    "notes" text,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "CustomerDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);

-- Add project details brief (rich text)
ALTER TABLE "Project" ADD COLUMN "briefDetails" text;

-- Add financial percentage table
CREATE TABLE "ProjectFinancial" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" uuid NOT NULL,
    "description" text NOT NULL,
    "percentage" decimal(5,2) NOT NULL DEFAULT 0,
    "amount" decimal(10,2),
    "isPaid" boolean DEFAULT false,
    "paidAt" timestamp with time zone,
    "dueDate" timestamp with time zone,
    "notes" text,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "ProjectFinancial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    CONSTRAINT "ProjectFinancial_percentage_check" CHECK (percentage >= 0 AND percentage <= 100)
);

-- Add project log table
CREATE TABLE "ProjectLog" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "projectId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "action" text NOT NULL,
    "description" text,
    "oldValue" text,
    "newValue" text,
    "metadata" jsonb,
    "createdAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "ProjectLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    CONSTRAINT "ProjectLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_customer_details_project ON "CustomerDetails"("projectId");
CREATE INDEX idx_project_financial_project ON "ProjectFinancial"("projectId");
CREATE INDEX idx_project_log_project ON "ProjectLog"("projectId");
CREATE INDEX idx_project_log_user ON "ProjectLog"("userId");
CREATE INDEX idx_project_log_created ON "ProjectLog"("createdAt");

-- Enable Row Level Security (RLS)
ALTER TABLE "CustomerDetails" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectFinancial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectLog" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CustomerDetails
CREATE POLICY "Users can view customer details of their projects" ON "CustomerDetails"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "CustomerDetails"."projectId" 
            AND (p."managerId" = auth.uid() OR EXISTS (
                SELECT 1 FROM "Offer" o 
                WHERE o."projectId" = p."id" 
                AND o."freelancerId" = auth.uid() 
                AND o."status" = 'ACCEPTED'
            ))
        )
    );

CREATE POLICY "Managers can manage customer details" ON "CustomerDetails"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "CustomerDetails"."projectId" 
            AND p."managerId" = auth.uid()
        )
    );

-- Create RLS policies for ProjectFinancial
CREATE POLICY "Users can view financial details of their projects" ON "ProjectFinancial"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectFinancial"."projectId" 
            AND (p."managerId" = auth.uid() OR EXISTS (
                SELECT 1 FROM "Offer" o 
                WHERE o."projectId" = p."id" 
                AND o."freelancerId" = auth.uid() 
                AND o."status" = 'ACCEPTED'
            ))
        )
    );

CREATE POLICY "Managers can manage financial details" ON "ProjectFinancial"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectFinancial"."projectId" 
            AND p."managerId" = auth.uid()
        )
    );

-- Create RLS policies for ProjectLog
CREATE POLICY "Users can view logs of their projects" ON "ProjectLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectLog"."projectId" 
            AND (p."managerId" = auth.uid() OR EXISTS (
                SELECT 1 FROM "Offer" o 
                WHERE o."projectId" = p."id" 
                AND o."freelancerId" = auth.uid() 
                AND o."status" = 'ACCEPTED'
            ))
        )
    );

CREATE POLICY "Users can create logs for their projects" ON "ProjectLog"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Project" p 
            WHERE p."id" = "ProjectLog"."projectId" 
            AND (p."managerId" = auth.uid() OR EXISTS (
                SELECT 1 FROM "Offer" o 
                WHERE o."projectId" = p."id" 
                AND o."freelancerId" = auth.uid() 
                AND o."status" = 'ACCEPTED'
            ))
        ) AND "ProjectLog"."userId" = auth.uid()
    );

-- Create function to automatically log project changes
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO "ProjectLog" ("projectId", "userId", "action", "description", "oldValue", "newValue")
            VALUES (NEW.id, auth.uid(), 'status_change', 'Project status changed', OLD.status, NEW.status);
        END IF;
        
        -- Log other field changes
        IF OLD.title != NEW.title THEN
            INSERT INTO "ProjectLog" ("projectId", "userId", "action", "description", "oldValue", "newValue")
            VALUES (NEW.id, auth.uid(), 'title_change', 'Project title changed', OLD.title, NEW.title);
        END IF;
        
        IF OLD.description != NEW.description THEN
            INSERT INTO "ProjectLog" ("projectId", "userId", "action", "description", "oldValue", "newValue")
            VALUES (NEW.id, auth.uid(), 'description_change', 'Project description changed', OLD.description, NEW.description);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic logging
CREATE TRIGGER project_changes_trigger
    AFTER UPDATE ON "Project"
    FOR EACH ROW
    EXECUTE FUNCTION log_project_changes();
