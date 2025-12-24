# API Testing Examples - Table Management

## 🚀 Base URL
```
http://localhost:3000/api
```

---

## 📋 Endpoints

### 1. Tạo Bàn Mới (POST /tables)

**Request:**
```bash
curl -X POST http://localhost:3000/api/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T99",
    "capacity": 6,
    "location": "VIP Room",
    "description": "Bàn VIP gần cửa sổ"
  }'
```

**PowerShell:**
```powershell
$body = '{"tableNumber":"T99","capacity":6,"location":"VIP Room","description":"Bàn VIP"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/tables" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**Response (201 Created):**
```json
{
  "id": "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7",
  "tableNumber": "T99",
  "capacity": 6,
  "location": "VIP Room",
  "description": "Bàn VIP gần cửa sổ",
  "status": "ACTIVE",
  "qrToken": null,
  "createdAt": "2025-12-14T17:48:20.127Z",
  "updatedAt": "2025-12-14T17:48:20.127Z"
}
```

**Validation Rules:**
- `tableNumber`: Required, unique, string
- `capacity`: Required, number 1-20
- `location`: Optional, string
- `description`: Optional, string

**Error Examples:**
```json
// Capacity < 1
{"message":["capacity must not be less than 1"],"error":"Bad Request","statusCode":400}

// Capacity > 20
{"message":["capacity must not be greater than 20"],"error":"Bad Request","statusCode":400}

// Duplicate table number
{"message":"Table number already exists","error":"Bad Request","statusCode":400}

// Missing required fields
{"message":["tableNumber should not be empty","capacity must be a number"],"error":"Bad Request","statusCode":400}
```

---

### 2. Lấy Danh Sách Bàn (GET /tables)

**Get All Tables:**
```bash
curl http://localhost:3000/api/tables
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tables" -Method GET
```

**Filter by Status:**
```bash
curl "http://localhost:3000/api/tables?status=ACTIVE"
curl "http://localhost:3000/api/tables?status=INACTIVE"
```

**Filter by Location:**
```bash
curl "http://localhost:3000/api/tables?location=Indoor"
curl "http://localhost:3000/api/tables?location=Outdoor"
curl "http://localhost:3000/api/tables?location=VIP%20Room"
```

**Multiple Filters:**
```bash
curl "http://localhost:3000/api/tables?status=ACTIVE&location=Indoor"
```

**Sort by Field:**
```bash
# Sort by capacity descending
curl "http://localhost:3000/api/tables?sortBy=capacity:desc"

# Sort by table number ascending (default)
curl "http://localhost:3000/api/tables?sortBy=tableNumber:asc"

# Sort by created date
curl "http://localhost:3000/api/tables?sortBy=createdAt:desc"
```

**PowerShell with Filter:**
```powershell
# Get all Outdoor tables
Invoke-RestMethod -Uri "http://localhost:3000/api/tables?location=Outdoor"

# Get ACTIVE tables sorted by capacity
Invoke-RestMethod -Uri "http://localhost:3000/api/tables?status=ACTIVE&sortBy=capacity:desc"
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "tableNumber": "T01",
    "capacity": 4,
    "location": "Indoor",
    "description": "Table near window",
    "status": "ACTIVE",
    "qrToken": null,
    "createdAt": "2025-12-14T17:00:00.000Z",
    "updatedAt": "2025-12-14T17:00:00.000Z"
  },
  // ... more tables
]
```

---

### 3. Lấy Chi Tiết 1 Bàn (GET /tables/:id)

**Request:**
```bash
curl http://localhost:3000/api/tables/35a4c6f4-6cb9-4457-ac86-216ffe58fcd7
```

**PowerShell:**
```powershell
$id = "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7"
Invoke-RestMethod -Uri "http://localhost:3000/api/tables/$id"
```

**Response (200 OK):**
```json
{
  "id": "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7",
  "tableNumber": "T99",
  "capacity": 6,
  "location": "VIP Room",
  "description": "Bàn VIP gần cửa sổ",
  "status": "ACTIVE",
  "qrToken": null,
  "createdAt": "2025-12-14T17:48:20.127Z",
  "updatedAt": "2025-12-14T17:48:20.127Z"
}
```

**Error (404 Not Found):**
```json
{
  "message": "Table with ID xxx not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 4. Cập Nhật Bàn (PUT /tables/:id)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/tables/35a4c6f4-6cb9-4457-ac86-216ffe58fcd7 \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T99-Updated",
    "capacity": 8,
    "location": "VIP Room",
    "description": "Bàn VIP đã nâng cấp"
  }'
