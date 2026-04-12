# CODE STYLE & LINTING - ESLint & Prettier Configuration
## Team-wide Code Quality Standards

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Production-Ready  

---

# File 1: `.eslintrc.json`

```json
{
  "root": true,
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": [
    "@typescript-eslint",
    "import",
    "prettier"
  ],
  "rules": {
    // ERRORS
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    
    // TypeScript
    "@typescript-eslint/explicit-function-return-types": [
      "error",
      { "allowExpressions": true }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    
    // Import ordering
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "alphabeticalOrder": true,
        "newlines-between": "always"
      }
    ],
    
    // Best practices
    "prefer-const": "error",
    "no-unused-expressions": "error",
    "no-unreachable": "error",
    
    // Prettier
    "prettier/prettier": "error"
  },
  "overrides": [
    {
      "files": ["**/__tests__/**", "**/*.spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

---

# File 2: `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

# File 3: `.prettierignore`

```
node_modules/
dist/
build/
coverage/
.next/
*.min.js
package-lock.json
yarn.lock
```

---

# File 4: Pre-commit Hook (Husky)

## File: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint staged files
npx lint-staged
```

## File: `.lintstagedrc.json`

```json
{
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.json": [
    "prettier --write"
  ],
  "*.md": [
    "prettier --write"
  ]
}
```

---

# File 5: Setup Instructions

## Installation

```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-import husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

## Running Linter

```bash
# Check all files
npm run lint

# Fix all files
npm run lint:fix

# Check specific file
npm run lint -- src/services/students.service.ts

# Check only changed files
npm run lint:staged

# Format with Prettier
npm run format
```

---

# File 6: Team Guidelines

## Naming Conventions

```typescript
// Classes: PascalCase
class StudentsService {}

// Functions: camelCase
function markAttendance() {}

// Constants: UPPER_SNAKE_CASE
const MAX_STUDENTS_PER_CLASS = 50;

// Private members: _leadingUnderscore
class MyClass {
  private _studentCache: Map<string, Student>;
}

// React components: PascalCase
const StudentCard: React.FC = () => {};

// Files: kebab-case.ts
// src/services/students.service.ts
// src/components/student-card.tsx
```

## Function Guidelines

```typescript
// ✅ GOOD: Clear return type, comments for complex logic
function calculateGPA(marks: number[]): number {
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}

// ❌ BAD: No return type, unclear what it returns
function calculateGPA(marks) {
  return marks.reduce((a, b) => a + b) / marks.length;
}

// ✅ GOOD: Error handling
async function getStudent(schoolId: string, studentId: string): Promise<Student> {
  const student = await firestore.collection('students').doc(studentId).get();
  if (!student.exists()) {
    throw new NotFoundError(`Student ${studentId} not found`);
  }
  return student.data() as Student;
}

// ❌ BAD: No error handling
async function getStudent(schoolId: string, studentId: string) {
  return firestore.collection('students').doc(studentId).get();
}
```

## Comments & Documentation

```typescript
/**
 * Calculate student attendance percentage
 * @param presentDays - Number of days student was present
 * @param totalDays - Total working days in period
 * @returns Attendance percentage (0-100)
 * @throws {RangeError} if totalDays is 0
 */
function calculateAttendancePercentage(presentDays: number, totalDays: number): number {
  if (totalDays === 0) {
    throw new RangeError('Total days cannot be zero');
  }
  return (presentDays / totalDays) * 100;
}
```

---

**ESLint + Prettier enforce consistency across the team and catch bugs early.**
