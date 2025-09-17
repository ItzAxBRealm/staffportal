# StaffPortal

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Vite](https://img.shields.io/badge/Bundler-Vite-yellow?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?logo=tailwindcss)
![Motion](https://img.shields.io/badge/Animations-Framer%20Motion-ff69b4?logo=framer)
![FullCalendar](https://img.shields.io/badge/Calendar-FullCalendar-2E8B57)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Express.js](https://img.shields.io/badge/API-Express-black?logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socketdotio)

---

A **full-stack MERN project** (MongoDB, Express.js, React, Node.js) built entirely by me using **Vite + React** for the frontend.  
This Staff Portal provides a **secure role-based platform** for managing tickets, announcements, and meeting room bookings with a clean and responsive UI.

---

## 🚀 Tech Stack

**Frontend**

- [React](https://react.dev/) (with Vite)
- [TailwindCSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Motion](https://motion.dev/)
- [FullCalendar](https://fullcalendar.io/)
- Vanilla CSS

**Backend**

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

**Other Tools**

- [JWT](https://jwt.io/) for authentication
- [bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing
- [Multer](https://www.npmjs.com/package/multer) for image uploads
- [Socket.io](https://socket.io/) for real-time features
- [Zod](https://zod.dev/) for validation

---

## 🔐 Features

### Authentication & User Management

- Role-Based Access Control
  - **Staff**: Submit, view, edit, delete their own tickets & view announcements.
  - **Admin**: Full access.
- Secure JWT token-based login/logout.
- Password hashing with bcrypt.
- Manual admin seeding.

### Ticketing System

- Create tickets with **title, description, attachments (image upload)**.
- Status flow: `Open → In Progress → Resolved`.
- Privacy rules:
  - Staff only see their own tickets.
  - Staff can reply to admin responses.
  - Admins can manage all tickets (edit, delete, assign).
- Priority levels: **Standard** or **High**.
- Advanced search & filter (by status, priority, etc).
- Admins can assign tickets → **email notification sent**.
- Add more "participants" to ticket threads for group discussions.
- Chatbox-like threaded ticket replies.

### Meeting Room Booking

- FullCalendar integration with booking options:
  - Recurring meetings (weekly/fortnightly)
  - Zoom meeting toggle
  - Equipment requirement (e.g., laptop)
- Search bookings by name/email.
- Create/Delete bookings.

### Announcement System

- **Bulletin Board** for announcements.
- Admins can create announcements with **title, content, priority**.
- Visible to all staff (read-only for staff).

### File Attachments

- Image uploads via Multer.
- Files stored as URLs in the database.

### Real-Time Features

- Live updates for admins (new tickets/replies).
- User notifications when admins respond.

### Admin-Only Features

- Dashboard with ticket filtering.
- Add FAQ cards.
- Manage announcements (CRUD).
- Create/manage user accounts.

### Frontend Features

- Dark Mode toggle.
- Responsive UI.
- Dynamic protected routing with role-based views.
- Staff view: Ticket form & history.
- Admin view: Ticket dashboard, announcement panel.
- Toast alerts for replies/announcements.

### Security & Validation

- **Zod** for input validation.
- Middleware checks (e.g., `isAdmin`).

### DevOps & Misc

- Use Nginx & PM2 for hosting.
- Docker is another good option for hosting.
- Email notifications for replies/resolutions.

---

## 📡 API Endpoints (Missing some)

| Route                       | Method | Description               | Access        |
| --------------------------- | ------ | ------------------------- | ------------- |
| `/api/tickets`              | `POST` | Create Ticket             | Staff         |
| `/api/tickets/:id/reply`    | `POST` | Reply to ticket           | Admin         |
| `/api/tickets/:id/messages` | `POST` | Thread reply              | Staff + Admin |
| `/api/tickets/:id`          | `PUT`  | Edit ticket (staff-owned) | Staff         |
| `/api/faqs`                 | `GET`  | Browse FAQs               | All           |
| `/api/faqs`                 | `POST` | Add FAQ                   | Admin         |
| `/api/announcements`        | `POST` | Create announcement       | Admin         |
| `/api/admin/tickets`        | `GET`  | Get all tickets           | Admin         |

---

## 🖼️ UI Components

- **Staff View**
  - Ticket form, ticket list, admin replies.
- **Admin View**
  - Ticket dashboard, announcement editor, FAQ management, User Management.
- **Shared**
  - Announcement feed, user profile, threaded ticket replies.
- **FAQ Page**
  - Search bar + category filters.

---

## ⚙️ Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ItzAxBRealm/staffportal.git
   cd staffportal
   Install dependencies for both client & server:
   ```

2. Install the packages:

cd client && npm install
cd ../server && npm install 3. Setup MongoDB Community:

Create a new connection,copy the URI for the .env file, something like this: mongodb://localhost:27017/staffportal
Save & Connect AFTER step 5.

4. Configure environment variables:

Copy .env.example in both client/ and server/ folders.
Create a new .env file on both folders.
Paste the examples on .env
Update with your own values (MongoDB URI, JWT secret, email credentials, etc).

5. Run development servers:

# Terminal 1

cd server
npm run start

# Terminal 2

cd client
npm run dev

⚠️ Current Limitations
Some issues exist with notifications & ticket assignment to admins (work-in-progress).
Local use only – update .env files properly for a fully functional setup.

📌 Roadmap
Fix notification & ticket assignment bugs.
Enhance meeting booking with external integrations (Zoom API).
Improve UI with more animations & dashboards.

✨ Author
Developed solely by Aum Brahmbhatt as a passion project, used DeepSeek for some of the UI & for debugging in order to speed up the process.
Future improvements and upgrades are planned.
