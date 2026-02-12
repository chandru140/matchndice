# Match n Dice 🎲

A full-stack MERN e-commerce platform with comprehensive product management, multiple payment gateways, and an admin dashboard.

## 🌟 Features

### Customer Features
- 🛍️ Browse products with search and filtering
- 🛒 Shopping cart with persistent state
- 👤 User authentication (JWT-based)
- 📦 Order placement with multiple payment options
- 💳 Payment integration (COD, Stripe, Razorpay)
- 📱 User profile management
- 📋 Order history and tracking
- ⭐ Responsive design

### Admin Features
- 📊 Product management (Add, Edit, Delete)
- 📷 Multi-image upload via Cloudinary
- 📦 Order management with status updates
- 🔐 Secure admin authentication
- 📈 Product inventory tracking

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 4.1.18
- **Routing**: React Router DOM 7.10.1
- **State**: Context API
- **HTTP Client**: Axios

### Admin Panel
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 4.1.18
- **Routing**: React Router DOM 7.11.0

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.2.1
- **Database**: MongoDB (Mongoose 9.0.2)
- **Authentication**: JWT + BCrypt
- **File Upload**: Multer + Cloudinary
- **Payments**: Stripe 20.1.0, Razorpay 2.9.6

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Stripe account (for card payments)
- Razorpay account (for Indian payments)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MatchnDice
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Cloudinary
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# JWT
JWT_SECRET=your_jwt_secret_key

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_admin_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Server
PORT=4000
```

Start the backend server:

```bash
npm run server    # Development with nodemon
# or
npm start        # Production
```

The API will run on `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Admin Panel Setup

```bash
cd admin
npm install
```

Create a `.env` file in the admin directory:

```env
VITE_BACKEND_URL=http://localhost:4000
```

Start the admin panel:

```bash
npm run dev
```

The admin panel will run on `http://localhost:5174`

## 📁 Project Structure

```
MatchnDice/
├── frontend/              # Customer-facing React app
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Reusable React components
│   │   ├── context/      # React Context (state management)
│   │   ├── pages/        # Route pages
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   └── package.json
│
├── admin/                 # Admin dashboard React app
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Admin components
│   │   ├── pages/        # Admin pages
│   │   ├── App.jsx       # Admin app component
│   │   └── main.jsx      # Entry point
│   └── package.json
│
└── backend/              # Express API server
    ├── config/           # Database & Cloudinary config
    ├── controllers/      # Route controllers
    ├── middleware/       # Auth & upload middleware
    ├── models/           # MongoDB schemas
    ├── routes/           # API routes
    ├── server.js         # Entry point
    └── package.json
```

## 🔗 API Endpoints

### User Routes (`/api/user`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /admin` - Admin login

### Product Routes (`/api/product`)
- `GET /list` - Get all products
- `POST /add` - Add new product (Admin only)
- `POST /remove` - Remove product (Admin only)
- `POST /single` - Get single product

### Cart Routes (`/api/cart`)
- `POST /add` - Add item to cart
- `POST /update` - Update cart quantity
- `POST /get` - Get user cart

### Order Routes (`/api/order`)
- `POST /place` - Place order (COD)
- `POST /stripe` - Place order via Stripe
- `POST /razorpay` - Place order via Razorpay
- `POST /verify-stripe` - Verify Stripe payment
- `POST /verify-razorpay` - Verify Razorpay payment
- `POST /userorders` - Get user orders
- `POST /list` - Get all orders (Admin)
- `POST /status` - Update order status (Admin)

### Profile Routes (`/api/profile`)
- `GET /get` - Get user profile
- `POST /update` - Update user profile

## 💳 Payment Integration

### Cash on Delivery (COD)
Payment is collected upon delivery. No additional setup required.

### Stripe
1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Add the secret key to backend `.env`
4. Test with card: `4242 4242 4242 4242`

### Razorpay
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get your API keys from the dashboard
3. Add keys to backend `.env` and frontend `.env`
4. Enable test mode for development

## 🖼️ Image Upload

Images are uploaded to Cloudinary:

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from dashboard
3. Add to backend `.env`
4. Products support multiple images

## 🔒 Authentication

- **Users**: JWT-based authentication with BCrypt password hashing
- **Admin**: Separate credentials stored in environment variables
- **Token Storage**: LocalStorage (frontend) with automatic sync

## 🚢 Deployment

### Backend (Vercel/Render)
1. Push code to GitHub
2. Connect repository to Vercel/Render
3. Add environment variables
4. Deploy

### Frontend & Admin (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

Note: `vercel.json` configuration files are already included.

## 📝 Environment Variables Reference

See `.env.example` files in each directory for complete configuration templates.

## 🧪 Testing

Testing infrastructure is currently being set up. Coming soon:
- Unit tests with Jest
- Integration tests
- E2E tests with Cypress/Playwright

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

See the [project analysis document](./docs/project_analysis.md) for known issues and upcoming improvements.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core e-commerce functionality
- ✅ Payment gateway integration
- ✅ Admin dashboard
- 🔄 Testing infrastructure
- 🔄 Enhanced security

### Phase 2 (Upcoming)
- 📧 Email notifications
- ⭐ Product reviews
- ❤️ Wishlist functionality
- 🔍 Advanced search
- 📊 Analytics dashboard

### Phase 3 (Future)
- 🌐 Multi-language support
- 💱 Multi-currency support
- 📱 Mobile app
- 🤖 AI recommendations

## 👨‍💻 Developer Notes

### Running All Services

You can run all three applications simultaneously:

**Terminal 1 - Backend:**
```bash
cd backend && npm run server
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 3 - Admin:**
```bash
cd admin && npm run dev
```

### Default Ports
- Backend API: `http://localhost:4000`
- Frontend: `http://localhost:5173`
- Admin Panel: `http://localhost:5174`

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: [your-email@example.com]

## 🙏 Acknowledgments

- React Team for React 19
- Vite Team for the blazing-fast build tool
- Tailwind CSS for the utility-first CSS framework
- MongoDB for the database
- Stripe and Razorpay for payment processing
- Cloudinary for image management

---

**Built with ❤️ using the MERN Stack**
# matchndice
