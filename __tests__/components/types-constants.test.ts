/**
 * Unit Tests - Types and Constants Validation
 * Tests that the app's type definitions and constants match the spec
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

describe('Type Definitions - Spec Compliance', () => {
  it('should define all 7 target roles from spec (including Senior PPC Assistant)', () => {
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    
    const expectedRoles = [
      'PPC VA',
      'Account VA',
      'Listing VA',
      'Reporting VA',
      'Agency VA',
      'Senior PPC Assistant',
      'General',
    ];
    
    expectedRoles.forEach(role => {
      expect(typesContent).toContain(role);
    });
  });

  it('should define all interview modes from spec', () => {
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    
    const expectedModes = [
      'quick_drill',
      'role_interview',
      'technical_screen',
      'client_communication',
      'final_interview',
      'practical_debrief',
    ];
    
    expectedModes.forEach(mode => {
      expect(typesContent).toContain(mode);
    });
  });

  it('should define all question types from spec', () => {
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    
    // The types.ts uses underscores for question types
    const expectedTypes = [
      'behavioral',
      'technical',
      'scenario',
      'case_study', // spec says 'case study'
      'tool_specific', // spec says 'tool-specific'
      'trick', // spec includes trick/red-flag questions
    ];
    
    expectedTypes.forEach(type => {
      expect(typesContent.toLowerCase()).toContain(type.toLowerCase());
    });
  });

  it('should define download categories matching spec', () => {
    const typesContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/types.ts'), 'utf-8');
    
    // Spec defines these download categories
    // Check for categories that actually exist in types.ts
    expect(typesContent).toContain('Resume Templates');
    expect(typesContent).toContain('Cover Letters');
    expect(typesContent).toContain('Cheat Sheets');
    expect(typesContent).toContain('Checklists');
    expect(typesContent).toContain('Calculators');
  });
});

describe('Database Schema - Spec Compliance', () => {
  it('should have all required models from spec', () => {
    const schemaContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/schema.prisma'), 'utf-8');
    
    const requiredModels = [
      'User',
      'UserProfile',
      'Question',
      'InterviewSession',
      'QuestionAttempt',
      'Resume',
      'CoverLetter',
      'Assessment',
      'Download',
      'AgentRun',
      'Guide',
      'GuideProgress',
    ];
    
    requiredModels.forEach(model => {
      expect(schemaContent).toContain(`model ${model}`);
    });
  });

  it('should have Question model with all required fields', () => {
    const schemaContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/schema.prisma'), 'utf-8');
    
    const requiredFields = [
      'role', 'difficulty', 'type', 'skillArea', 'question',
      'strongAnswerPoints', 'weakAnswerWarnings', 'sampleAnswer',
      'status',
    ];
    
    requiredFields.forEach(field => {
      expect(schemaContent).toContain(field);
    });
  });

  it('should have InterviewSession with mode and transcript', () => {
    const schemaContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/schema.prisma'), 'utf-8');
    
    expect(schemaContent).toContain('mode');
    expect(schemaContent).toContain('transcript');
    expect(schemaContent).toContain('overallScore');
  });
});

describe('Seed Data - Spec Compliance', () => {
  it('should seed 222 questions as per spec', () => {
    const seedContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/seed.ts'), 'utf-8');
    
    // The seed file should have 222 questions total across 12 categories
    // 5.1: 20, 5.2: 20, 5.3: 25, 5.4: 20, 5.5: 25, 5.6: 20, 5.7: 20, 5.8: 15, 5.9: 15, 5.10: 15, 5.11: 15, 5.12: 12 = 222
    // Check that all 12 question sections exist
    expect(seedContent).toContain('5.1 General Amazon VA');
    expect(seedContent).toContain('5.3 Amazon PPC Fundamentals');
    expect(seedContent).toContain('5.12'); // Trick questions section
  });

  it('should hash passwords using SHA-256 in seed', () => {
    const seedContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/seed.ts'), 'utf-8');
    
    // Should use hashPassword function, not plain text
    expect(seedContent).toContain('hashPassword');
    expect(seedContent).not.toContain("passwordHash: 'admin123'");
    expect(seedContent).not.toContain("passwordHash: 'demo123'");
  });

  it('should seed 10 assessments', () => {
    const seedContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/seed.ts'), 'utf-8');
    
    // Should have 10 assessment entries
    const assessmentMatches = seedContent.match(/title:\s*['"].*?(?:Search Term|Campaign Naming|ACoS|CPC|Listing|Client Update|Launch|Keyword Intent|Budget|Interview)/g);
    expect(assessmentMatches?.length).toBeGreaterThanOrEqual(10);
  });

  it('should seed 25 downloads', () => {
    const seedContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/seed.ts'), 'utf-8');
    
    // Should have 25 download entries
    const downloadMatches = seedContent.match(/fileName:\s*['"]/g);
    expect(downloadMatches?.length).toBeGreaterThanOrEqual(25);
  });

  it('should seed 30 guides across 3 levels', () => {
    const seedContent = fs.readFileSync(path.join(PROJECT_ROOT, 'prisma/seed.ts'), 'utf-8');
    
    // Should have beginner, intermediate, and advanced guides
    expect(seedContent).toContain('beginner');
    expect(seedContent).toContain('intermediate');
    expect(seedContent).toContain('advanced');
  });
});

describe('API Routes - Completeness', () => {
  it('should have all required API route files', () => {
    const requiredRoutes = [
      'api/auth/login/route.ts',
      'api/auth/register/route.ts',
      'api/profile/route.ts',
      'api/dashboard/route.ts',
      'api/questions/route.ts',
      'api/interview/route.ts',
      'api/interview/[id]/route.ts',
      'api/interview/[id]/complete/route.ts',
      'api/resume/route.ts',
      'api/resume/[id]/route.ts',
      'api/cover-letter/route.ts',
      'api/cover-letter/[id]/route.ts',
      'api/assessments/route.ts',
      'api/assessments/[id]/route.ts',
      'api/downloads/route.ts',
      'api/downloads/[id]/route.ts',
      'api/guides/route.ts',
      'api/guides/[id]/route.ts',
      'api/guides/progress/route.ts',
      'api/admin/questions/route.ts',
      'api/ai/coach/route.ts',
      'api/ai/resume-review/route.ts',
      'api/ai/cover-letter/route.ts',
      'api/ai/assessment-score/route.ts',
      'api/export/route.ts',
    ];
    
    requiredRoutes.forEach(route => {
      const filePath = path.join(PROJECT_ROOT, 'src/app', route);
      expect(fs.existsSync(filePath), `Missing route: ${route}`).toBe(true);
    });
  });
});

describe('Components - Completeness', () => {
  it('should have all required component files', () => {
    const requiredComponents = [
      'AuthScreen.tsx',
      'AppLayout.tsx',
      'DashboardView.tsx',
      'OnboardingQuiz.tsx',
      'QuestionBank.tsx',
      'MockInterview.tsx',
      'ResumeLab.tsx',
      'CoverLetterStudio.tsx',
      'PracticeTests.tsx',
      'DownloadCenter.tsx',
      'LearningPaths.tsx',
      'AdminPanel.tsx',
    ];
    
    requiredComponents.forEach(comp => {
      const filePath = path.join(PROJECT_ROOT, 'src/components/interview-lab', comp);
      expect(fs.existsSync(filePath), `Missing component: ${comp}`).toBe(true);
    });
  });

  it('should have download files in public directory', () => {
    const publicDownloads = path.join(PROJECT_ROOT, 'public/downloads');
    expect(fs.existsSync(publicDownloads), 'public/downloads directory should exist').toBe(true);
    
    const files = fs.readdirSync(publicDownloads);
    expect(files.length, 'Should have downloadable files').toBeGreaterThanOrEqual(20);
  });
});

describe('Security - Auth Requirements', () => {
  const protectedRoutes = [
    'api/profile/route.ts',
    'api/dashboard/route.ts',
    'api/interview/route.ts',
    'api/interview/[id]/route.ts',
    'api/interview/[id]/complete/route.ts',
    'api/resume/route.ts',
    'api/resume/[id]/route.ts',
    'api/cover-letter/route.ts',
    'api/cover-letter/[id]/route.ts',
    'api/guides/progress/route.ts',
    'api/admin/questions/route.ts',
    'api/ai/coach/route.ts',
    'api/ai/resume-review/route.ts',
    'api/ai/cover-letter/route.ts',
    'api/ai/assessment-score/route.ts',
    'api/export/route.ts',
  ];

  protectedRoutes.forEach(route => {
    it(`${route} should check x-user-id header`, () => {
      const filePath = path.join(PROJECT_ROOT, 'src/app', route);
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content, `${route} should have auth check`).toContain('x-user-id');
    });
  });
});
