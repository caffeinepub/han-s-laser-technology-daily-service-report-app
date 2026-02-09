import { useState } from 'react';
import { useSignupWithCode } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, AlertCircle } from 'lucide-react';
import { Role } from '../backend';
import { validateEmail, validateMobileNumber, validateRequired, validateAccessCode } from '../utils/signupValidation';

export function ProfileSetup() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string>('');
  
  const signupMutation = useSignupWithCode();

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
    
    const accessCodeError = validateAccessCode(accessCode);
    if (accessCodeError) newErrors.accessCode = accessCodeError;
    
    if (!role) newErrors.role = 'Please select a role';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Password is NOT sent to backend - only used for frontend validation
      await signupMutation.mutateAsync({
        profile: {
          name: name.trim(),
          username: username.trim(),
          mobileNumber: mobileNumber.trim(),
          email: email.trim(),
          role: role as Role,
        },
        accessCode: accessCode.trim(),
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Signup failed. Please try again.';
      setBackendError(errorMessage);
    }
  };

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
                disabled={signupMutation.isPending}
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
                disabled={signupMutation.isPending}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: '' });
                }}
                required
                disabled={signupMutation.isPending}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-destructive">{errors.mobileNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email ID *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                required
                disabled={signupMutation.isPending}
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                required
                disabled={signupMutation.isPending}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode">Admin access code *</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter 6-digit access code"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  if (errors.accessCode) setErrors({ ...errors, accessCode: '' });
                  if (backendError) setBackendError('');
                }}
                required
                maxLength={6}
                disabled={signupMutation.isPending}
              />
              {errors.accessCode && (
                <p className="text-sm text-destructive">{errors.accessCode}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Role *</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => {
                  setRole(value as Role);
                  if (errors.role) setErrors({ ...errors, role: '' });
                }}
                disabled={signupMutation.isPending}
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={Role.admin} id="admin" />
                  <Label htmlFor="admin" className="font-normal cursor-pointer">
                    Admin - Full access to all reports and user management
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={Role.engineer} id="engineer" />
                  <Label htmlFor="engineer" className="font-normal cursor-pointer">
                    Engineer - Access to your own reports only
                  </Label>
                </div>
              </RadioGroup>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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
