
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'trainer'>('member');
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Login Error", description: "Please enter an email address.", variant: "destructive" });
      return;
    }
    try {
      await login(email, role); // Pass role for mock login
      toast({ title: "Login Successful", description: `Welcome back to ${APP_NAME}!` });
      router.push(role === 'trainer' ? '/dashboard' : '/plans');
    } catch (error) {
      toast({ title: "Login Failed", description: "Could not log you in. Please try again.", variant: "destructive" });
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">{APP_NAME} Login</CardTitle>
          <CardDescription>Enter your email to access your fitness journey. (Mock Login)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">Try: alice@example.com (member) or charlie@example.com (trainer)</p>
            </div>
            
            <div className="space-y-2">
              <Label>Login as:</Label>
              <RadioGroup defaultValue="member" value={role} onValueChange={(value: 'member' | 'trainer') => setRole(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="role-member" />
                  <Label htmlFor="role-member">Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trainer" id="role-trainer" />
                  <Label htmlFor="role-trainer">Trainer</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? 'Logging in...' : 'Login / Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>This is a simplified login for demonstration purposes.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
