# Bulk Pricing & Product Reviews - Implementation Documentation

## Overview

This document provides technical details about the implementation of two key e-commerce features:
1. **Bulk Pricing** - Automatic discounts based on quantity purchased
2. **Product Reviews** - Customer reviews with admin moderation workflow

---

## 1. Bulk Pricing System

### Architecture

The bulk pricing system automatically applies tiered discounts based on purchase quantity. Discounts are calculated server-side during checkout to prevent price manipulation.

### Database Schema

**Product Model** (`lib/models/Product.js`):
```javascript
bulkPricingTiers: {
  type: [BulkPricingTierSchema],
  default: [],
  validate: (v) => {
    // Ensures tiers are sorted by minQuantity
    if (v.length === 0) return true;
    for (let i = 1; i < v.length; i++) {
      if (v[i].minQuantity <= v[i - 1].minQuantity) return false;
    }
    return true;
  },
}

// BulkPricingTierSchema
{
  minQuantity: { type: Number, required: true, min: 2 },
  discountPercent: { type: Number, required: true, min: 0, max: 100 }
}
```

**Example:**
```javascript
bulkPricingTiers: [
  { minQuantity: 3, discountPercent: 10 },  // 10% off for 3+
  { minQuantity: 10, discountPercent: 20 }, // 20% off for 10+
  { minQuantity: 50, discountPercent: 30 }  // 30% off for 50+
]
```

### Pricing Logic

**File:** `lib/utils-pricing.js`

#### Key Functions:

**1. findApplicableBulkTier(quantity, bulkPricingTiers)**
```javascript
// Finds the highest tier that applies to the given quantity
// Returns null if no tier applies
// Tiers must be sorted by minQuantity (ascending)
```

**2. calculateBulkPrice(priceCents, quantity, bulkPricingTiers)**
```javascript
// Calculates the discounted price for a given quantity
// Returns:
{
  unitPriceCents: number,      // Price per unit after discount
  totalPriceCents: number,     // Total price (unit * quantity)
  discountPercent: number,     // Discount percentage applied
  bulkApplied: boolean         // Whether bulk discount was applied
}
```

**3. calculateMaxSavings(priceCents, bulkPricingTiers)**
```javascript
// Calculates maximum possible savings
// Useful for displaying "Save up to X%" badges
```

### Checkout Integration

**File:** `app/api/checkout/route.js`

```javascript
// Server-side price calculation (lines 80-92)
for (const item of body.items) {
  const product = productMap.get(item.productId);
  
  // Calculate price with bulk pricing tier
  const bulkPrice = calculateBulkPrice(
    product.priceCents,
    item.quantity,
    product.bulkPricingTiers || []
  );

  orderItems.push({
    product: product._id,
    name: product.name,
    priceCents: bulkPrice.unitPriceCents, // Discounted price
    quantity: item.quantity,
  });
}
```

### Security Considerations

1. **Server-Side Calculation**: All prices are calculated on the server during checkout
2. **Never Trust Client**: Client-submitted prices are ignored
3. **Validation**: Bulk pricing tiers are validated at the database level
4. **Immutable Snapshots**: Order items store the price at time of purchase

### Usage Example

**Admin: Setting up bulk pricing for a product**
```javascript
// In admin product form
{
  name: "Premium Lighter",
  priceCents: 2999, // $29.99
  bulkPricingTiers: [
    { minQuantity: 3, discountPercent: 10 },  // $26.99 each for 3+
    { minQuantity: 10, discountPercent: 20 }, // $23.99 each for 10+
  ]
}
```

**Customer: Purchasing 5 units**
```javascript
// Checkout calculation
const bulkPrice = calculateBulkPrice(2999, 5, bulkPricingTiers);
// Result:
{
  unitPriceCents: 2699,      // $26.99 (10% off)
  totalPriceCents: 13495,    // $134.95 total
  discountPercent: 10,
  bulkApplied: true
}
```

---

## 2. Product Reviews System

### Architecture

The review system implements a complete moderation workflow where customers can submit reviews after purchase, and admins must approve them before they appear publicly.

### Database Schema

