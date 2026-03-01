# 🩸 BloodConnect - Blood Donation Community Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

BloodConnect is a comprehensive full-stack web application designed to bridge the gap between blood donors, recipients, hospitals, and blood banks. The platform facilitates efficient blood donation management, real-time inventory tracking, and streamlined communication between all stakeholders in the blood donation ecosystem.

## 📋 Table of Contents

- [Features](#-features)
- [User Roles & Permissions](#-user-roles--permissions)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### For All Users

- 🔐 Secure authentication and authorization
- 👤 Role-based access control (RBAC)
- 📱 Fully responsive design
- 🌙 Dark/Light theme support
- 📊 Real-time notifications and updates

### For Donors

- 🩸 Complete donor profile management
- 📅 Donation event registration
- 📜 Donation history tracking
- 🏥 Medical information management
- 🔍 Blood request browsing

### For Hospitals

- 🏥 Hospital profile management
- 💉 Blood bank inventory viewing
- 📝 Blood request creation and management
- 👥 Donor search functionality
- 📊 Dashboard with key metrics

### For Blood Banks

- 📦 Inventory management with real-time updates
- 🎉 Blood donation event management
- 👨‍⚕️ Staff dashboard for check-ins
- 📈 Analytics and reporting
- ✅ Donor eligibility verification

### For Requesters

- 📝 Blood request creation
- 🏪 Blood bank directory
- 📋 Request status tracking
- 📊 Request history

### For Administrators

- 👥 User management across all roles
- 🏢 Blood bank management
- 📊 System-wide statistics
- 📋 Audit logs and monitoring
- 📈 Comprehensive reporting

## 👥 User Roles & Permissions

### Role Hierarchy

```
Super Admin → Admin → Blood Bank Staff → Hospital Staff → Donor/Requester
```

### Navigation by Role

#### Donor

- Dashboard
- Donor Profile
- My Profile
- Medical Information
- Donation History
- Blood Requests
- Donation Events
- Settings

#### Hospital

- Dashboard
- Blood Banks
- Create Request
- My Requests
- Donor Search
- Events
- Settings

#### Requester

- Dashboard
- Create Request
- My Requests
- Blood Banks
- Settings

#### Blood Bank

- Bank Profile
- Inventory Management
- Events Management
- Staff Dashboard
- Settings

#### Admin & Super Admin

- Admin Dashboard
- My Profile
- Users Management
- Audit Logs
- System Statistics
- Blood Banks Management
- Settings

## 🛠 Technology Stack

### Frontend

- **React 18** - UI library
- **React Router v6** - Navigation and routing
- **Tailwind CSS** - Styling and responsive design
- **React Query** - Server state management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **React Hot Toast** - Toast notifications
- **Date-fns** - Date manipulation

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Development Tools

- **Vite** - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 📁 Project Structure

```
src/
├── 📂 assets/              # Static assets (images, icons)
├── 📂 hooks/               # Custom React hooks
│   ├── useAuth.js         # Authentication hook
│   └── useAxiosPublic.js  # Axios instance hook
├── 📂 middleware/          # Route protection middleware
│   ├── AlreadyLoggedIn.jsx
│   ├── RequireAuth.jsx
│   └── RequireRole.jsx
├── 📂 Pages/               # Main application pages
│   ├── 📂 auth/           # Authentication pages
│   ├── 📂 backend/        # Role-specific dashboards
│   │   ├── 📂 Admin/
│   │   ├── 📂 Blood_Bank/
│   │   ├── 📂 Donor/
│   │   ├── 📂 Hospital/
│   │   ├── 📂 Requester/
│   │   └── 📂 Layout/
│   └── 📂 Frontend/        # Public facing pages
├── 📂 shared/              # Shared components
├── 📂 utils/               # Utility functions
└── main.jsx               # Application entry point
```

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/bloodconnect.git
   cd bloodconnect
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=BloodConnect
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Build for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## ⚙️ Configuration

### Authentication Setup

The application uses JWT-based authentication with role-based access control. Configure your authentication settings in the backend environment variables:

```env
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=10
```

### Database Configuration

Ensure your MongoDB connection is properly configured:

```env
MONGODB_URI=mongodb://localhost:27017/bloodconnect
# or MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bloodconnect
```

## 📖 Usage

### Running the Application

1. **Development Mode**

   ```bash
   npm run dev
   ```

   Access the application at `http://localhost:5173`

2. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

### Default User Roles for Testing

```javascript
// Test credentials (development only)
{
  donor: { email: 'donor@test.com', password: 'Donor@123' },
  hospital: { email: 'hospital@test.com', password: 'Hospital@123' },
  admin: { email: 'admin@test.com', password: 'Admin@123' }
}
```

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/verify-email` - Email verification

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users` - Get all users (admin only)

### Donor Endpoints

- `GET /api/donors/:donorId/medical` - Get medical information
- `PUT /api/donors/:donorId/medical` - Update medical information
- `GET /api/donors/:donorId/history` - Get donation history
- `POST /api/donors/:donorId/check-eligibility` - Check donation eligibility

### Blood Request Endpoints

- `POST /api/blood-requests` - Create blood request
- `GET /api/blood-requests` - Get all blood requests
- `GET /api/blood-requests/:requestId` - Get request details
- `PUT /api/blood-requests/:requestId` - Update request status

### Blood Bank Endpoints

- `GET /api/blood-banks` - Get all blood banks
- `GET /api/blood-banks/:bankId/inventory` - Get inventory
- `PUT /api/blood-banks/:bankId/inventory` - Update inventory
- `POST /api/blood-banks/:bankId/events` - Create donation event

## 🤝 Contributing

We welcome contributions to BloodConnect! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed
- Add tests for new features
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons provided by [Feather Icons](https://feathericons.com/)
- UI inspiration from modern healthcare platforms
- Community contributors and testers

## 📞 Contact & Support

- **Project Lead**: [Your Name](mailto:your.email@example.com)
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/bloodconnect/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/bloodconnect/wiki)

---

<div align="center">
  Made with ❤️ for the blood donation community
</div>
```
