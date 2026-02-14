import { useState } from 'react';
import { useSignupWithRole, useSignupAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, User, AlertCircle, Info, ShieldCheck, Wrench, CheckCircle } from 'lucide-react';
import { Role, type UserProfile } from '../backend';
import { validateEmail, validateMobileNumber, validateRequired } from '../utils/signupValidation';
import { translateSignupError } from '../utils/signupErrorMessaging';

type AccountType = 'engineer' | 'admin';

export function ProfileSetup() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('engineer');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string>('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const signupMutation = useSignupWithRole();
  const signupAdminMutation = useSignupAdmin();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateRequired(name, 'Name');
    if (nameError) newErrors.name = nameError;
    
    const usernameError = validateRequired(username, 'Username');
    if (usernameError) newErrors.username = usernameError;
    
    const mobileError = validateMobileNumber(mobileNumber);
    if (mobileError) newErrors.mobileNumber = mobileError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validateRequired(password, 'Password');
    if (passwordError) newErrors.password = passwordError;
    else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Validate admin password if admin account type is selected (only check non-empty)
    if (accountType === 'admin') {
      if (!adminPassword || adminPassword.trim() === '') {
        newErrors.adminPassword = 'Admin signup password is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError('');
    setSignupSuccess(false);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const profile: UserProfile = {
        name: name.trim(),
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        role: accountType === 'admin' ? Role.admin : Role.engineer,
      };

      if (accountType === 'admin') {
        // Use admin signup mutation with password (backend validates correctness)
        await signupAdminMutation.mutateAsync({
          profile,
          password: adminPassword,
        });
        // Clear admin password after successful signup
        setAdminPassword('');
      } else {
        // Use regular signup mutation
        await signupMutation.mutateAsync({
          profile,
          requestedRole: Role.engineer,
        });
      }
      
      // Success - show success state
      setSignupSuccess(true);
      // Mutations will trigger profile refetch and UI will update automatically
    } catch (error: any) {
      const errorMessage = translateSignupError(error);
      setBackendError(errorMessage);
      // Clear admin password on error to prevent resubmission with stale password
      if (accountType === 'admin') {
        setAdminPassword('');
      }
    }
  };

  const isPending = signupMutation.isPending || signupAdminMutation.isPending;

  // Show success state after signup
  if (signupSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Signup Complete!
            </CardTitle>
            <CardDescription>
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Your account is being activated. This usually takes just a moment. 
                Please wait while we set up your access...
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Your Signup
          </CardTitle>
          <CardDescription>
            Please fill in your details to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {backendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{backendError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                required
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: '' });
                }}
                required
                disabled={isPending}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: '' });
                }}
                required
                disabled={isPending}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-destructive">{errors.mobileNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                required
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                required
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Account Type *</Label>
              <RadioGroup
                value={accountType}
                onValueChange={(value) => {
                  setAccountType(value as AccountType);
                  setBackendError('');
                  setErrors({});
                }}
                disabled={isPending}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="engineer" id="engineer" />
                  <Label htmlFor="engineer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wrench className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Engineer</div>
                      <div className="text-xs text-muted-foreground">Service engineer account</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer flex-1">
                    <ShieldCheck className="h-4 w-4 text-warning" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Administrator account (requires password)</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {accountType === 'admin' && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Admin accounts require a special signup password. Contact your system administrator if you don't have it.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Signup Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter admin signup password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (errors.adminPassword) setErrors({ ...errors, adminPassword: '' });
                    }}
                    required
                    disabled={isPending}
                  />
                  {errors.adminPassword && (
                    <p className="text-sm text-destructive">{errors.adminPassword}</p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Signup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
