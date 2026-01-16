# API Documentation - Restaurant Menu Management System

This document outlines the API endpoints for the Menu Management system, including Categories, Items, and Modifier Groups.

---

## 1. Category API

### 1.1 Get All Categories
**GET** `/api/admin/menu/categories`

- **Description**: Lấy danh sách tất cả danh mục của nhà hàng, sắp xếp theo thứ tự hiển thị (`displayOrder`).
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": "uuid-string",
        "name": "Khai vị",
        "description": "Món ăn nhẹ",
        "displayOrder": 1,
        "status": "ACTIVE",
        "_count": { "items": 5 }
      }
    ]
    ```

### 1.2 Create Category
**POST** `/api/admin/menu/categories`

- **Description**: Tạo mới một danh mục món ăn.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Body**:
  ```json
  {
    "name": "Đồ uống",
    "description": "Các loại nước ngọt và bia",
    "displayOrder": 2,
    "status": "ACTIVE"
  }
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**: Category object vừa tạo.
- **Business Rules**:
  - `name` không được trùng lặp trong cùng một nhà hàng.
  - `displayOrder` mặc định là `0` nếu không truyền.

### 1.3 Update Category Basic Info
**PATCH** `/api/admin/menu/categories/:id`

- **Description**: Cập nhật thông tin cơ bản của danh mục.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (UUID của category)
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Body**:
  ```json
  {
    "name": "Đồ uống có gas",
    "description": "Đã cập nhật mô tả"
  }
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**: Category object sau khi cập nhật.

### 1.4 Update Category Status
**PATCH** `/api/admin/menu/categories/:id/status`

- **Description**: Thay đổi nhanh trạng thái (Kích hoạt/Vô hiệu hóa) của danh mục.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (UUID của category)
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Body**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
- **Response**:
  - **Status**: `200 OK`

---

## 2. Item API

### 2.1 Get All Items
**GET** `/api/admin/menu/items`

- **Description**: Lấy danh sách món ăn có hỗ trợ phân trang, lọc và sắp xếp.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Query Params**:
  - `page`: 1 (Mặc định)
  - `limit`: 10 (Mặc định)
  - `search`: Tên món ăn (Optional)
  - `categoryId`: UUID danh mục (Optional)
  - `status`: `AVAILABLE` / `SOLDOUT` (Optional)
  - `sort`: `price_asc` / `price_desc` / `newest` (Optional)
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "data": [
        { "id": "uuid", "name": "Phở Bò", "price": 50000, "category": { "name": "Món chính" } }
      ],
      "meta": {
        "total": 20,
        "page": 1,
        "limit": 10,
        "totalPages": 2
      }
    }
    ```

### 2.2 Create Item
**POST** `/api/admin/menu/items`

- **Description**: Tạo mới một món ăn vào một danh mục cụ thể.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Body**:
  ```json
  {
    "name": "Cơm Tấm Sườn Bì",
    "categoryId": "uuid-cua-danh-muc",
    "price": 45000,
    "description": "Sườn nướng than hoa",
    "prepTimeMinutes": 15,
    "status": "AVAILABLE",
    "isChefRecommended": true
  }
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**: Item object vừa tạo.
- **Business Rules**:
  - `price` phải là số dương lớn hơn 0.
  - `categoryId` phải tồn tại trong database của cùng nhà hàng.
  - Nếu không gửi `status`, mặc định là `AVAILABLE`.

### 2.3 Get Item Detail
**GET** `/api/admin/menu/items/:id`

- **Description**: Xem chi tiết một món ăn.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Params**: `id` (UUID của item)
- **Response**:
  - **Status**: `200 OK`
  - **Body**: Item object đầy đủ thông tin (kèm Category).

### 2.4 Update Item
**PATCH** `/api/admin/menu/items/:id`

- **Description**: Cập nhật thông tin món ăn (Giá, Tên, Trạng thái...).
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Params**: `id` (UUID của item)
- **Body**:
  ```json
  {
    "price": 50000,
    "status": "SOLDOUT"
  }
  ```
- **Response**:
  - **Status**: `200 OK`

### 2.5 Delete Item (Soft Delete)
**DELETE** `/api/admin/menu/items/:id`

- **Description**: Xóa mềm món ăn (Soft Delete).
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <JWT>`
- **Params**: `id` (UUID của item)
- **Response**:
  - **Status**: `200 OK`
  - **Body**: Item object với trường `isDeleted: true`.
