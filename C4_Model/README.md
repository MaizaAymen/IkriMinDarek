# C4 Model - IkriMinDarek Platform

## 📊 Architecture Diagrams - All 4 Levels

This folder contains complete C4 model diagrams for the IkriMinDarek rental platform in PlantUML format.

### 📁 Files Structure

```
C4_Model/
├── README.md (this file)
├── Level1_Context.puml
├── Level2_Container.puml
├── Level3_Component_Backend.puml
├── Level3_Component_Frontend.puml
└── Level4_Code_Sequences.puml
```

---

## 🎯 C4 Model Levels

### Level 1: System Context (Level1_Context.puml)
Shows the IkriMinDarek system at the highest level with:
- External users (Renters, Landlords, Admins)
- External systems (Google Maps API, Email Service)
- Main system boundary

**Key Relationships:**
- Users interact with the platform
- System integrates with Google Maps for location services
- System sends notifications via Email Service

---

### Level 2: Container Architecture (Level2_Container.puml)

Describes the major containers/applications and their interactions:

#### 🎯 Main Components

**Client Tier**
- **Mobile App** (iOS/Android) - React Native + Expo - Primary mobile interface
- **Web App** - React Native Web - Browser-based alternative

**External Services**
- **Google Maps API** - Location services and map functionality
- **Email Service** - Email notifications and communications

**API & Middleware**
- **Express.js API Server** (Port 4000)
  - Handles all REST API requests
  - JWT Authentication
  - CORS Configuration
  - Request routing to services

**Business Logic Layer**
- **Auth Service** - User authentication and authorization
- **Property Service** - Property listing and management
- **Booking Service** - Reservation and booking management
- **Chat Service** - Real-time messaging between users
- **Favorites Service** - User favorites and wishlist management

**Real-Time Communication**
- **Socket.IO Server** - WebSocket real-time communication for chat and notifications

**Data Persistence**
- **PostgreSQL Database** - Primary data store with Sequelize ORM
- **File Storage** - Cloud/local storage for property images and media

#### 📊 Data Flows

```
Users (Mobile/Web) 
    ↓ HTTPS
    ├─→ Mobile App
    └─→ Web App
         ↓ REST API
    Express.js API Server
         ↓ Routes
    ├─→ Auth Service
    ├─→ Property Service
    ├─→ Booking Service
    ├─→ Chat Service
    └─→ Favorites Service
         ↓ SQL
    PostgreSQL Database & File Storage
```

#### 🔗 Key Interactions

| Source | Destination | Protocol | Purpose |
|--------|-------------|----------|---------|
| Users | Mobile/Web Apps | HTTPS | Access application |
| Apps | Express.js API | REST API | Communicate with backend |
| API Server | Services | Routes | Distribute requests |
| Services | PostgreSQL | SQL | Read/write data |
| Socket.IO | Database | - | Persist messages |
| Chat Service | Socket.IO | Events | Real-time messaging |
| API Server | File Storage | - | Upload/download media |
| Property Service | File Storage | Images | Store property images |
| API Server | Google Maps | API | Location services |
| Property Service | Email Service | - | Send notifications |

**Data Flows:**
- Frontend apps communicate with API via REST + WebSocket
- API routes requests to appropriate services
- All data persisted in PostgreSQL
- Images/files stored in file system
- Real-time updates via Socket.IO

---

### Level 3: Component Architecture (2 files)

#### Level3_Component_Backend.puml
Backend components breakdown:
- **Middleware Layer**: CORS, JWT Auth, Error Handler, Body Parser
- **Routing Layer**: Auth, Property, Booking, Message, Favorites routes
- **Business Logic Layer**: Services for each domain
- **Data Access Layer**: Models (Sequelize ORM)
- **Socket.IO Server**: Connection, Chat, Typing, Online Status handlers

#### Level3_Component_Frontend.puml
Frontend components breakdown:
- **Context & State Management**: Auth, Property, Booking, Chat contexts
- **Screen Components**: Auth, Property, Booking, Chat, Profile screens
- **Utility Components**: Buttons, Cards, Modals, Loading states
- **Service Layer**: API clients (Axios, Socket.IO)
- **Storage & Navigation**: SecureStore, Expo Router