```

**PowerShell:**
```powershell
$id = "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7"
$body = @{
    tableNumber = "T99-Updated"
    capacity = 8
    location = "Outdoor"
    description = "Bàn đã di chuyển ra ngoài"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/tables/$id" `
  -Method PUT `
  -Body $body `
  -ContentType "application/json"
```

**Response (200 OK):**
```json
{
  "id": "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7",
  "tableNumber": "T99-Updated",
  "capacity": 8,
  "location": "Outdoor",
  "description": "Bàn đã di chuyển ra ngoài",
  "status": "ACTIVE",
  "qrToken": null,
  "createdAt": "2025-12-14T17:48:20.127Z",
  "updatedAt": "2025-12-14T18:00:00.000Z"
}
```

---

### 5. Soft Delete - Đổi Trạng Thái (PATCH /tables/:id/status)

**Deactivate (Soft Delete):**
```bash
curl -X PATCH http://localhost:3000/api/tables/35a4c6f4-6cb9-4457-ac86-216ffe58fcd7/status \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'
```

**Reactivate:**
```bash
curl -X PATCH http://localhost:3000/api/tables/35a4c6f4-6cb9-4457-ac86-216ffe58fcd7/status \
  -H "Content-Type: application/json" \
  -d '{"status": "ACTIVE"}'
```

**PowerShell:**
```powershell
$id = "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7"

# Deactivate
$body = '{"status":"INACTIVE"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/tables/$id/status" `
  -Method PATCH `
  -Body $body `
  -ContentType "application/json"

# Reactivate
$body = '{"status":"ACTIVE"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/tables/$id/status" `
  -Method PATCH `
  -Body $body `
  -ContentType "application/json"
```

**Response (200 OK):**
```json
{
  "id": "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7",
  "tableNumber": "T99",
  "capacity": 6,
  "location": "VIP Room",
  "status": "INACTIVE",
  // ... other fields
}
```

---

### 6. Xóa Bàn (DELETE /tables/:id)

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/tables/35a4c6f4-6cb9-4457-ac86-216ffe58fcd7
```

**PowerShell:**
```powershell
$id = "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7"
Invoke-RestMethod -Uri "http://localhost:3000/api/tables/$id" -Method DELETE
```

**Response (200 OK):**
```json
{
  "id": "35a4c6f4-6cb9-4457-ac86-216ffe58fcd7",
  "tableNumber": "T99",
  // ... deleted table data
}
```

---

### 7. Lấy Danh Sách Locations (GET /tables/locations)

**Request:**
```bash
curl http://localhost:3000/api/tables/locations
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tables/locations"
```

**Response (200 OK):**
```json
[
  "Indoor",
  "Outdoor",
  "Patio",
  "VIP Room"
]
```

---

## 🧪 Complete Test Script (PowerShell)

```powershell
# Test Suite - Table Management API

Write-Host "=== TABLE MANAGEMENT API TEST ===" -ForegroundColor Cyan
$baseUrl = "http://localhost:3000/api"

# Test 1: Create Table
Write-Host "`n[1] Creating new table..." -ForegroundColor Yellow
$newTable = @{
    tableNumber = "T999"
    capacity = 6
    location = "VIP Room"
    description = "Test table"
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "$baseUrl/tables" -Method POST -Body $newTable -ContentType "application/json"
Write-Host "✅ Created: $($created.tableNumber)" -ForegroundColor Green
$testId = $created.id

# Test 2: Get All Tables
Write-Host "`n[2] Getting all tables..." -ForegroundColor Yellow
$tables = Invoke-RestMethod -Uri "$baseUrl/tables"
Write-Host "✅ Total tables: $($tables.Count)" -ForegroundColor Green

# Test 3: Filter by location
Write-Host "`n[3] Filtering by VIP Room..." -ForegroundColor Yellow
$vipTables = Invoke-RestMethod -Uri "$baseUrl/tables?location=VIP%20Room"
Write-Host "✅ VIP tables: $($vipTables.Count)" -ForegroundColor Green

# Test 4: Get one table
Write-Host "`n[4] Getting table details..." -ForegroundColor Yellow
$table = Invoke-RestMethod -Uri "$baseUrl/tables/$testId"
Write-Host "✅ Table: $($table.tableNumber) - $($table.capacity) seats" -ForegroundColor Green

# Test 5: Update table
Write-Host "`n[5] Updating table..." -ForegroundColor Yellow
$update = @{
    capacity = 8
    description = "Updated test table"
} | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "$baseUrl/tables/$testId" -Method PUT -Body $update -ContentType "application/json"
Write-Host "✅ Updated capacity: $($updated.capacity)" -ForegroundColor Green

# Test 6: Soft delete
Write-Host "`n[6] Deactivating table..." -ForegroundColor Yellow
$status = '{"status":"INACTIVE"}' 
$deactivated = Invoke-RestMethod -Uri "$baseUrl/tables/$testId/status" -Method PATCH -Body $status -ContentType "application/json"
Write-Host "✅ Status: $($deactivated.status)" -ForegroundColor Green

# Test 7: Hard delete
Write-Host "`n[7] Deleting table..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$baseUrl/tables/$testId" -Method DELETE
Write-Host "✅ Table deleted" -ForegroundColor Green

Write-Host "`n=== ALL TESTS PASSED ===" -ForegroundColor Green
```

---

## 📝 Notes

### Status Values
- `ACTIVE` - Bàn đang hoạt động
- `INACTIVE` - Bàn bị vô hiệu hóa (soft delete)

### Location Examples
- Indoor
- Outdoor
- Patio
- VIP Room
- Bar Area
- Garden
- Rooftop
- (Any custom location)

### Capacity Range
- Minimum: 1
- Maximum: 20

### Common Error Codes
- `400 Bad Request` - Validation error hoặc duplicate table number
- `404 Not Found` - Table không tồn tại
- `500 Internal Server Error` - Database hoặc server error
