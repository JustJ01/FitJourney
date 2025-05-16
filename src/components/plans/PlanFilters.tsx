
"use client";

import type { PlanFilters, BMICategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { BMI_CATEGORIES, PLAN_DURATIONS, DEFAULT_AGE_RANGE, DEFAULT_PRICE_RANGE } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Filter, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PlanFiltersProps {
  filters: PlanFilters;
  onFilterChange: (newFilters: Partial<PlanFilters>) => void;
  onResetFilters: () => void;
}

const PlanFiltersComponent: React.FC<PlanFiltersProps> = ({ filters, onFilterChange, onResetFilters }) => {
  
  const handleSliderChange = (field: 'ageRange' | 'price', value: [number, number]) => {
    onFilterChange({ [field]: value });
  };

  const handleInputChange = (field: keyof PlanFilters, value: string | number | BMICategory | null) => {
    onFilterChange({ [field]: value });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Filter className="h-5 w-5 text-primary" />
          Filter Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['searchTerm', 'age', 'bmi']} className="w-full space-y-4">
          <AccordionItem value="searchTerm">
            <AccordionTrigger className="text-base font-semibold">Search by Name/Goal</AccordionTrigger>
            <AccordionContent className="pt-2">
              <Input
                placeholder="e.g., Strength, Yoga"
                value={filters.searchTerm}
                onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                className="text-sm"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="age">
            <AccordionTrigger className="text-base font-semibold">Age Range</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-2">
              <Label>Ages: {filters.ageRange[0]} - {filters.ageRange[1]}</Label>
              <Slider
                min={10}
                max={100}
                step={1}
                value={filters.ageRange}
                onValueChange={(value) => handleSliderChange('ageRange', value)}
                className="my-2"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bmi">
            <AccordionTrigger className="text-base font-semibold">BMI Category</AccordionTrigger>
            <AccordionContent className="pt-2">
              <Select
                value={filters.bmiCategory || ''}
                onValueChange={(value) => handleInputChange('bmiCategory', value as BMICategory)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select BMI category" />
                </SelectTrigger>
                <SelectContent>
                  {BMI_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="text-sm">
                      {category === 'All' ? 'Any Category' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rating">
            <AccordionTrigger className="text-base font-semibold">Minimum Rating</AccordionTrigger>
            <AccordionContent className="pt-2">
              <Select
                value={filters.rating?.toString() || 'all_ratings'}
                onValueChange={(value) => handleInputChange('rating', value === 'all_ratings' ? null : (value ? parseInt(value) : null))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_ratings" className="text-sm">Any Rating</SelectItem>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={r.toString()} className="text-sm">
                      {r} Star{r > 1 ? 's' : ''} & Up
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="price">
            <AccordionTrigger className="text-base font-semibold">Price Range</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-2">
              <Label>Price: ${filters.price[0]} - ${filters.price[1] === DEFAULT_PRICE_RANGE[1] ? `${DEFAULT_PRICE_RANGE[1]}+` : filters.price[1]}</Label>
              <Slider
                min={DEFAULT_PRICE_RANGE[0]}
                max={DEFAULT_PRICE_RANGE[1]}
                step={5}
                value={filters.price}
                onValueChange={(value) => handleSliderChange('price', value)}
                className="my-2"
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="duration">
            <AccordionTrigger className="text-base font-semibold">Duration</AccordionTrigger>
            <AccordionContent className="pt-2">
              <Select
                value={filters.duration}
                onValueChange={(value) => handleInputChange('duration', value === "Any" ? "" : value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_DURATIONS.map((duration) => (
                    <SelectItem key={duration} value={duration} className="text-sm">
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button onClick={onResetFilters} variant="outline" className="w-full mt-6 text-sm">
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlanFiltersComponent;
