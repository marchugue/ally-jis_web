import { useEffect, useState } from 'react';
import { COURSES_BY_DEPT, DEPARTMENTS, INTERESTS_BY_CATEGORY, ORGANIZATIONS, YEAR_LEVELS } from '@/data/mockData';
import { apiClient, isApiConfigured } from '@/api/client';

export function useLookupOptions() {
  const [organizations, setOrganizations] = useState<string[]>(ORGANIZATIONS);
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [coursesByDept, setCoursesByDept] = useState<Record<string, string[]>>(COURSES_BY_DEPT);
  const [interestsByCategory, setInterestsByCategory] = useState<
    Record<string, { label: string; color: string }[]>
  >(INTERESTS_BY_CATEGORY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isApiConfigured) return undefined;

    const loadLookups = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { organizations: orgRows, departments: deptRows, courses: courseRows, interests: interestRows } =
          await apiClient.getLookups();

        if (!isMounted) return;

        const orgNames = orgRows.map((row) => row.name).filter(Boolean);
        if (orgNames.length > 0) setOrganizations(orgNames);

        const deptNames = deptRows.map((row) => row.name).filter(Boolean);
        if (deptNames.length > 0) setDepartments(deptNames);

        const deptById = new Map(deptRows.map((row) => [row.id, row.name]));
        const nextCoursesByDept: Record<string, string[]> = {};
        courseRows.forEach((row) => {
          const deptName = deptById.get(row.department_id ?? '');
          if (!deptName) return;
          if (!nextCoursesByDept[deptName]) nextCoursesByDept[deptName] = [];
          nextCoursesByDept[deptName].push(row.name);
        });
        if (Object.keys(nextCoursesByDept).length > 0) setCoursesByDept(nextCoursesByDept);

        const nextInterestsByCategory: Record<string, { label: string; color: string }[]> = {};
        interestRows.forEach((row) => {
          if (!nextInterestsByCategory[row.category]) {
            nextInterestsByCategory[row.category] = [];
          }
          nextInterestsByCategory[row.category].push({
            label: row.name,
            color: row.color,
          });
        });
        if (Object.keys(nextInterestsByCategory).length > 0) setInterestsByCategory(nextInterestsByCategory);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load lookup options.';
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    organizations,
    departments,
    coursesByDept,
    interestsByCategory,
    yearLevels: YEAR_LEVELS,
    isLoading,
    error,
  };
}