- **Business Rules**:
  - Món ăn sẽ bị ẩn khỏi menu khách hàng và danh sách Admin (trừ khi lọc riêng).
  - Lịch sử đơn hàng (Order History) vẫn được giữ nguyên do không xóa cứng khỏi DB.

---

## 3. Modifier Group API

### 3.1 Get All Modifier Groups
**GET** `/api/admin/menu/modifier-groups`

- **Description**: Lấy danh sách tất cả modifier groups thuộc nhà hàng của quản trị viên.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": "mg_01",
        "name": "Size",
        "selectionType": "SINGLE",
        "required": true,
        "min": null,
        "max": null,
        "displayOrder": 1,
        "status": "ACTIVE"
      }
    ]
    ```

### 3.2 Get Modifier Group Detail
**GET** `/api/admin/menu/modifier-groups/:id`

- **Description**: Lấy thông tin chi tiết của một modifier group theo ID.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier group)
- **Request Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "id": "mg_01",
      "name": "Extras",
      "selectionType": "SINGLE",
      "required": false,
      "min": 0,
      "max": 4,
      "displayOrder": 2,
      "status": "ACTIVE",
      "options": []
    }
    ```
  - **Status**: `404 Not Found`
    ```json
    { "message": "Modifier group not found" }
    ```

### 3.3 Create Modifier Group
**POST** `/api/admin/menu/modifier-groups`

- **Description**: Tạo mới một modifier group cho menu.
- **Authentication**: Yêu cầu Token Admin.
- **Request Headers**: `Authorization: Bearer <access_token>`
- **Body**:
  ```json
  {
    "name": "Size",
    "selectionType": "SINGLE",
    "required": true,
    "displayOrder": 1,
    "status": "ACTIVE"
  }
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "id": "mg_02",
      "name": "Size",
      "selectionType": "SINGLE",
      "required": true
    }
    ```
  - **Status**: `400 Bad Request`
    ```json
    { "message": "Group name is required" }
    ```

### 3.4 Update Modifier Group
**PUT** `/api/admin/menu/modifier-groups/:id`

- **Description**: Cập nhật thông tin của modifier group.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier group)
- **Body**:
  ```json
  {
    "name": "Size Updated",
    "required": false,
    "displayOrder": 2
  }
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "id": "mg_02",
      "name": "Size Updated"
    }
    ```

### 3.5 Delete Modifier Group
**DELETE** `/api/admin/menu/modifier-groups/:id`

- **Description**: Xóa modifier group (chỉ cho phép khi chưa gán cho món ăn).
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier group)
- **Response**:
  - **Status**: `200 OK`
    ```json
    { "message": "Modifier group removed successfully" }
    ```
  - **Status**: `400 Bad Request`
    ```json
    { "message": "Modifier group is attached to items" }
    ```

### 3.6 Create Modifier Option
**POST** `/api/admin/menu/modifier-groups/:id/options`

- **Description**: Tạo mới một modifier option cho modifier group.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier group)
- **Body**:
  ```json
  {
    "name": "Cheese",
    "priceAdjustment": 0.5
  }
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "id": "opt_01",
      "name": "Cheese",
      "priceAdjustment": 0.5
    }
    ```

### 3.7 Update Modifier Option
**PUT** `/api/admin/menu/modifier-options/:id`

- **Description**: Cập nhật thông tin modifier option.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier option)
- **Body**:
  ```json
  {
    "name": "Extra Cheese",
    "priceAdjustment": 1.0
  }
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "id": "opt_01",
      "name": "Extra Cheese",
      "priceAdjustment": 1.0
    }
    ```

### 3.8 Delete Modifier Option
**DELETE** `/api/admin/menu/modifier-options/:id`

- **Description**: Xóa modifier option khỏi hệ thống.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của modifier option)
- **Response**:
  - **Status**: `200 OK`
    ```json
    { "message": "Modifier option removed successfully" }
    ```

