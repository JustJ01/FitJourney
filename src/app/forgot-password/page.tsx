
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { MailQuestion } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { sendPasswordReset, loading } = useAuth(); // Get sendPasswordReset from useAuth
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    try {
      await sendPasswordReset(email);
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a password reset link has been sent." });
      setMessageSent(true);
      setEmail(''); // Clear email field
    } catch (error: any) {
      const errorMessage = error.message || "Could not send password reset email. Please try again.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      console.error("Password Reset failed", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
            <MailQuestion className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Forgot Password?</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {messageSent ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-foreground">Password reset email has been sent to your email address. Please check your inbox (and spam folder).</p>
              <Button asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-forgot">Email Address</Label>
                <Input
                  id="email-forgot"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          {!messageSent && (
            <p>Remember your password? <Button variant="link" className="p-0 h-auto" asChild><Link href="/login">Log in</Link></Button></p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
