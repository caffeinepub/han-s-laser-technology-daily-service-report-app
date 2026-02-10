import { useState, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useListReports, useIsCallerAdmin, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { copyToClipboard } from '../utils/copyToClipboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, FileText, CheckCircle2, XCircle, Download, X, Copy, Check } from 'lucide-react';
import { downloadReportsAsCSV } from '../utils/reportDownload';
import { useGetReportsForDownload } from '../hooks/useQueries';
import { toast } from 'sonner';

export function ReportHistoryPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/history' });
  const { identity } = useInternetIdentity();
  const { data: reports, isLoading } = useListReports();
  const { data: isAdmin } = useIsCallerAdmin();
  const reportsForDownload = useGetReportsForDownload();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const filterUserPrincipal = search?.userPrincipal;
  const { data: filteredUserProfile } = useGetUserProfile(filterUserPrincipal);

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const handleClearFilter = () => {
    navigate({ to: '/history', search: {} });
  };

  const handleCopyFilteredPrincipal = async () => {
    if (filterUserPrincipal) {
      const success = await copyToClipboard(filterUserPrincipal);
      if (success) {
        setCopiedPrincipal(true);
        setTimeout(() => setCopiedPrincipal(false), 2000);
        toast.success('Principal ID copied to clipboard');
      } else {
        toast.error('Failed to copy Principal ID');
      }
    }
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];

    return reports.filter((report) => {
      const matchesSearch =
        !searchTerm ||
        report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.machineModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.machineSerialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.issueDescribedByCustomer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDateRange =
        (!startDate || report.date >= startDate) &&
        (!endDate || report.date <= endDate);

      const matchesUserFilter =
        !filterUserPrincipal ||
        report.createdBy.toString() === filterUserPrincipal;

      return matchesSearch && matchesDateRange && matchesUserFilter;
    });
  }, [reports, searchTerm, startDate, endDate, filterUserPrincipal]);

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const freshReports = await reportsForDownload.refetch();
      const reportsToDownload = freshReports.data || [];

      if (reportsToDownload.length === 0) {
        toast.error('No reports available to download');
        return;
      }

      downloadReportsAsCSV(reportsToDownload);
      toast.success(`Downloaded ${reportsToDownload.length} reports as CSV`);
    } catch (error) {
      console.error('Failed to download reports:', error);
      toast.error('Failed to download reports. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const showFilterBadge = filterUserPrincipal && filteredUserProfile;
  const isViewingOwnReports = filterUserPrincipal === currentUserPrincipal;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Service Report History
          </h1>
          <p className="text-muted-foreground mt-1">
            {showFilterBadge
              ? isViewingOwnReports
                ? 'Viewing your reports'
                : `Viewing reports by ${filteredUserProfile.name}`
              : 'View and search all your service reports'}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleDownloadCSV}
            disabled={isDownloading || !reports || reports.length === 0}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download All Reports
              </>
            )}
          </Button>
        )}
      </div>

      {showFilterBadge && (
        <Card className="bg-accent/10 border-accent">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Filtered by User
                </Badge>
                <span className="font-medium">{filteredUserProfile.name}</span>
                <span className="text-sm text-muted-foreground">
                  (@{filteredUserProfile.username})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono px-2 py-1 bg-muted rounded max-w-[200px] overflow-x-auto whitespace-nowrap">
                  {filterUserPrincipal}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyFilteredPrincipal}
                  title="Copy Principal ID"
                >
                  {copiedPrincipal ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilter}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find reports by customer name, machine details, or date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, machine model, serial number, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {showFilterBadge
                  ? `No reports found for ${filteredUserProfile?.name || 'this user'}`
                  : searchTerm || startDate || endDate
                  ? 'No reports match your search criteria'
                  : 'No reports yet'}
              </p>
              <p className="text-muted-foreground mb-4">
                {showFilterBadge
                  ? 'This user has not created any service reports yet.'
                  : searchTerm || startDate || endDate
                  ? 'Try adjusting your search filters'
                  : 'Create your first service report to get started'}
              </p>
              {showFilterBadge ? (
                <Button onClick={handleClearFilter} variant="outline">
                  View All Reports
                </Button>
              ) : (
                <Button onClick={() => navigate({ to: '/' })}>
                  Create New Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
              </p>
            </div>
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate({ to: `/report/${report.id}` })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{report.customerName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={report.issueResolved ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {report.issueResolved ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">Machine Model:</span>
                      <span className="text-muted-foreground">{report.machineModel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">Serial Number:</span>
                      <span className="text-muted-foreground">{report.machineSerialNo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">Contact Person:</span>
                      <span className="text-muted-foreground">{report.contactPerson}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Issue:</span>
                      <span className="text-muted-foreground line-clamp-2">
                        {report.issueDescribedByCustomer}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
