
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'member' | 'trainer'>('member');
  const { register, loading } = useAuth(); // Assuming register is added to useAuth
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Registration Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Registration Error", description: "Please enter your name.", variant: "destructive" });
      return;
    }
     if (!email.trim()) {
      toast({ title: "Registration Error", description: "Please enter an email.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
        toast({ title: "Registration Error", description: "Password should be at least 6 characters.", variant: "destructive" });
        return;
    }

    try {
      // Assuming register function takes (name, email, password, role)
      await register(name, email, password, role); 
      toast({ title: "Registration Successful", description: `Welcome to ${APP_NAME}! You can now log in.` });
      router.push('/login'); // Redirect to login page after successful registration
    } catch (error: any) {
      const errorMessage = error.message || "Could not register your account. Please try again.";
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
            <UserPlus className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>Join {APP_NAME} and start your fitness journey today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-base"
              />
            </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>Register as:</Label>
              <RadioGroup defaultValue="member" value={role} onValueChange={(value: 'member' | 'trainer') => setRole(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="role-member-reg" />
                  <Label htmlFor="role-member-reg">Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trainer" id="role-trainer-reg" />
                  <Label htmlFor="role-trainer-reg">Trainer</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground flex-col space-y-2">
          <p>Already have an account? <Button variant="link" className="p-0 h-auto" asChild><Link href="/login">Log in</Link></Button></p>
          <p>Connects to Firebase Authentication & Firestore.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