**ProductReview Model** (`lib/models/ProductReview.js`):
```javascript
{
  product: ObjectId,           // Reference to Product
  rating: Number (1-5),        // Star rating
  title: String (optional),    // Review title
  text: String,                // Review content
  customerEmail: String,       // Customer identifier
  customerName: String,        // Display name
  orderNumber: String,         // Verified purchase
  status: String,              // "pending" | "approved" | "rejected"
  adminNote: String,           // Admin's rejection reason
  approvedBy: ObjectId,        // Admin who approved
  approvedAt: Date,
  rejectedAt: Date,
  flaggedAsInappropriate: Boolean,
  flagCount: Number
}
```

**Product Model Updates**:
```javascript
{
  averageRating: Number (1-5), // Calculated from approved reviews
  reviewCount: Number          // Count of approved reviews
}
```

### Review Submission Flow

**1. Customer Places Order**
- Order is created with `orderNumber` and `customerEmail`
- Payment is completed successfully

**2. Review Link Generation**
```javascript
// lib/reviews/generateReviewLink.js
const token = jwt.sign(
  {
    orderNumber,
    email: customerEmail,
    productId: product._id.toString(),
  },
  process.env.JWT_SECRET,
  { expiresIn: "90d" } // 90-day window to review
);

const reviewUrl = `${baseUrl}/products/${product.slug}?reviewToken=${token}`;
```

**3. Customer Submits Review**
- Customer clicks review link (sent via email)
- Token is verified to ensure legitimate purchase
- Review is created with `status: "pending"`

**4. Admin Moderation**
- Admin reviews pending submissions
- Can approve, reject (with note), or delete
- Bulk actions available for efficiency

**5. Public Display**
- Only `approved` reviews appear on product pages
- Product ratings are recalculated automatically

### Review Token Verification

**File:** `lib/reviews/verifyReviewToken.js`

```javascript
export async function verifyReviewToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify order exists and is paid
    const order = await Order.findOne({
      orderNumber: decoded.orderNumber,
      customerEmail: decoded.email,
      paymentStatus: "paid",
    });
    
    if (!order) {
      return { valid: false, error: "Order not found or not paid" };
    }
    
    // Verify product was in the order
    const productInOrder = order.items.some(
      (item) => item.product.toString() === decoded.productId
    );
    
    if (!productInOrder) {
      return { valid: false, error: "Product not in order" };
    }
    
    return {
      valid: true,
      orderNumber: decoded.orderNumber,
      email: decoded.email,
      productId: decoded.productId,
    };
  } catch (error) {
    return { valid: false, error: "Invalid or expired token" };
  }
}
```

### Rating Calculation

**File:** `lib/reviews/updateProductRatings.js`

```javascript
export async function updateProductRatings(productId) {
  // Get all approved reviews for the product
  const reviews = await ProductReview.find({
    product: productId,
    status: "approved",
  });

  if (reviews.length === 0) {
    // No approved reviews - clear ratings
    await Product.updateOne(
      { _id: productId },
      { $unset: { averageRating: "" }, reviewCount: 0 }
    );
    return;
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Update product
  await Product.updateOne(
    { _id: productId },
    {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    }
  );
}
```

### Admin Review Dashboard

**Enhanced Features (v2.0):**

1. **Bulk Actions**
   - Select multiple reviews with checkboxes
   - Approve/reject/delete in bulk
   - Bulk reject with admin note
   - Confirmation dialogs for destructive actions

2. **Advanced Filtering**
   - Filter by status (pending/approved/rejected)
   - Filter by rating (1-5 stars)
   - Filter by date range
   - Filter by product or customer email

3. **Search Functionality**
   - Search across review title, text, and customer name
   - Case-insensitive partial matching
   - Real-time results

4. **Sorting Options**
   - Sort by date created
   - Sort by rating
   - Sort by product name
   - Ascending/descending order

5. **Pagination**
   - 20 reviews per page (configurable)
   - Previous/Next navigation
   - Page count display

### API Endpoints

#### GET /api/products/[slug]/reviews
**Public endpoint** - Fetch approved reviews for a product

**Response:**
```json
{
  "reviews": [...],
  "averageRating": 4.5,
  "reviewCount": 23
}
```

#### POST /api/products/[slug]/reviews
**Public endpoint** - Submit a review (requires valid token)