### 3.9 Attach Modifier Groups to Menu Item
**POST** `/api/admin/menu/items/:id/modifier-groups`

- **Description**: Gán một hoặc nhiều modifier groups cho món ăn.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (ID của menu item)
- **Body**:
  ```json
  {
    "groupIds": ["mg_01", "mg_02"]
  }
  ```
- **Response**:
  - **Status**: `200 OK`
    ```json
    { "message": "Modifier groups attached to item successfully" }
    ```

---

## 4. Member 3: Photos & Guest Experience (Full-stack)

### 4.1 Photo Management

#### 4.1.1 Upload Photos
**POST** `/api/admin/menu/items/:id/photos`

- **Description**: Tải lên một hoặc nhiều ảnh cho một món ăn.
- **Authentication**: Yêu cầu Token Admin.
- **Params**: `id` (UUID của item)
- **Request Headers**: `Authorization: Bearer <JWT>`, `Content-Type: multipart/form-data`
- **Request Body**: `files` (Array of images)
- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "success": true,
      "count": 2,
      "photos": [
        {
          "id": "photo-uuid-1",
          "menuItemId": "item-uuid",
          "url": "/uploads/menu-items/filename1.jpg",
          "isPrimary": false
        },
        {
          "id": "photo-uuid-2",
          "menuItemId": "item-uuid",
          "url": "/uploads/menu-items/filename2.jpg",
          "isPrimary": false
        }
      ]
    }
    ```
- **Validation**:
  - Chỉ chấp nhận các định dạng: `JPG`, `JPEG`, `PNG`, `WebP`.
  - Giới hạn kích thước file: 5MB.

#### 4.1.2 Delete Photo
**DELETE** `/api/admin/menu/items/:id/photos/:photoId`

- **Description**: Xóa một ảnh cụ thể của món ăn (Xóa cả trong Database và File vật lý).
- **Authentication**: Yêu cầu Token Admin.
- **Params**: 
  - `id`: UUID của item
  - `photoId`: UUID của photo
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    { "success": true, "message": "Photo removed successfully and file deleted" }
    ```

#### 4.1.3 Set Primary Photo
**PATCH** `/api/admin/menu/items/:id/photos/:photoId/primary`

- **Description**: Đặt một ảnh làm ảnh đại diện chính cho món ăn (hiển thị đầu tiên trong menu khách hàng).
- **Authentication**: Yêu cầu Token Admin.
- **Params**:
  - `id`: UUID của item
  - `photoId`: UUID của photo
- **Response**:
  - **Status**: `200 OK`
  - **Body**: Đối tượng ảnh đã được cập nhật `isPrimary: true`.

### 4.2 Guest Menu API

#### 4.2.1 Get Guest Menu
**GET** `/api/menu`

- **Description**: Lấy toàn bộ thực đơn dành cho khách hàng dựa trên Token QR Code.
- **Authentication**: Yêu cầu `token` (JWT từ QR Code) truyền qua Query Params.
- **Query Params**:
  - `token`: Chuỗi JWT xác thực bàn và nhà hàng.
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "table": {
        "id": "table-uuid",
        "tableNumber": "01",
        "restaurantName": "Smart Restaurant"
      },
      "categories": [
        {
          "id": "cat-uuid",
          "name": "Khai vị",
          "status": "ACTIVE"
        }
      ],
      "menuItems": [
        {
          "id": "item-uuid",
          "name": "Phở Bò",
          "price": "50000.00",
          "categoryId": "cat-uuid",
          "photos": [
             { "url": "/uploads/menu-items/pho.jpg", "isPrimary": true }
          ],
          "modifierGroups": [
            {
              "group": {
                "name": "Thêm topping",
                "options": [
                  { "name": "Thịt thêm", "priceAdjustment": "15000.00" }
                ]
              }
            }
          ]
        }
      ]
    }
    ```
- **Business Rules**:
  - Chỉ trả về các Category có trạng thái `ACTIVE`.
  - Chỉ trả về các Item thuộc Category active và có trạng thái `AVAILABLE`.
  - Tự động kiểm tra tính hợp lệ của QR Token trước khi trả về dữ liệu.
