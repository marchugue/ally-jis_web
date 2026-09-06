import { useEffect, useState } from 'react';
import { COURSES_BY_DEPT, DEPARTMENTS, INTERESTS_BY_CATEGORY, ORGANIZATIONS, YEAR_LEVELS } from '@/data/mockData';
import { apiClient, isApiConfigured } from '@/api/client';

interface CachedLookups {
  organizations: string[];
  departments: string[];
  coursesByDept: Record<string, string[]>;
  interestsByCategory: Record<string, { label: string; color: string }[]>;
}

// Module-level cache: lookup options rarely change and are shared across all pages
let cachedLookups: CachedLookups | null = null;
let pendingPromise: Promise<CachedLookups> | null = null;

async function fetchAndCacheLookups(): Promise<CachedLookups> {
  if (cachedLookups) return cachedLookups;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    const { organizations: orgRows, departments: deptRows, courses: courseRows, interests: interestRows } =
      await apiClient.getLookups();

    const orgNames = orgRows.map((row) => row.name).filter(Boolean);
    const deptNames = deptRows.map((row) => row.name).filter(Boolean);

    const deptById = new Map(deptRows.map((row) => [row.id, row.name]));
    const nextCoursesByDept: Record<string, string[]> = {};
    courseRows.forEach((row) => {
      const deptName = deptById.get(row.department_id ?? '');
      if (!deptName) return;
      if (!nextCoursesByDept[deptName]) nextCoursesByDept[deptName] = [];
      nextCoursesByDept[deptName].push(row.name);
    });

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

    const result: CachedLookups = {
      organizations: orgNames.length > 0 ? orgNames : ORGANIZATIONS,
      departments: deptNames.length > 0 ? deptNames : DEPARTMENTS,
      coursesByDept: Object.keys(nextCoursesByDept).length > 0 ? nextCoursesByDept : COURSES_BY_DEPT,
      interestsByCategory:
        Object.keys(nextInterestsByCategory).length > 0 ? nextInterestsByCategory : INTERESTS_BY_CATEGORY,
    };

    cachedLookups = result;
    pendingPromise = null;
    return result;
  })().catch((err) => {
    pendingPromise = null;
    throw err;
  });

  return pendingPromise;
}

export function useLookupOptions() {
  const [organizations, setOrganizations] = useState<string[]>(
    () => cachedLookups?.organizations ?? ORGANIZATIONS
  );
  const [departments, setDepartments] = useState<string[]>(
    () => cachedLookups?.departments ?? DEPARTMENTS
  );
  const [coursesByDept, setCoursesByDept] = useState<Record<string, string[]>>(
    () => cachedLookups?.coursesByDept ?? COURSES_BY_DEPT
  );
  const [interestsByCategory, setInterestsByCategory] = useState<
    Record<string, { label: string; color: string }[]>
  >(() => cachedLookups?.interestsByCategory ?? INTERESTS_BY_CATEGORY);
  const [isLoading, setIsLoading] = useState(() => !cachedLookups && isApiConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isApiConfigured || cachedLookups) {
      if (isMounted) setIsLoading(false);
      return undefined;
    }

    const loadLookups = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAndCacheLookups();
        if (!isMounted) return;

        setOrganizations(data.organizations);
        setDepartments(data.departments);
        setCoursesByDept(data.coursesByDept);
        setInterestsByCategory(data.interestsByCategory);
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
