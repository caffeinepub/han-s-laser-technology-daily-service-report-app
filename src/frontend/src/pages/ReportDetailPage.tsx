import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetReportById } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, User, Phone, Wrench, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { SessionInvalidScreen } from '../components/SessionInvalidScreen';
import { isAuthError } from '../utils/authErrorDetection';

function DetailField({ 
  label, 
  value, 
  icon, 
  multiline = false,
  badge = false 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
  multiline?: boolean;
  badge?: boolean;
}) {
  return (
    <div className={multiline ? 'space-y-2' : ''}>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      {badge ? (
        <Badge variant={value === 'Yes' ? 'default' : 'secondary'} className="mt-1">
          {value}
        </Badge>
      ) : multiline ? (
        <p className="text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  );
}

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams({ from: '/report/$reportId' });
  const { data: report, isLoading, error } = useGetReportById(reportId);

  // Check for genuine session/auth errors
  if (error && isAuthError(error)) {
    return <SessionInvalidScreen />;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load report details. The report may not exist.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/history' })}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: '/history' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Service Report Details</h1>
        </div>
        <Badge
          variant={report.issueResolved ? 'default' : 'destructive'}
          className={`text-base px-4 py-2 ${report.issueResolved ? 'bg-success hover:bg-success/90' : ''}`}
        >
          {report.issueResolved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolved
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Pending
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(report.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <CardTitle className="text-2xl">{report.customerName}</CardTitle>
          <CardDescription>Report ID: {report.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <DetailField label="Contact Person" value={report.contactPerson} />
              <DetailField label="Mobile Number" value={report.mobileNumber} icon={<Phone className="h-4 w-4" />} />
            </div>
          </div>

          <Separator />

          {/* Machine Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Machine Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <DetailField label="Machine Model" value={report.machineModel} />
              <DetailField label="Serial Number" value={report.machineSerialNo} />
              <DetailField label="Warranty Status" value={report.warrantyStatus} />
              <DetailField
                label="Traveling Expense Paid"
                value={report.travelingExpensePaid ? 'Yes' : 'No'}
                badge={report.travelingExpensePaid}
              />
            </div>
          </div>

          <Separator />

          {/* Issue Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Issue Details</h3>
            <div className="space-y-4">
              <DetailField
                label="Issue Described by Customer"
                value={report.issueDescribedByCustomer}
                multiline
              />
              <DetailField
                label="Issue Found by Engineer"
                value={report.issueFoundByEngineer}
                multiline
              />
              <DetailField
                label="Solution Provided"
                value={report.solution}
                multiline
              />
              {report.nextPlanOfAction && (
                <DetailField
                  label="Next Plan of Action"
                  value={report.nextPlanOfAction}
                  multiline
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            <div className="space-y-4">
              <DetailField
                label="Spares Required"
                value={report.sparesRequired}
                multiline
              />
              <DetailField
                label="Customer Feedback"
                value={report.customerFeedback}
                multiline
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
