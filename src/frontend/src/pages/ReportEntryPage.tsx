import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateReport } from '../hooks/useQueries';
import { useGeolocation } from '../hooks/useGeolocation';
import type { DailyServiceReport } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReportEntryPage() {
  const navigate = useNavigate();
  const createReport = useCreateReport();
  const { data: locationData } = useGeolocation({ autoCapture: true });
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    contactPerson: '',
    mobileNumber: '',
    machineModel: '',
    machineSerialNo: '',
    warrantyStatus: 'Warranty',
    travelingExpensePaid: false,
    issueDescribedByCustomer: '',
    issueFoundByEngineer: '',
    solution: '',
    issueResolved: true,
    nextPlanOfAction: '',
    sparesRequired: '',
    customerFeedback: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }
    if (!formData.machineModel.trim()) newErrors.machineModel = 'Machine model is required';
    if (!formData.machineSerialNo.trim()) newErrors.machineSerialNo = 'Machine serial number is required';
    if (!formData.issueDescribedByCustomer.trim()) newErrors.issueDescribedByCustomer = 'Customer issue description is required';
    if (!formData.issueFoundByEngineer.trim()) newErrors.issueFoundByEngineer = 'Engineer findings are required';
    if (!formData.solution.trim()) newErrors.solution = 'Solution is required';
    
    if (!formData.issueResolved && !formData.nextPlanOfAction.trim()) {
      newErrors.nextPlanOfAction = 'Next plan of action is required when issue is not resolved';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const report: DailyServiceReport = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdBy: Principal.anonymous(), // Placeholder - backend will set the actual caller
      date: formData.date,
      customerName: formData.customerName.trim(),
      contactPerson: formData.contactPerson.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      machineModel: formData.machineModel.trim(),
      machineSerialNo: formData.machineSerialNo.trim(),
      warrantyStatus: formData.warrantyStatus,
      travelingExpensePaid: formData.travelingExpensePaid,
      issueDescribedByCustomer: formData.issueDescribedByCustomer.trim(),
      issueFoundByEngineer: formData.issueFoundByEngineer.trim(),
      solution: formData.solution.trim(),
      issueResolved: formData.issueResolved,
      nextPlanOfAction: formData.issueResolved ? undefined : formData.nextPlanOfAction.trim(),
      sparesRequired: formData.sparesRequired.trim(),
      customerFeedback: formData.customerFeedback.trim(),
      geolocation: locationData ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      } : undefined,
    };

    try {
      await createReport.mutateAsync(report);
      setShowSuccess(true);
      setTimeout(() => {
        navigate({ to: '/history' });
      }, 2000);
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md border-success bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertDescription className="text-success-foreground ml-2">
            Service report submitted successfully! Redirecting to history...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Service Report</CardTitle>
          <CardDescription>
            Complete all required fields to submit a daily service report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    className={errors.customerName ? 'border-destructive' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                    placeholder="Enter contact person name"
                    className={errors.contactPerson ? 'border-destructive' : ''}
                  />
                  {errors.contactPerson && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactPerson}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={errors.mobileNumber ? 'border-destructive' : ''}
                  />
                  {errors.mobileNumber && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Machine Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Machine Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machineModel">Machine Model *</Label>
                  <Input
                    id="machineModel"
                    value={formData.machineModel}
                    onChange={(e) => updateField('machineModel', e.target.value)}
                    placeholder="Enter machine model"
                    className={errors.machineModel ? 'border-destructive' : ''}
                  />
                  {errors.machineModel && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.machineModel}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machineSerialNo">Machine Serial No. *</Label>
                  <Input
                    id="machineSerialNo"
                    value={formData.machineSerialNo}
                    onChange={(e) => updateField('machineSerialNo', e.target.value)}
                    placeholder="Enter serial number"
                    className={errors.machineSerialNo ? 'border-destructive' : ''}
                  />
                  {errors.machineSerialNo && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.machineSerialNo}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Warranty Status *</Label>
                  <RadioGroup
                    value={formData.warrantyStatus}
                    onValueChange={(value) => updateField('warrantyStatus', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Warranty" id="warranty" />
                      <Label htmlFor="warranty" className="font-normal cursor-pointer">Under Warranty</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Out of Warranty" id="out-of-warranty" />
                      <Label htmlFor="out-of-warranty" className="font-normal cursor-pointer">Out of Warranty</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelingExpensePaid" className="flex items-center gap-2">
                    Traveling Expense Paid
                  </Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="travelingExpensePaid"
                      checked={formData.travelingExpensePaid}
                      onCheckedChange={(checked) => updateField('travelingExpensePaid', checked)}
                    />
                    <Label htmlFor="travelingExpensePaid" className="font-normal cursor-pointer">
                      {formData.travelingExpensePaid ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Issue Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDescribedByCustomer">Issue Described by Customer *</Label>
                  <Textarea
                    id="issueDescribedByCustomer"
                    value={formData.issueDescribedByCustomer}
                    onChange={(e) => updateField('issueDescribedByCustomer', e.target.value)}
                    placeholder="Describe the issue as reported by the customer"
                    rows={3}
                    className={errors.issueDescribedByCustomer ? 'border-destructive' : ''}
                  />
                  {errors.issueDescribedByCustomer && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.issueDescribedByCustomer}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueFoundByEngineer">Issue Found by Engineer *</Label>
                  <Textarea
                    id="issueFoundByEngineer"
                    value={formData.issueFoundByEngineer}
                    onChange={(e) => updateField('issueFoundByEngineer', e.target.value)}
                    placeholder="Describe the actual issue found during inspection"
                    rows={3}
                    className={errors.issueFoundByEngineer ? 'border-destructive' : ''}
                  />
                  {errors.issueFoundByEngineer && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.issueFoundByEngineer}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">Solution Applied *</Label>
                  <Textarea
                    id="solution"
                    value={formData.solution}
                    onChange={(e) => updateField('solution', e.target.value)}
                    placeholder="Describe the solution or action taken"
                    rows={3}
                    className={errors.solution ? 'border-destructive' : ''}
                  />
                  {errors.solution && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.solution}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Resolution Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="issueResolved"
                    checked={formData.issueResolved}
                    onCheckedChange={(checked) => updateField('issueResolved', checked)}
                  />
                  <Label htmlFor="issueResolved" className="cursor-pointer">
                    Issue Resolved
                  </Label>
                </div>

                {!formData.issueResolved && (
                  <div className="space-y-2">
                    <Label htmlFor="nextPlanOfAction">Next Plan of Action *</Label>
                    <Textarea
                      id="nextPlanOfAction"
                      value={formData.nextPlanOfAction}
                      onChange={(e) => updateField('nextPlanOfAction', e.target.value)}
                      placeholder="Describe the next steps to resolve the issue"
                      rows={3}
                      className={errors.nextPlanOfAction ? 'border-destructive' : ''}
                    />
                    {errors.nextPlanOfAction && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nextPlanOfAction}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="sparesRequired">Spares Required</Label>
                  <Textarea
                    id="sparesRequired"
                    value={formData.sparesRequired}
                    onChange={(e) => updateField('sparesRequired', e.target.value)}
                    placeholder="List any spare parts needed (optional)"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Customer Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Customer Feedback</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerFeedback">Feedback</Label>
                <Textarea
                  id="customerFeedback"
                  value={formData.customerFeedback}
                  onChange={(e) => updateField('customerFeedback', e.target.value)}
                  placeholder="Enter customer feedback (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/history' })}
                disabled={createReport.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReport.isPending}
                className="flex-1"
              >
                {createReport.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
