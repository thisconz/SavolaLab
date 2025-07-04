
# API Documentation

## Overview
This document provides an overview of the API endpoints available for the application. Each endpoint includes a description, request parameters, and response formats.

## Authentication
All API requests require authentication. Use the following method to authenticate:

- **Header**: `Authorization: Bearer <token>`

## Endpoints

### 1. Get User Information
- **Endpoint**: `/api/users/{id}`
- **Method**: `GET`
- **Description**: Retrieves information about a user by their ID.
- **Parameters**:
  - `id` (path, required): The ID of the user.
- **Response**:
  - **200 OK**: Returns user information.
  - **404 Not Found**: User not found.

### 2. Create New User
- **Endpoint**: `/api/users`
- **Method**: `POST`
- **Description**: Creates a new user.
- **Request Body**:
  - `name` (string, required): The name of the user.
  - `email` (string, required): The email address of the user.
- **Response**:
  - **201 Created**: Returns the created user information.
  - **400 Bad Request**: Invalid input data.

### 3. Update User Information
- **Endpoint**: `/api/users/{id}`
- **Method**: `PUT`
- **Description**: Updates information for an existing user.
- **Parameters**:
  - `id` (path, required): The ID of the user.
- **Request Body**:
  - `name` (string, optional): The updated name of the user.
  - `email` (string, optional): The updated email address of the user.
- **Response**:
  - **200 OK**: Returns the updated user information.
  - **404 Not Found**: User not found.

### 4. Delete User
- **Endpoint**: `/api/users/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a user by their ID.
- **Parameters**:
  - `id` (path, required): The ID of the user.
- **Response**:
  - **204 No Content**: User successfully deleted.
  - **404 Not Found**: User not found.

## Error Handling
All error responses will include a JSON object with the following structure:
```json
{
  "error": "Error message"
}
```

## Rate Limiting
To ensure fair usage, the API enforces rate limiting. Each user is allowed a maximum of 100 requests per hour.

## Contact
For any questions or issues, please contact support@example.com.
