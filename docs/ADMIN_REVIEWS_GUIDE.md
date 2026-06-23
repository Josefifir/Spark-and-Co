# Admin Review Dashboard - User Guide

## Overview

The enhanced admin review dashboard provides powerful tools for managing customer product reviews efficiently. This guide covers all features including bulk actions, advanced filtering, search, and sorting capabilities.

---

## Features

### 1. **Bulk Actions**

Process multiple reviews simultaneously to save time when moderating large volumes of reviews.

#### Available Bulk Actions:
- **Approve Selected** - Approve multiple pending reviews at once
- **Reject Selected** - Reject multiple reviews with an optional admin note
- **Delete Selected** - Permanently delete multiple reviews (requires confirmation)

#### How to Use:
1. Select reviews using the checkboxes in the leftmost column
2. Use "Select All" checkbox in the header to select all reviews on the current page
3. The bulk action toolbar appears when one or more reviews are selected
4. Click the desired action button
5. For bulk reject, you'll be prompted to add an optional admin note
6. For bulk delete, you'll need to confirm the action

#### API Endpoint:
```
POST /api/admin/reviews/bulk
```

**Request Body:**
```json
{
  "reviewIds": ["review_id_1", "review_id_2"],
  "action": "approve" | "reject" | "delete",
  "adminNote": "Optional note for reject action"
}
```

**Response:**
```json
{
  "success": 5,
  "failed": 0,
  "errors": [],
  "affectedProducts": ["product_id_1", "product_id_2"],
  "message": "Successfully processed 5 review(s)."
}
```

---

### 2. **Advanced Filtering**

Filter reviews by multiple criteria to find exactly what you're looking for.

#### Available Filters:

**Status Filter:**
- All Statuses
- Pending (default)
- Approved
- Rejected

**Rating Filter:**
- All Ratings
- 5 Stars
- 4 Stars
- 3 Stars
- 2 Stars
- 1 Star

**Date Range Filter:**
- From Date - Filter reviews created on or after this date
- To Date - Filter reviews created on or before this date (inclusive of entire day)

#### How to Use:
1. Click "Show Filters" button to expand the filter panel
2. Select your desired filters from the dropdowns
3. Choose date ranges using the date pickers
4. Filters are applied automatically as you change them
5. Click "Clear Filters" to reset all filters to defaults

#### API Query Parameters:
```
GET /api/admin/reviews?status=pending&rating=5&dateFrom=2024-01-01&dateTo=2024-12-31
```

---

### 3. **Search Functionality**

Search across review content to find specific reviews quickly.

#### Search Scope:
- Review title
- Review text content
- Customer name

#### How to Use:
1. Open the filter panel
2. Type your search query in the search bar
3. Search is case-insensitive and uses partial matching
4. Results update automatically as you type

#### API Query Parameter:
```
GET /api/admin/reviews?search=great+product
```

---

### 4. **Sorting Options**

Sort reviews by different criteria to organize your workflow.

#### Available Sort Options:

**Sort By:**
- Date Created (default)
- Rating
- Product Name

**Sort Order:**
- Newest First (default for date)
- Oldest First

#### How to Use:
1. Open the filter panel
2. Select "Sort By" option from the dropdown
3. Choose "Sort Order" (ascending or descending)
4. Results update automatically

#### API Query Parameters:
```
GET /api/admin/reviews?sortBy=rating&sortOrder=desc
```

---

### 5. **Pagination**

Navigate through large sets of reviews efficiently.

#### Features:
- Shows current page and total pages
- Displays range of reviews being shown (e.g., "Showing 1-20 of 150 reviews")
- Previous/Next navigation buttons
- Automatically disabled when on first/last page

#### Default Settings:
- 20 reviews per page
- Can be adjusted via API (max 50 per page)

#### API Query Parameters:
```
GET /api/admin/reviews?page=2&limit=20
```

---

## Workflow Examples

### Example 1: Approve All 5-Star Reviews from Last Week

1. Click "Show Filters"
2. Set Status to "Pending"
3. Set Rating to "5 Stars"
4. Set From Date to one week ago
5. Click "Select All" checkbox
6. Click "Approve Selected"

### Example 2: Find and Reject Inappropriate Reviews

1. Click "Show Filters"
2. Enter keywords in the search bar (e.g., "spam", "inappropriate")
3. Review the results
4. Select the reviews to reject
5. Click "Reject Selected"
6. Add an admin note explaining the rejection
7. Confirm the action

### Example 3: Review Low-Rated Products

