import { MoreHorizontal, Calendar, Flag, Flame, ChevronRight, DollarSign, User, Eye, FileText, Edit, Link, Grid, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budget: number | null;
  deadline: string | null;
  driveLink: string | null;
  createdAt: string;
  managerId: string;
  category?: string;
  offers?: number;
}

interface Offer {
  id: string;
  projectId: string;
  freelancerId: string;
  price: number;
  deliveryTime: number;
  description: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}


const statusConfig = {
  OPEN: {
    label: "Open",
    className: "status-pending"
  },
  IN_PROGRESS: {
    label: "In Progress", 
    className: "status-progress"
  },
  COMPLETED: {
    label: "Completed",
    className: "status-complete"
  },
  CANCELLED: {
    label: "Cancelled",
    className: "status-blocked"
  }
};

const offerStatusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700"
  },
  ACCEPTED: {
    label: "Accepted", 
    className: "bg-green-100 text-green-700"
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700"
  }
};


interface ProjectTableProps {
  className?: string;
  projects: Project[];
  isManager: boolean;
  userOffers?: { [projectId: string]: Offer };
  onViewProject?: (projectId: string) => void;
  onSubmitOffer?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  viewMode?: 'table' | 'card';
  onViewModeChange?: (mode: 'table' | 'card') => void;
  showViewToggle?: boolean;
  title?: string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export function ProjectTable({ 
  className, 
  projects, 
  isManager, 
  userOffers = {}, 
  onViewProject, 
  onSubmitOffer, 
  onEditProject,  
  viewMode = 'table', 
  onViewModeChange, 
  showViewToggle = true, 
  title = 'Projects', 
  onSort, 
  sortField, 
  sortDirection
}: ProjectTableProps) {
  return (
    <div className={`bg-background rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {showViewToggle && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange?.('card')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange?.('table')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {viewMode === 'table' ? (
        /* Desktop Table View */
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b border-border text-sm font-semibold text-text-primary">
            <div className="col-span-4 flex items-center gap-2 cursor-pointer" onClick={() => onSort?.('title')}>
              Project Name
              {onSort && (
                <ArrowUpDown
                  className={`w-4 h-4 ${sortField === 'title' ? 'opacity-100' : 'opacity-50'} ${sortField === 'title' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => onSort?.('status')}>
              Status
              {onSort && (
                <ArrowUpDown
                  className={`w-4 h-4 ${sortField === 'status' ? 'opacity-100' : 'opacity-50'} ${sortField === 'status' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => onSort?.('budget')}>
              Budget
              {onSort && (
                <ArrowUpDown
                  className={`w-4 h-4 ${sortField === 'budget' ? 'opacity-100' : 'opacity-50'} ${sortField === 'budget' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => onSort?.('deadline')}>
              Due Date
              {onSort && (
                <ArrowUpDown
                  className={`w-4 h-4 ${sortField === 'deadline' ? 'opacity-100' : 'opacity-50'} ${sortField === 'deadline' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <div className="col-span-2">
              Actions
            </div>
          </div>
          {/* Table Body */}
          <div className="divide-y divide-border">
            {projects.map((project, index) => {
              const statusInfo = statusConfig[project.status];
              const userOffer = userOffers[project.id];
              return (
                <div key={project.id} className="grid grid-cols-12 gap-4 p-4 group hover:bg-muted/20">
                  {/* Project Name */}
                  <div className="col-span-4">
                    <div className="space-y-1">
                      <p
                        className="font-medium text-text-primary hover:text-primary cursor-pointer"
                        onClick={() => onViewProject?.(project.id)}
                      >
                        {project.title}
                      </p>
                      <p className="text-xs text-text-muted line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">
                          Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                        </span>
                        {project.driveLink && (
                          <a
                            href={project.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link className="w-3 h-3" />
                            Resources
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-span-2 flex items-center gap-2 flex-wrap">
                    <span className={`status-pill ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                    {!isManager && userOffer && (
                      <span className={`status-pill ${offerStatusConfig[userOffer.status].className}`}>
                        {offerStatusConfig[userOffer.status].label}
                      </span>
                    )}
                  </div>
                  {/* Budget */}
                  <div className="col-span-2 flex items-center gap-2">
                    {project.budget ? (
                      <>
                        <DollarSign className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-secondary font-medium">
                          ${project.budget.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-text-muted">Not specified</span>
                    )}
                  </div>
                  {/* Due Date */}
                  <div className="col-span-2 flex items-center gap-2">
                    {project.deadline ? (
                      <>
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-secondary">
                          {format(new Date(project.deadline), 'MMM dd, yyyy')}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-text-muted">No deadline</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => onViewProject?.(project.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isManager && project.status === 'OPEN' && !userOffer && (
                      <Button
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onSubmitOffer?.(project)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onEditProject?.(project)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {projects.map((project) => {
            const statusInfo = statusConfig[project.status];
            const userOffer = userOffers[project.id];
            return (
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusInfo.className} ml-2`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Project Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {project.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">${project.budget.toLocaleString()}</span>
                        </div>
                      )}
                      {project.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Offer Status */}
                    {!isManager && userOffer && (
                      <div className="flex justify-center">
                        <Badge className={`${offerStatusConfig[userOffer.status].className}`}>
                          Your Offer: {offerStatusConfig[userOffer.status].label}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewProject?.(project.id)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {!isManager && project.status === 'OPEN' && !userOffer && (
                        <Button
                          size="sm"
                          onClick={() => onSubmitOffer?.(project)}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Submit Offer
                        </Button>
                      )}
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProject?.(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
