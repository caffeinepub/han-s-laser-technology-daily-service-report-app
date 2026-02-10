import type { DailyServiceReport } from '../backend';

/**
 * Converts an array of DailyServiceReport objects to CSV format
 */
function convertReportsToCSV(reports: DailyServiceReport[]): string {
  if (reports.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'Report ID',
    'Date',
    'Customer Name',
    'Contact Person',
    'Mobile Number',
    'Machine Model',
    'Machine Serial No',
    'Warranty Status',
    'Traveling Expense Paid',
    'Issue Described by Customer',
    'Issue Found by Engineer',
    'Solution',
    'Issue Resolved',
    'Next Plan of Action',
    'Spares Required',
    'Customer Feedback',
    'Created By (Principal)',
  ];

  // Escape CSV field (handle commas, quotes, newlines)
  const escapeCSVField = (field: string | boolean | undefined | null): string => {
    if (field === undefined || field === null) {
      return '';
    }
    const stringValue = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV rows
  const rows = reports.map((report) => {
    return [
      escapeCSVField(report.id),
      escapeCSVField(report.date),
      escapeCSVField(report.customerName),
      escapeCSVField(report.contactPerson),
      escapeCSVField(report.mobileNumber),
      escapeCSVField(report.machineModel),
      escapeCSVField(report.machineSerialNo),
      escapeCSVField(report.warrantyStatus),
      escapeCSVField(report.travelingExpensePaid ? 'Yes' : 'No'),
      escapeCSVField(report.issueDescribedByCustomer),
      escapeCSVField(report.issueFoundByEngineer),
      escapeCSVField(report.solution),
      escapeCSVField(report.issueResolved ? 'Yes' : 'No'),
      escapeCSVField(report.nextPlanOfAction || ''),
      escapeCSVField(report.sparesRequired),
      escapeCSVField(report.customerFeedback),
      escapeCSVField(report.createdBy.toString()),
    ].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates a filename for the download with current date
 */
function generateFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `service-reports-${dateStr}.csv`;
}

/**
 * Downloads reports as a CSV file
 */
export function downloadReportsAsCSV(reports: DailyServiceReport[]): void {
  const csv = convertReportsToCSV(reports);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = generateFilename();
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