1. Click "Show Filters"
2. Set Rating to "1 Star" or "2 Stars"
3. Set Sort By to "Product Name"
4. Review products with low ratings
5. Approve legitimate reviews
6. Reject spam or inappropriate reviews

---

## API Reference

### GET /api/admin/reviews

Fetch reviews with advanced filtering, search, and sorting.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by status | `pending`, `approved`, `rejected` |
| `rating` | number | Filter by exact rating | `1`, `2`, `3`, `4`, `5` |
| `minRating` | number | Filter by minimum rating | `3` |
| `maxRating` | number | Filter by maximum rating | `5` |
| `productId` | string | Filter by product ID | `507f1f77bcf86cd799439011` |
| `customerEmail` | string | Filter by customer email (partial match) | `john@example.com` |
| `dateFrom` | string | Filter from date (ISO 8601) | `2024-01-01` |
| `dateTo` | string | Filter to date (ISO 8601) | `2024-12-31` |
| `search` | string | Search in title, text, customer name | `great product` |
| `sortBy` | string | Sort field | `createdAt`, `rating`, `productName` |
| `sortOrder` | string | Sort direction | `asc`, `desc` |
| `page` | number | Page number (1-based) | `1`, `2`, `3` |
| `limit` | number | Results per page (max 50) | `20` |

**Response:**
```json
{
  "reviews": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "filters": {
    "status": "pending",
    "rating": null,
    "search": "",
    ...
  }
}
```

### POST /api/admin/reviews/bulk

Process multiple reviews with a single action.

**Request Body:**
```json
{
  "reviewIds": ["id1", "id2", "id3"],
  "action": "approve" | "reject" | "delete",
  "adminNote": "Optional note (for reject action)"
}
```

**Validation:**
- `reviewIds`: Array of 1-100 valid MongoDB ObjectIds
- `action`: Must be one of: `approve`, `reject`, `delete`
- `adminNote`: Optional string, max 500 characters

**Response:**
```json
{
  "success": 3,
  "failed": 0,
  "errors": [],
  "affectedProducts": ["product_id_1"],
  "message": "Successfully processed 3 review(s)."
}
```

**Error Response:**
```json
{
  "success": 2,
  "failed": 1,
  "errors": [
    {
      "reviewId": "id3",
      "error": "Review not found"
    }
  ],
  "affectedProducts": ["product_id_1"],
  "message": "Successfully processed 2 review(s). 1 failed."
}
```

---

## Best Practices

### 1. **Regular Moderation**
- Check pending reviews daily
- Respond to reviews within 24-48 hours
- Use bulk actions for efficiency

### 2. **Consistent Standards**
- Approve honest, constructive reviews (positive or negative)
- Reject spam, profanity, or off-topic content
- Add admin notes when rejecting to maintain records

### 3. **Use Filters Effectively**
- Start with pending reviews
- Filter by rating to prioritize low-rated reviews
- Use date filters to catch up on backlogs

### 4. **Search for Issues**
- Regularly search for common spam keywords
- Look for duplicate reviews from same customer
- Monitor for inappropriate language

### 5. **Product Quality Monitoring**
- Sort by rating to identify problematic products
- Review patterns in low-rated reviews
- Use feedback to improve product descriptions

---

## Troubleshooting

### Bulk Action Failed
- Check that all selected reviews still exist
- Verify you have admin permissions
- Review error messages in the response
- Try processing reviews in smaller batches

### Filters Not Working
- Clear browser cache
- Check date format (YYYY-MM-DD)
- Verify filter combinations are valid
- Try clearing all filters and reapplying

### Search Returns No Results
- Check spelling
- Try broader search terms
- Verify reviews exist matching your criteria
- Clear other filters that might be too restrictive

### Pagination Issues
- Refresh the page
- Check total count vs. current page
- Verify limit parameter is valid (1-50)

---

## Technical Notes

### Performance Considerations
- Bulk actions process reviews sequentially
- Large bulk operations (50+) may take several seconds
- Product rating recalculation happens after all reviews are processed
- Pagination is recommended for large datasets

### Data Integrity
- All bulk actions are atomic per review
- Failed reviews don't affect successful ones
- Product ratings are automatically recalculated
- Deleted reviews cannot be recovered

### Security
- All endpoints require admin authentication
- Review IDs are validated before processing
- Rate limiting applies to prevent abuse
- Admin actions are logged with user ID

---

## Support

For technical issues or feature requests, please contact the development team or create an issue in the project repository.

**Version:** 1.0.0  
**Last Updated:** 2026-06-23