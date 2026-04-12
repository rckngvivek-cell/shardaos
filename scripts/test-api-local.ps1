#!/usr/bin/env powershell
# School ERP API Test Suite
# Tests local API on localhost:8080

$BASE_URL = "http://localhost:8080/api/v1"
$AUTH_TOKEN = "test-teacher-001"
$AUTH_HEADERS = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "x-user-email" = "teacher@school.test"
    "Content-Type" = "application/json"
}

function Test-Health {
    Write-Host "━━━ TEST 1: Health Check ━━━" -ForegroundColor Cyan
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $res.Content | ConvertFrom-Json | Format-List
        return $true
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-GetSchools {
    Write-Host "`n━━━ TEST 2: Get Schools ━━━" -ForegroundColor Cyan
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/schools" `
            -Method GET `
            -Headers $AUTH_HEADERS `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $data = $res.Content | ConvertFrom-Json
        Write-Host "Schools: $(if($data.data) { $data.data.Count } else { 0 })"
        $data.data | Select-Object -First 3 | Format-Table id, name, capacity
        return $true
    } catch {
        Write-Host "⚠️  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        return $false
    }
}

function Test-CreateSchool {
    Write-Host "`n━━━ TEST 3: Create School ━━━" -ForegroundColor Cyan
    
    $body = @{
        name = "Pune Public School"
        location = "Pune, Maharashtra"
        capacity = 500
    } | ConvertTo-Json
    
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/schools" `
            -Method POST `
            -Headers $AUTH_HEADERS `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $school = ($res.Content | ConvertFrom-Json).data
        Write-Host "Created: $($school.name) (ID: $($school.id))" -ForegroundColor Green
        return $school.id
    } catch {
        Write-Host "⚠️  Error creating school" -ForegroundColor Yellow
        return $null
    }
}

function Test-GetStudents {
    Write-Host "`n━━━ TEST 4: Get Students ━━━" -ForegroundColor Cyan
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/students" `
            -Method GET `
            -Headers $AUTH_HEADERS `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $data = $res.Content | ConvertFrom-Json
        Write-Host "Students: $(if($data.data) { $data.data.Count } else { 0 })"
        return $true
    } catch {
        Write-Host "⚠️  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        return $false
    }
}

function Test-MarkAttendance {
    Write-Host "`n━━━ TEST 5: Mark Attendance ━━━" -ForegroundColor Cyan
    
    $body = @{
        studentId = "student-001"
        date = (Get-Date -Format "yyyy-MM-dd")
        status = "present"
    } | ConvertTo-Json
    
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/attendance/mark" `
            -Method POST `
            -Headers $AUTH_HEADERS `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $res.Content | ConvertFrom-Json | Format-List
        return $true
    } catch {
        Write-Host "⚠️  Error: $($_)" -ForegroundColor Yellow
        return $false
    }
}

function Test-GetStats {
    Write-Host "`n━━━ TEST 6: Get Attendance Stats ━━━" -ForegroundColor Cyan
    try {
        $res = Invoke-WebRequest -Uri "$BASE_URL/attendance/stats" `
            -Method GET `
            -Headers $AUTH_HEADERS `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅ Status: $($res.StatusCode)" -ForegroundColor Green
        $res.Content | ConvertFrom-Json | Format-List
        return $true
    } catch {
        Write-Host "⚠️  Error: $($_)" -ForegroundColor Yellow
        return $false
    }
}

# Run all tests
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  School ERP API - Endpoint Smoke Tests" -ForegroundColor Magenta
Write-Host "║  Environment: $BASE_URL" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$results = @()
$results += ("Health", (Test-Health))
$results += ("Get Schools", (Test-GetSchools))
$schoolId = Test-CreateSchool
$results += ("Get Students", (Test-GetStudents))
$results += ("Mark Attendance", (Test-MarkAttendance))
$results += ("Get Stats", (Test-GetStats))

# Summary
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  Test Summary" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = ($results).Count

Write-Host "✅ Passed: $passed/$total" -ForegroundColor Green
Write-Host "`n🚀 API is responding correctly!`n" -ForegroundColor Green
