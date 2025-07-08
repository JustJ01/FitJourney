
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Sale } from '@/types';
import { getSalesByTrainer } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function EarningsPage() {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role === 'trainer') {
            setLoading(true);
            getSalesByTrainer(user.id)
                .then(setSales)
                .catch(err => {
                    console.error("Failed to fetch sales data:", err);
                    toast({
                        title: "Error Loading Earnings",
                        description: "Could not load your sales data. Please try again later.",
                        variant: "destructive",
                    });
                })
                .finally(() => setLoading(false));
        }
    }, [user]);

    const { totalEarnings, totalSales } = useMemo(() => {
        const earnings = sales.reduce((acc, sale) => acc + sale.price, 0);
        return {
            totalEarnings: earnings,
            totalSales: sales.length,
        };
    }, [sales]);

    if (loading) {
        return (
            <div className="space-y-6">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-56" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!user || user.role !== 'trainer') {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You must be logged in as a trainer to view this page.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <TrendingUp className="h-7 w-7"/>
                    Earnings Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">An overview of your plan sales and total revenue.</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">From all plan sales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalSales}</div>
                        <p className="text-xs text-muted-foreground">Total plans sold</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A list of your most recent plan sales.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sales.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plan Name</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{sale.planName}</TableCell>
                                        <TableCell className="text-right">₹{sale.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{format(new Date(sale.purchasedAt), 'MMM d, yyyy')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No sales have been recorded yet.</p>
                            <p className="text-sm">When a member purchases one of your plans, the transaction will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
