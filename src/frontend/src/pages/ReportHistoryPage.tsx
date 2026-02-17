import { useState, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useListReports, useIsCallerAdmin, useGetUserProfile } from '../hooks/useQueries';
import { copyToClipboard } from '../utils/copyToClipboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar, FileText, CheckCircle2, XCircle, Download, X, Copy, Check } from 'lucide-react';
import { downloadReportsAsCSV } from '../utils/reportDownload';
import { useGetReportsForDownload } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { SessionInvalidScreen } from '../components/SessionInvalidScreen';
import { isAuthError } from '../utils/authErrorDetection';

interface HistorySearchParams {
  userPrincipal?: string;
}

export function ReportHistoryPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/history' }) as HistorySearchParams;
  const { data: reports, isLoading, error } = useListReports();
  const { data: isAdmin } = useIsCallerAdmin();
  const reportsForDownload = useGetReportsForDownload();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const filterUserPrincipalString = search.userPrincipal;
  const filterUserPrincipal = filterUserPrincipalString ? Principal.fromText(filterUserPrincipalString) : null;
  const { data: filteredUserProfile } = useGetUserProfile(filterUserPrincipal);

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
        !filterUserPrincipalString ||
        report.createdBy.toString() === filterUserPrincipalString;

      return matchesSearch && matchesDateRange && matchesUserFilter;
    });
  }, [reports, searchTerm, startDate, endDate, filterUserPrincipalString]);

  // Check for genuine session/auth errors AFTER all hooks
  if (error && isAuthError(error)) {
    return <SessionInvalidScreen />;
  }

  const handleClearFilter = () => {
    navigate({ to: '/history', search: {} });
  };

  const handleCopyUsername = async () => {
    if (filteredUserProfile?.username) {
      const success = await copyToClipboard(filteredUserProfile.username);
      if (success) {
        setCopiedItem('username');
        setTimeout(() => setCopiedItem(null), 2000);
        toast.success('Username copied to clipboard');
      } else {
        toast.error('Failed to copy username');
      }
    }
  };

  const handleCopyPrincipal = async () => {
    if (filterUserPrincipalString) {
      const success = await copyToClipboard(filterUserPrincipalString);
      if (success) {
        setCopiedItem('principal');
        setTimeout(() => setCopiedItem(null), 2000);
        toast.success('Principal ID copied to clipboard');
      } else {
        toast.error('Failed to copy Principal ID');
      }
    }
  };

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

  const showFilterBadge = filterUserPrincipalString && filteredUserProfile;

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
              ? `Viewing reports by ${filteredUserProfile.name} (@${filteredUserProfile.username})`
              : 'View and search all your service reports'}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleDownloadCSV}
            disabled={isDownloading || !reports || reports.length === 0}
            variant="outline"
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
                Export CSV
              </>
            )}
          </Button>
        )}
      </div>

      {showFilterBadge && (
        <Card className="bg-accent/10 border-accent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  Filtered by User
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{filteredUserProfile.name}</span>
                  <span className="text-muted-foreground">@{filteredUserProfile.username}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyUsername}
                    title="Copy username"
                  >
                    {copiedItem === 'username' ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filter
              </Button>
            </div>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-muted-foreground/70 hover:text-muted-foreground select-none">
                Principal ID
              </summary>
              <div className="flex items-center gap-2 mt-1 pl-2">
                <code className="text-xs text-muted-foreground/70 font-mono break-all">
                  {filterUserPrincipalString}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={handleCopyPrincipal}
                  title="Copy Principal ID"
                >
                  {copiedItem === 'principal' ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
          <CardDescription>Search and filter by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, machine, or issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9"
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
              <p className="text-lg font-medium mb-2">No reports found</p>
              <p className="text-muted-foreground">
                {reports && reports.length > 0
                  ? 'Try adjusting your search filters'
                  : 'Create your first service report to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate({ to: '/report/$reportId', params: { reportId: report.id } })}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{report.customerName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Machine Model</p>
                    <p className="font-medium">{report.machineModel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-medium">{report.machineSerialNo}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Issue</p>
                    <p className="font-medium line-clamp-2">{report.issueDescribedByCustomer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
