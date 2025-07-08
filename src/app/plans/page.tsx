
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Plan, PlanFilters } from '@/types';
import { getPublishedPlans } from '@/lib/data';
import PlanCard from '@/components/plans/PlanCard';
import PlanFiltersComponent from '@/components/plans/PlanFilters';
import { DEFAULT_AGE_RANGE, DEFAULT_PRICE_RANGE } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchX } from 'lucide-react';

const initialFilters: PlanFilters = {
  ageRange: DEFAULT_AGE_RANGE,
  bmiCategory: 'All',
  rating: null,
  price: DEFAULT_PRICE_RANGE,
  duration: '',
  searchTerm: '',
};

export default function PlanExplorerPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [filters, setFilters] = useState<PlanFilters>(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const fetchedPlans = await getPublishedPlans();
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    let currentPlans = [...plans];


    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      currentPlans = currentPlans.filter(plan =>
        plan.name.toLowerCase().includes(searchTermLower) ||
        plan.goal.toLowerCase().includes(searchTermLower) ||
        plan.description.toLowerCase().includes(searchTermLower)
      );
    }


    currentPlans = currentPlans.filter(plan =>
      plan.ageMin <= filters.ageRange[1] && plan.ageMax >= filters.ageRange[0]
    );

    if (filters.bmiCategory && filters.bmiCategory !== 'All') {
      currentPlans = currentPlans.filter(plan => plan.bmiCategories.includes(filters.bmiCategory));
    }


    if (filters.rating !== null) {
      currentPlans = currentPlans.filter(plan => plan.rating >= filters.rating!);
    }
    

    currentPlans = currentPlans.filter(plan =>
        plan.price >= filters.price[0] && plan.price <= filters.price[1]
    );


    if (filters.duration && filters.duration !== "Any") {
      currentPlans = currentPlans.filter(plan => plan.duration === filters.duration);
    }
    
    setFilteredPlans(currentPlans);
  }, [plans, filters]);


  const handleFilterChange = (newFilters: Partial<PlanFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Explore Fitness Plans</h1>
        <p className="mt-2 text-lg text-foreground/80">
          Find the perfect plan to kickstart or elevate your fitness journey.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <PlanFiltersComponent 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </aside>

        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <Alert variant="default" className="bg-card">
              <SearchX className="h-5 w-5 text-primary" />
              <AlertTitle>No Plans Found</AlertTitle>
              <AlertDescription>
                No plans match your current filter criteria. Try adjusting your filters or browse all plans.
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
}
