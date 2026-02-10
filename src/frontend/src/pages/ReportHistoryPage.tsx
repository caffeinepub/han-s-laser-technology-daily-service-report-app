import { useState, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useListReports, useIsCallerAdmin, useGetReportsForDownload, useListUsers } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Calendar, FileText, AlertCircle, CheckCircle2, XCircle, Download, X, Users } from 'lucide-react';
import type { DailyServiceReport } from '../backend';
import { downloadReportsAsCSV } from '../utils/reportDownload';
import { toast } from 'sonner';
import { formatPrincipal } from '../utils/formatPrincipal';
import { AccessDeniedScreen } from '../components/AccessDeniedScreen';

export function ReportHistoryPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/history' });
  const userPrincipalFilter = search.userPrincipal;
  
  const { data: reports, isLoading, isError } = useListReports();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: users } = useListUsers();
  const { refetch: refetchDownloadReports, isFetching: isDownloading } = useGetReportsForDownload();
  
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Check if user filter is active
  const isUserFilterActive = !!userPrincipalFilter;

  // Find user info for the filtered principal - MUST be called before any conditional returns
  const filteredUser = useMemo(() => {
    if (!userPrincipalFilter || !users) return null;
    const userEntry = users.find(([principal]) => principal.toString() === userPrincipalFilter);
    return userEntry ? { principal: userEntry[0], profile: userEntry[1] } : null;
  }, [userPrincipalFilter, users]);

  // Filter reports - MUST be called before any conditional returns
  const filteredReports = useMemo(() => {
    if (!reports) return [];

    let filtered = reports;

    // Apply user filter if active (admin only)
    if (isUserFilterActive && userPrincipalFilter) {
      filtered = filtered.filter((report) => report.createdBy.toString() === userPrincipalFilter);
    }

    // Apply text search
    const searchLower = searchText.toLowerCase();
    filtered = filtered.filter((report) => {
      const matchesSearch = !searchText || 
        report.customerName.toLowerCase().includes(searchLower) ||
        report.machineSerialNo.toLowerCase().includes(searchLower) ||
        report.machineModel.toLowerCase().includes(searchLower);

      // Date range filter
      const reportDate = new Date(report.date);
      const matchesStartDate = !startDate || reportDate >= new Date(startDate);
      const matchesEndDate = !endDate || reportDate <= new Date(endDate);

      return matchesSearch && matchesStartDate && matchesEndDate;
    });

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, searchText, startDate, endDate, isUserFilterActive, userPrincipalFilter]);

  // NOW we can do conditional returns after all hooks are called
  
  // Show access denied if non-admin tries to view filtered reports
  if (isUserFilterActive && !isAdminLoading && !isAdmin) {
    return <AccessDeniedScreen />;
  }

  const handleDownloadAllReports = async () => {
    try {
      const result = await refetchDownloadReports();
      
      if (result.data && result.data.length > 0) {
        downloadReportsAsCSV(result.data);
        toast.success(`Downloaded ${result.data.length} reports successfully`);
      } else {
        toast.info('No reports available to download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download reports. Please try again.');
    }
  };

  const handleClearUserFilter = () => {
    navigate({
      to: '/history',
      search: {},
    });
  };

  if (isLoading || isAdminLoading) {
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

  const userFilterLabel = filteredUser 
    ? `${filteredUser.profile.name} (${formatPrincipal(filteredUser.principal.toString())})`
    : formatPrincipal(userPrincipalFilter || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Report History</h1>
          <p className="text-muted-foreground mt-1">
            {isUserFilterActive 
              ? `Viewing reports for ${userFilterLabel}`
              : 'View and search all submitted service reports'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleDownloadAllReports}
              disabled={isDownloading || !reports || reports.length === 0}
            >
              {isDownloading ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download All Reports
                </>
              )}
            </Button>
          )}
          <Button onClick={() => navigate({ to: '/' })}>
            <FileText className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      {/* User Filter Badge (Admin Only) */}
      {isAdmin && isUserFilterActive && (
        <Card className="bg-accent/10 border-accent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">Filtered by User</p>
                  <p className="text-sm text-muted-foreground">{userFilterLabel}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearUserFilter}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
          <CardDescription>
            Find reports by customer name, machine serial number, or date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
          </h2>
        </div>

        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {isUserFilterActive 
                    ? 'No reports found for this user'
                    : 'No reports found'}
                </p>
                <p className="text-sm mt-1">
                  {isUserFilterActive
                    ? 'This user has not submitted any service reports yet.'
                    : searchText || startDate || endDate
                    ? 'Try adjusting your search filters'
                    : 'Start by creating your first service report'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate({ to: '/report/$id', params: { id: report.id } })}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.customerName}</CardTitle>
                    <CardDescription>
                      {report.machineModel} • S/N: {report.machineSerialNo}
                    </CardDescription>
                  </div>
                  <Badge variant={report.issueResolved ? 'default' : 'secondary'}>
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
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(report.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Issue: </span>
                    <span className="text-muted-foreground">
                      {report.issueDescribedByCustomer.slice(0, 100)}
                      {report.issueDescribedByCustomer.length > 100 ? '...' : ''}
                    </span>
                  </div>
                  {report.solution && (
                    <div>
                      <span className="font-medium">Solution: </span>
                      <span className="text-muted-foreground">
                        {report.solution.slice(0, 100)}
                        {report.solution.length > 100 ? '...' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
