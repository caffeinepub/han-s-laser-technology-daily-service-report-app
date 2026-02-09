import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListReports } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Calendar, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { DailyServiceReport } from '../backend';

export function ReportHistoryPage() {
  const navigate = useNavigate();
  const { data: reports, isLoading, isError } = useListReports();
  
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredReports = useMemo(() => {
    if (!reports) return [];

    return reports.filter((report) => {
      // Text search
      const searchLower = searchText.toLowerCase();
      const matchesSearch = !searchText || 
        report.customerName.toLowerCase().includes(searchLower) ||
        report.machineSerialNo.toLowerCase().includes(searchLower) ||
        report.machineModel.toLowerCase().includes(searchLower);

      // Date range filter
      const reportDate = new Date(report.date);
      const matchesStartDate = !startDate || reportDate >= new Date(startDate);
      const matchesEndDate = !endDate || reportDate <= new Date(endDate);

      return matchesSearch && matchesStartDate && matchesEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, searchText, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load reports. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Report History</h1>
          <p className="text-muted-foreground mt-1">
            View and search all submitted service reports
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/' })}>
          <FileText className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Customer, serial no., model..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {(searchText || startDate || endDate) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchText('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-muted-foreground mb-4">
              {reports && reports.length > 0
                ? 'No reports match your current filters'
                : 'No service reports have been submitted yet'}
            </p>
            {reports && reports.length > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => navigate({ to: '/' })}>
                Create First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
          </p>
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => navigate({ to: '/report/$id', params: { id: report.id } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: DailyServiceReport;
  onClick: () => void;
}

function ReportCard({ report, onClick }: ReportCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{report.customerName}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                {new Date(report.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </CardDescription>
          </div>
          <Badge
            variant={report.issueResolved ? 'default' : 'destructive'}
            className={report.issueResolved ? 'bg-success hover:bg-success/90' : ''}
          >
            {report.issueResolved ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resolved
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Machine Model</p>
            <p className="font-medium">{report.machineModel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serial No.</p>
            <p className="font-medium">{report.machineSerialNo}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Warranty</p>
            <p className="font-medium">{report.warrantyStatus}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contact</p>
            <p className="font-medium">{report.contactPerson}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