**Request:**
```json
{
  "token": "jwt_token",
  "rating": 5,
  "title": "Great product!",
  "text": "Really happy with this purchase...",
  "customerName": "John D."
}
```

#### GET /api/admin/reviews
**Admin endpoint** - Fetch reviews with filtering

**Query Parameters:**
- `status`, `rating`, `dateFrom`, `dateTo`, `search`
- `sortBy`, `sortOrder`, `page`, `limit`

#### POST /api/admin/reviews/bulk
**Admin endpoint** - Bulk process reviews

**Request:**
```json
{
  "reviewIds": ["id1", "id2"],
  "action": "approve" | "reject" | "delete",
  "adminNote": "Optional"
}
```

#### PATCH /api/admin/reviews/[id]
**Admin endpoint** - Update single review status

#### DELETE /api/admin/reviews/[id]
**Admin endpoint** - Delete single review

### Security Considerations

1. **Verified Purchases Only**: Reviews require valid JWT token from paid order
2. **One Review Per Purchase**: Customers can only review products they bought
3. **Token Expiration**: Review tokens expire after 90 days
4. **Admin Moderation**: All reviews require approval before public display
5. **Rate Limiting**: Review submission is rate-limited per IP
6. **XSS Prevention**: Review text is sanitized before display
7. **Admin Authentication**: All moderation endpoints require admin session

### Email Integration (Recommended)

After order completion, send review request emails:

```javascript
// Pseudo-code for email service
async function sendReviewRequestEmail(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    const reviewToken = generateReviewToken(
      order.orderNumber,
      order.customerEmail,
      product._id
    );
    
    const reviewUrl = `${baseUrl}/products/${product.slug}?reviewToken=${reviewToken}`;
    
    await sendEmail({
      to: order.customerEmail,
      subject: `Review your purchase: ${product.name}`,
      template: "review-request",
      data: { product, reviewUrl, orderNumber: order.orderNumber }
    });
  }
}
```

### Performance Optimization

1. **Indexes**: Reviews are indexed by `product`, `status`, and `customerEmail`
2. **Pagination**: Large review lists are paginated
3. **Caching**: Product ratings can be cached (currently calculated on-demand)
4. **Bulk Operations**: Process multiple reviews in single database transaction
5. **Lazy Loading**: Reviews load separately from product details

---

## Testing Checklist

### Bulk Pricing
- [ ] Verify discount applies at correct quantity thresholds
- [ ] Test with multiple products in cart
- [ ] Ensure server-side calculation cannot be bypassed
- [ ] Verify order snapshot stores discounted price
- [ ] Test edge cases (quantity = minQuantity, quantity = minQuantity - 1)

### Product Reviews
- [ ] Verify only paid orders can submit reviews
- [ ] Test token expiration (90 days)
- [ ] Ensure duplicate reviews are prevented
- [ ] Verify admin approval workflow
- [ ] Test bulk actions with various selections
- [ ] Verify rating recalculation after approval/rejection
- [ ] Test filtering and search functionality
- [ ] Verify pagination works correctly
- [ ] Test XSS prevention in review text

---

## Future Enhancements

### Bulk Pricing
- [ ] Volume discount badges on product cards
- [ ] Cart savings breakdown display
- [ ] Tiered pricing table on product pages
- [ ] Analytics for bulk purchase patterns

### Product Reviews
- [ ] Customer review photos/videos
- [ ] Helpful/not helpful voting
- [ ] Review response from admin/seller
- [ ] Verified purchase badge
- [ ] Review reminders (automated emails)
- [ ] Review analytics dashboard
- [ ] Export reviews to CSV
- [ ] Review moderation AI assistance

---

## Maintenance

### Regular Tasks
1. Monitor review submission rate
2. Check for spam patterns
3. Review rejection reasons
4. Analyze low-rated products
5. Update bulk pricing tiers based on sales data

### Database Maintenance
1. Archive old rejected reviews (optional)
2. Reindex review collections periodically
3. Backup review data regularly
4. Monitor database size growth

---

## Support & Documentation

- **User Guide**: See `docs/ADMIN_REVIEWS_GUIDE.md`
- **API Reference**: See API endpoints section above
- **Code Examples**: See implementation files in `lib/` directory

**Version:** 2.0.0  
**Last Updated:** 2026-06-23  
**Authors:** Development Team