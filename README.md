# Gym Management App

A simple, mobile-friendly gym management web application that helps gym owners manage members, track membership validity, and share digital membership cards with QR codes.

## Features

- **Owner Login:** Secure owner authentication using Firebase Authentication.
- **Member Management:** Register and manage gym members.
- **Membership Details:** Store member information, payment dates, and membership expiry dates.
- **Digital Membership Cards:** Generate a unique digital membership card for each member.
- **QR Code Generation:** Each digital card contains a unique QR code.
- **QR Code Scanner:** Scan a member's QR code to check membership validity.
- **Membership Status:** Displays one of the following results:
  - `VALID MEMBERSHIP`
  - `EXPIRED MEMBERSHIP`
  - `QR NOT RECOGNIZED`
- **WhatsApp Sharing:** Share digital membership card links with members through WhatsApp.
- **Mobile-Friendly Design:** Responsive interface designed to work on desktop and mobile devices.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Development server and build tool |
| Firebase Authentication | Owner login |
| Cloud Firestore | Database |
| Firebase Hosting | Application hosting |
| html5-qrcode | QR code scanning |
| qrcode.react | QR code generation |
| React Router | Page navigation |

## Live Application

[Open Gym Management App](https://gym-management-app-e6de0.web.app)

## How It Works

### 1. Owner Login
The gym owner logs in using their registered email address and password.

### 2. Register Members
The owner can add members and enter their membership and payment information.

### 3. Generate Digital Membership Cards
The application generates a unique digital card link and QR code for each member.

### 4. Share Membership Cards
The owner can share the digital membership card with members through WhatsApp.

### 5. Scan QR Codes
When a member presents their QR code, the gym owner scans it using the application.

The scanner checks the membership expiry date and displays the membership status.

**Important:** The QR scanner is only used to verify membership validity. The application does not record attendance, count visits, or maintain check-in history.

## Project Structure

```text
gym-manager/
├── public/
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── CardPage.jsx
│   ├── CardPage.css
│   └── firebase.js
├── .gitignore
├── firebase.json
├── .firebaserc
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

*The structure above describes the main project files; individual files may vary as the project develops.*

## Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- A Firebase account

### 1. Clone the Repository

```bash
git clone https://github.com/Samarth-Singh-Rajput/gym-manager.git
```

### 2. Open the Project

```bash
cd gym-manager
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Firebase

Create or use a Firebase project and configure:

- Firebase Authentication with Email/Password enabled.
- Cloud Firestore.
- Firebase Hosting.

Make sure the Firebase configuration in `src/firebase.js` points to your Firebase project.

Do not commit private service-account credentials or other sensitive secrets to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## Build for Production

To create a production build:

```bash
npm run build
```

The generated production files are placed in the `dist/` directory.

## Deploy to Firebase Hosting

To deploy the application:

```bash
npx firebase deploy --only hosting
```

The deployed application will be available at your Firebase Hosting URL.

## Database Overview

The application uses two main Firestore collections:

### `members`

Stores private member information and membership details.

### `publicCards`

Stores the limited information needed to display a digital membership card publicly.

Each public card uses a unique, randomly generated token.

Firestore security rules restrict private member data to the authenticated gym owner and allow public access to individual digital card documents by their token.

## Security Notes

- Owner authentication is handled by Firebase Authentication.
- Firestore security rules protect private member information.
- Public membership cards expose only the information needed to display the card.
- QR codes use unique tokens rather than exposing private member records directly.
- Never upload Firebase service-account keys or private credentials to GitHub.

## Future Improvements

Potential improvements include:

- Member search and filtering.
- Membership renewal management.
- Payment history.
- Improved dashboard reporting.
- Additional UI enhancements.

## Author

Developed as a gym management project using React and Firebase.

---

**Gym Management App** — Simple member management and digital membership verification.