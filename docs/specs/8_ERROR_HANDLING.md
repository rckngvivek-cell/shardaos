# ERROR HANDLING & RESPONSE SPECIFICATIONS
## Standardized Error Responses Across All Endpoints

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Production-Ready  

---

# PART 1: HTTP Status Codes

```
2xx SUCCESS:
├─ 200 OK              (GET, PATCH, general success)
├─ 201 CREATED         (POST - new resource created)
└─ 204 NO CONTENT      (DELETE successful, no body returned)

4xx CLIENT ERROR:
├─ 400 BAD REQUEST     (Invalid input, validation failed)
├─ 401 UNAUTHORIZED    (No/invalid authentication token)
├─ 403 FORBIDDEN       (Authenticated but lacks permission)
├─ 404 NOT FOUND       (Resource doesn't exist)
├─ 409 CONFLICT        (Resource already exists, duplicate)
├─ 410 GONE            (Resource permanently deleted)
├─ 413 PAYLOAD TOO LARGE(File/request body too large)
├─ 415 UNSUPPORTED     (Wrong content-type header)
├─ 422 UNPROCESSABLE   (Valid format but semantic error)
└─ 429 TOO MANY        (Rate limit exceeded)

5xx SERVER ERROR:
├─ 500 INTERNAL ERROR  (Unexpected server error)
├─ 502 BAD GATEWAY     (Upstream service failed)
├─ 503 UNAVAILABLE     (Service temporarily down)
└─ 504 GATEWAY TIMEOUT (Upstream took too long)
```

---

# PART 2: Standard Error Response Format

## All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IN_UPPER_SNAKE_CASE",
    "message": "Human-readable error message",
    "status": 400,
    "details": {
      // Additional debugging info (only in dev/staging)
    }
  },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

# PART 3: Error Codes & Examples

## AUTHENTICATION ERRORS (401)

```typescript
// Error code: UNAUTHORIZED
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "status": 401,
    "details": {
      "reason": "Token expired at 2026-04-08T09:30:00Z"
    }
  }
}

// Error code: INVALID_CREDENTIALS
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "status": 401
  }
}

// Error code: TOKEN_REVOKED
{
  "success": false,
  "error": {
    "code": "TOKEN_REVOKED",
    "message": "User token has been revoked. Please login again.",
    "status": 401
  }
}
```

## AUTHORIZATION ERRORS (403)

```typescript
// Error code: PERMISSION_DENIED
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to access this resource",
    "status": 403,
    "details": {
      "requiredRole": "admin",
      "userRole": "teacher"
    }
  }
}

// Error code: CROSS_SCHOOL_ACCESS_DENIED
{
  "success": false,
  "error": {
    "code": "CROSS_SCHOOL_ACCESS_DENIED",
    "message": "Cannot access data from another school",
    "status": 403,
    "details": {
      "userSchoolId": "school_001",
      "requestedSchoolId": "school_002"
    }
  }
}
```

## VALIDATION ERRORS (400)

```typescript
// Error code: VALIDATION_ERROR
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "status": 400,
    "details": {
      "firstName": "First name is required",
      "email": "Invalid email format",
      "dob": "Date of birth cannot be in future"
    }
  }
}

// Error code: INVALID_INPUT
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid value for field 'class'",
    "status": 400,
    "details": {
      "field": "class",
      "value": 13,
      "reason": "Class must be between 1 and 12"
    }
  }
}

// Error code: MISSING_REQUIRED_FIELD
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Missing required field: 'lastName'",
    "status": 400,
    "details": {
      "field": "lastName"
    }
  }
}
```

## RESOURCE NOT FOUND (404)

```typescript
// Error code: STUDENT_NOT_FOUND
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with ID 'std_123' not found",
    "status": 404,
    "details": {
      "resourceType": "student",
      "resourceId": "std_123"
    }
  }
}

// Error code: SCHOOL_NOT_FOUND
{
  "success": false,
  "error": {
    "code": "SCHOOL_NOT_FOUND",
    "message": "School not found",
    "status": 404
  }
}
```

## CONFLICT ERRORS (409)

```typescript
// Error code: DUPLICATE_RECORD
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RECORD",
    "message": "Student with this email already exists",
    "status": 409,
    "details": {
      "field": "email",
      "value": "student@school.com",
      "existingId": "std_existing_001"
    }
  }
}

// Error code: ATTENDANCE_ALREADY_MARKED
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_ALREADY_MARKED",
    "message": "Attendance for Class 5-A on 2026-04-08 already marked",
    "status": 409,
    "details": {
      "markedAt": "2026-04-08T10:30:00Z",
      "markedBy": "teacher_001"
    }
  }
}
```

## RATE LIMIT (429)

```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds.",
    "status": 429,
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "window": "1 minute"
    }
  }
}
```

## SERVER ERRORS (500)

```typescript
// Error code: INTERNAL_SERVER_ERROR
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "status": 500,
    "details": {
      "errorId": "err_12345" // For support/debugging
    }
  }
}

// Error code: DATABASE_ERROR
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to save data to database",
    "status": 500,
    "details": {
      "errorId": "err_database_timeout_001"
    }
  }
}

// Error code: EXTERNAL_SERVICE_ERROR
{
  "success": false,
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "Failed to send SMS notification",
    "status": 500,
    "details": {
      "service": "Exotel SMS",
      "errorId": "err_sms_provider_001"
    }
  }
}
```

---

# PART 4: Error Handling in Code

## TypeScript Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType.toUpperCase()}_NOT_FOUND`,
      `${resourceType} with ID '${resourceId}' not found`,
      404,
      { resourceType, resourceId }
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: Record<string, any>) {
    super(code, message, 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super(
      'RATE_LIMIT_EXCEEDED',
      `Too many requests. Try again in ${retryAfter} seconds.`,
      429,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}
```

## Error Handling Middleware

```typescript
// Express middleware to handle errors
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const requestId = req.get('x-request-id') || generateRequestId();

  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    requestId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: error.status,
        details: process.env.NODE_ENV === 'production' 
          ? undefined 
          : error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Unknown error (should not happen in production)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      errorId: `err_${requestId}`, // For support tickets
    },
  });
};
```

---

# PART 5: Validation Rules

```typescript
// Field validation examples
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

export const validateDOB = (dob: Date): boolean => {
  const today = new Date();
  return dob <= today;
};

export const validateClass = (classNum: number): boolean => {
  return classNum >= 1 && classNum <= 12;
};

export const validateMarks = (obtained: number, total: number): boolean => {
  return obtained >= 0 && obtained <= total;
};
```

---

**These error standards ensure consistent, informative error responses that help clients handle failures gracefully.**