---

### Level 4: Code Level (Level4_Code_Sequences.puml)
Contains 4 sequence diagrams showing detailed code flows:

#### 1. Authentication Flow
```
User Login → authAPI → POST /auth/login → Auth Service → 
User Model → Database → Bcrypt validation → JWT generation → 
Context update → SecureStore → Navigation
```

#### 2. Booking Creation Flow
```
BookingForm → bookingsAPI → POST /bookings → Booking Service → 
Validate dates → Check availability → Create record → 
Socket.IO emit → Context update → UI re-render
```

#### 3. Property Search Flow
```
SearchFilter → propertiesAPI → GET /properties/search → 
Property Service → Advanced filter → Property Model → 
Database query → Context update → Display results
```

#### 4. Real-Time Chat Flow
```
ChatScreen → Socket.IO emit → Server receives → Message Service → 
Database save → Socket.IO broadcast → Receiver app update → 
Auto-read status → Read receipt
```

---

## 🛠️ How to View

### Option 1: PlantUML Online Editor
1. Visit [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/)
2. Copy content of any .puml file
3. Paste into the editor
4. View the diagram

### Option 2: VS Code Extension
1. Install "PlantUML" extension
2. Open any .puml file
3. Press `Alt+D` to preview

### Option 3: Local PlantUML
```bash
# Install PlantUML
npm install -g plantuml

# Generate PNG
plantuml Level1_Context.puml -o ./output
```

---

## 📚 Technology Stack by Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React Native + Expo | Cross-platform UI |
| Web | React Native Web | Browser support |
| API | Express.js | REST API endpoints |
| Real-Time | Socket.IO | WebSocket communication |
| Database | PostgreSQL | Data persistence |
| ORM | Sequelize | Database abstraction |
| Auth | JWT + Bcrypt | Security |
| File Upload | Multer | Image handling |
| HTTP Client | Axios | API requests |
| Secure Store | Expo | Token storage |
| Navigation | Expo Router | Screen routing |
| Maps | Google Maps API | Location services |

---

## 🔄 Data Models

### Core Entities
- **Users**: Authentication, profiles, roles (renter/landlord/admin)
- **Properties**: Listings with details, images, location, owner
- **Bookings**: Rental bookings with dates, status, pricing
- **Messages**: Real-time chat between users
- **Favorites**: Saved properties by users
- **PropertyImages**: Multiple images per property

### Entity Relationships
```
Users (1) ← → (Many) Properties (as owner)
Users (1) ← → (Many) Bookings (as renter)
Properties (1) ← → (Many) Bookings
Users (1) ← → (Many) Messages (bidirectional)
Users (1) ← → (Many) Favorites
Properties (1) ← → (Many) Images
```

---

## 🔐 Security Architecture

- **Transport**: HTTPS/TLS encryption
- **Authentication**: JWT tokens + Secure storage
- **Password**: Bcrypt hashing (10 rounds)
- **Authorization**: Role-based access control
- **Validation**: Server-side input validation
- **CORS**: Configured API access
- **Rate Limiting**: Optional (not implemented)

---

## 📊 API Endpoints Summary

| Domain | Endpoints | Count |
|--------|-----------|-------|
| Auth | register, login, profile, update, logout | 5 |
| Properties | GET all, GET by ID, search, create, update, delete | 6 |
| Bookings | GET user, create, accept, reject, cancel | 5 |
| Messages | GET, send, mark as read | 3 |
| Favorites | add, remove, GET list | 3 |
| **Total** | | **22+** |

---

## 🚀 Deployment Architecture

```
Frontend (Vercel/Netlify)
    ↓ HTTPS
API Server (Heroku/Railway)
    ↓ SQL
PostgreSQL (AWS RDS/Heroku)

Mobile Apps (EAS Build)
    ↓ HTTPS
Same API Server
```

---

## 📝 Notes

- All diagrams are in PlantUML format (.puml)
- Diagrams follow C4 model standards
- Can be exported to PNG, SVG, PDF
- Easy to maintain and version control
- Self-documenting architecture

---

**Last Updated**: December 4, 2025  
**Project**: IkriMinDarek Rental Platform  
**Version**: 1.0
