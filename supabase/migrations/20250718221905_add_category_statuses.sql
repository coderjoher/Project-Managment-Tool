-- Create category statuses table
CREATE TABLE "CategoryStatus" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "color" text DEFAULT '#3B82F6',
    "order" integer DEFAULT 0,
    "categoryId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "CategoryStatus_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory"("id") ON DELETE CASCADE
);

-- Add statusId to Project table
ALTER TABLE "Project" ADD COLUMN "statusId" uuid;
ALTER TABLE "Project" ADD CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "CategoryStatus"("id") ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_category_status_category ON "CategoryStatus"("categoryId");
CREATE INDEX idx_project_status ON "Project"("statusId");

-- Enable Row Level Security (RLS)
ALTER TABLE "CategoryStatus" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CategoryStatus
CREATE POLICY "Users can view statuses of their categories" ON "CategoryStatus"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "ProjectCategory" pc 
            WHERE pc."id" = "CategoryStatus"."categoryId" 
            AND pc."managerId" = auth.uid()
        )
    );

CREATE POLICY "Users can create statuses for their categories" ON "CategoryStatus"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "ProjectCategory" pc 
            WHERE pc."id" = "CategoryStatus"."categoryId" 
            AND pc."managerId" = auth.uid()
        )
    );

CREATE POLICY "Users can update statuses of their categories" ON "CategoryStatus"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "ProjectCategory" pc 
            WHERE pc."id" = "CategoryStatus"."categoryId" 
            AND pc."managerId" = auth.uid()
        )
    );

CREATE POLICY "Users can delete statuses of their categories" ON "CategoryStatus"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "ProjectCategory" pc 
            WHERE pc."id" = "CategoryStatus"."categoryId" 
            AND pc."managerId" = auth.uid()
        )
    );