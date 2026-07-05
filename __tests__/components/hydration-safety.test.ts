/**
 * Hydration Safety Tests
 * Ensures the app doesn't have SSR/client hydration mismatches
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Resolve project root dynamically so tests work regardless of install location
let PROJECT_ROOT = process.cwd();
while (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
  const parent = path.dirname(PROJECT_ROOT);
  if (parent === PROJECT_ROOT) break;
  PROJECT_ROOT = parent;
}

describe('Hydration Safety', () => {
  it('auth-context should not use typeof window in useState initializers', () => {
    const authContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/auth-context.tsx'), 'utf-8');
    
    // These patterns cause hydration mismatches because they produce different
    // values on server vs client during the first render
    expect(authContent).not.toMatch(/useState.*typeof window/);
    expect(authContent).not.toMatch(/useState\(\(\)\s*=>\s*typeof window/);
  });

  it('auth-context should initialize loading as true for SSR consistency', () => {
    const authContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/auth-context.tsx'), 'utf-8');
    
    // Loading should start as true so both server and client render the loading state
    expect(authContent).toContain('useState(true)');
  });

  it('auth-context should read localStorage only in useEffect', () => {
    const authContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/auth-context.tsx'), 'utf-8');
    
    // localStorage access should be inside useEffect, not useState initializer
    const useEffectBlock = authContent.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?localStorage[\s\S]*?\},\s*\[\]\)/);
    expect(useEffectBlock).not.toBeNull();
  });

  it('LandingPage should not use new Date() in render', () => {
    const landingContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/interview-lab/LandingPage.tsx'), 'utf-8');
    
    // Dynamic date in JSX causes hydration mismatch if server and client are in different timezones
    expect(landingContent).not.toMatch(/\{new Date\(\)\.getFullYear\(\)\}/);
  });

  it('no component should use typeof window checks in JSX return', () => {
    const componentDir = path.join(PROJECT_ROOT, 'src/components/interview-lab');
    const files = fs.readdirSync(componentDir).filter(f => f.endsWith('.tsx'));
    
    const problematicPatterns = [
      /typeof window\s*!==\s*['"]undefined['"]\s*\?.*:/,  // ternary in JSX
      /typeof window\s*===\s*['"]undefined['"]\s*\?.*:/,  // ternary in JSX
    ];
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(componentDir, file), 'utf-8');
      // Check that typeof window is not used in a way that affects rendered output
      // It's OK to use in useEffect or event handlers
      problematicPatterns.forEach(pattern => {
        // Only flag if the pattern appears outside of function bodies (in JSX return area)
        // This is a heuristic - we check if the pattern exists at all and warn
        const matches = content.match(pattern);
        if (matches) {
          // Check if it's inside a JSX return (rough heuristic)
          const returnIndex = content.lastIndexOf('return (', content.indexOf(matches[0]));
          const patternIndex = content.indexOf(matches[0]);
          if (returnIndex !== -1 && patternIndex > returnIndex) {
            // Pattern found in JSX return area - this is a hydration risk
            expect.fail(`${file}: typeof window check found in JSX return area - hydration risk`);
          }
        }
      });
    });
  });
});

describe('ROLES Consistency', () => {
  it('all filter dropdowns should use ROLES from types.ts', () => {
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    const rolesMatch = typesContent.match(/export const ROLES\s*=\s*\[([\s\S]*?)\]/);
    expect(rolesMatch).not.toBeNull();
    
    // Parse ROLES array
    const rolesStr = rolesMatch![1];
    const roles = rolesStr.match(/'([^']+)'/g)?.map(r => r.replace(/'/g, '')) || [];
    expect(roles.length).toBeGreaterThanOrEqual(6);
    
    // Check that filter components import ROLES
    const filterComponents = [
      'DownloadCenter.tsx',
      'PracticeTests.tsx',
      'LearningPaths.tsx',
    ];
    
    const componentDir = path.join(PROJECT_ROOT, 'src/components/interview-lab');
    
    filterComponents.forEach(comp => {
      const content = fs.readFileSync(path.join(componentDir, comp), 'utf-8');
      // Component should either import ROLES or list all roles manually
      const importsROLES = content.includes('ROLES') && content.includes("from '@/lib/types'");
      const hasAllRoles = roles.every(role => content.includes(role));
      
      expect(importsROLES || hasAllRoles, 
        `${comp} should either import ROLES from types or include all role options`).toBe(true);
    });
  });

  it('OnboardingQuiz should have descriptions for all ROLES', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'src/components/interview-lab/OnboardingQuiz.tsx'), 'utf-8'
    );
    
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    const rolesMatch = typesContent.match(/export const ROLES\s*=\s*\[([\s\S]*?)\]/);
    const roles = rolesMatch![1].match(/'([^']+)'/g)?.map(r => r.replace(/'/g, '')) || [];
    
    roles.forEach(role => {
      expect(content, `OnboardingQuiz missing description for ${role}`).toContain(role);
    });
  });
});
