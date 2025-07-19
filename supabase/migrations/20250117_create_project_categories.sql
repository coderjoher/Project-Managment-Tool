-- Create project categories table
CREATE TABLE "ProjectCategory" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    "color" text DEFAULT '#3B82F6',
    "managerId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "ProjectCategory_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add categoryId to Project table
ALTER TABLE "Project" ADD COLUMN "categoryId" uuid;
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory"("id") ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_project_category_manager ON "ProjectCategory"("managerId");
CREATE INDEX idx_project_category ON "Project"("categoryId");

-- Enable Row Level Security (RLS)
ALTER TABLE "ProjectCategory" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ProjectCategory
CREATE POLICY "Users can view categories they manage" ON "ProjectCategory"
    FOR SELECT USING (auth.uid() = "managerId");

CREATE POLICY "Users can create categories" ON "ProjectCategory"
    FOR INSERT WITH CHECK (auth.uid() = "managerId");

CREATE POLICY "Users can update their own categories" ON "ProjectCategory"
    FOR UPDATE USING (auth.uid() = "managerId");

CREATE POLICY "Users can delete their own categories" ON "ProjectCategory"
    FOR DELETE USING (auth.uid() = "managerId");
