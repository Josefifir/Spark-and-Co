# Customer Account System Documentation

## Overview

This document describes the complete customer account system implementation, including registration, login, profile management, order history, saved addresses, and guest order lookup functionality.

## Features Implemented

### 1. Customer Registration & Authentication
- **Registration**: New customers can create accounts with email, password, name, and optional phone
- **Login**: Secure authentication with JWT-based sessions
- **Session Management**: 30-day session duration with HTTP-only cookies
- **Rate Limiting**: Protection against brute force attacks

### 2. Customer Profile Management
- View and edit profile information
- Update preferences (currency, language, marketing opt-in)
- Track account metadata (member since, last login)

### 3. Saved Addresses
- Add multiple shipping addresses
- Set default address for faster checkout
- Edit and delete saved addresses
- Addresses include: name, address lines, city, state, postal code, country

### 4. Order History
- View all orders linked to customer account
- Paginated order list (10 orders per page)
- Detailed order view with items, pricing, and status
- Order tracking information
- Orders are automatically linked when customer is logged in during checkout

### 5. Guest Order Lookup
- Non-registered users can track orders using email + order number
- Rate-limited to prevent abuse
- Full order details including items, shipping, and payment status

## API Endpoints

### Authentication
- `POST /api/customer/register` - Create new customer account
- `POST /api/customer/login` - Authenticate customer
- `POST /api/customer/logout` - End customer session
- `GET /api/customer/me` - Get current customer profile
- `PATCH /api/customer/me` - Update customer profile

### Addresses
- `GET /api/customer/addresses` - List all saved addresses
- `POST /api/customer/addresses` - Add new address
- `PATCH /api/customer/addresses/[id]` - Update address
- `DELETE /api/customer/addresses/[id]` - Delete address

### Orders
- `GET /api/customer/orders` - Get customer order history (paginated)
- `GET /api/customer/orders/[orderNumber]` - Get specific order details
- `POST /api/orders/lookup` - Guest order lookup (email + order number)

## Frontend Pages

### Account Pages (Protected)
- `/account/login` - Login/Registration page
- `/account` - Customer profile page
- `/account/orders` - Order history list
- `/account/orders/[orderNumber]` - Order detail page
- `/account/addresses` - Saved addresses management

### Public Pages
- `/order-lookup` - Guest order tracking page

## Database Schema

### Customer Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  phone: String (optional),
  savedAddresses: [SavedAddressSchema],
  isActive: Boolean,
  emailVerified: Boolean,
  preferredCurrency: String (usd/eur),
  preferredLocale: String (en/de),
  marketingOptIn: Boolean,
  lastLoginAt: Date,
  loginCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### SavedAddress Schema
```javascript
{
  name: String (required),
  line1: String (required),
  line2: String (optional),
  city: String (required),
  state: String (optional),
  postalCode: String (required),
  country: String (required, ISO 2-letter code),
  isDefault: Boolean
}
```

### Order Model (Updated)
```javascript
{
  // ... existing fields ...
  customer: ObjectId (ref: Customer, optional),
  customerEmail: String (required, indexed),
  // ... rest of fields ...
}
```

## Security Features

### Password Security
- Minimum 8 characters required
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored or transmitted in plain text

### Session Security
- JWT tokens with 30-day expiration
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag in production
- SameSite: lax for CSRF protection

### Rate Limiting
- Registration: 5 attempts per minute per IP
- Login: 10 attempts per minute per IP
- Order Lookup: 10 attempts per minute per IP

### Data Protection
- Passwords excluded from query results by default
- Sensitive fields (tokens, reset codes) excluded from JSON responses
- Customer data only accessible to authenticated owner

## Integration Points

### Checkout Integration
The checkout process automatically links orders to customer accounts:
- If customer is logged in during checkout, order is linked to their account
- Guest checkouts create orders without customer reference
- Both registered and guest orders can be tracked

### Header Navigation
- User icon in header shows login status
- Links to `/account` when logged in
- Links to `/account/login` when logged out
- Dynamic authentication check on component mount

## User Flows

### Registration Flow
1. User clicks "Sign In" in header
2. Switches to registration tab
3. Fills in required information
4. Submits form
5. Account created and automatically logged in
6. Redirected to account dashboard

### Login Flow
1. User clicks "Sign In" in header
2. Enters email and password
3. Submits form
4. Session created
5. Redirected to account dashboard

### Order History Flow
1. Logged-in user navigates to "Orders" tab
2. Views paginated list of all orders
3. Clicks order to view details
4. Sees complete order information including tracking

### Guest Order Lookup Flow
1. User visits `/order-lookup`
2. Enters email and order number
3. Submits form
4. Views complete order details
5. Can look up another order

### Saved Addresses Flow
1. User navigates to "Addresses" tab
2. Clicks "Add New Address"
3. Fills in address form
4. Optionally sets as default
5. Address saved for future checkouts
6. Can edit or delete addresses

## Future Enhancements

### Potential Features
- Email verification for new accounts
- Password reset functionality
- Order cancellation for pending orders
- Wishlist/favorites
- Product reviews linked to customer accounts
- Loyalty points/rewards program
- Address validation API integration
- Two-factor authentication
- Social login (Google, Facebook)

### Performance Optimizations
- Implement Redis for session storage
- Add caching for frequently accessed customer data
- Optimize order queries with proper indexing
- Implement infinite scroll for order history

## Testing Recommendations

### Manual Testing Checklist
- [ ] Register new account
- [ ] Login with existing account
- [ ] Update profile information
- [ ] Add/edit/delete saved addresses
- [ ] Set default address
- [ ] View order history
- [ ] View order details
- [ ] Guest order lookup
- [ ] Logout functionality
- [ ] Protected route access (redirect to login)
- [ ] Rate limiting triggers correctly

### Security Testing
- [ ] Password requirements enforced
- [ ] Session cookies are HTTP-only
- [ ] Protected routes require authentication
- [ ] Users can only access their own data
- [ ] Rate limiting prevents abuse
- [ ] SQL injection prevention
- [ ] XSS prevention

## Troubleshooting

### Common Issues

**Issue**: Customer can't log in
- Check if account exists in database
- Verify password is correct
- Check if account is active (`isActive: true`)
- Verify JWT_SECRET is set in environment variables

**Issue**: Orders not showing in history
- Verify order has `customer` field populated
- Check if `customerEmail` matches logged-in user
- Ensure order was created after customer logged in

**Issue**: Session expires immediately
- Check JWT_SECRET is consistent across restarts
- Verify cookie settings (httpOnly, secure, sameSite)
- Check browser cookie settings

**Issue**: Rate limiting too aggressive
- Adjust limits in `/lib/rateLimit.js`
- Consider implementing Redis for distributed rate limiting

## Environment Variables

Required environment variables:
```
JWT_SECRET=your-secret-key-here
CUSTOMER_SESSION_COOKIE_NAME=customer_session (optional, defaults to this)
```

## Made with Bob