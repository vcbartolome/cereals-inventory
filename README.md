<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
    <img src="public/up-logo.png" alt="UP Logo" width="80" height="80">
    <img src="public/cropped-IPB-logo.png" alt="IPB Logo" width="60" height="80">

<h3 align="center">Cereals Inventory</h3>

  <p align="center">
    An inventory web application for the Cereal Crops Section.
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project


[![Dashboard Screen Shot][product-screenshot]](https://example.com)

Cereals Inventory is a web application designed for the Cereal Crops Section to efficiently manage and track seed inventory. Built with Next.js, React, and Firebase, it provides a modern, user-friendly interface for users.

**Key Features:**

- **Inventory Management:** Add, edit, view, and delete detailed records for each inventory item, including type, area planted, year, season, box number, location, shelf code, description, pedigree, weight, and remarks.
- **QR Code Integration:** Quickly scan QR codes to access and update box-specific inventory, streamlining physical-to-digital tracking.
- **Bulk Import:** Import inventory data from spreadsheets (Excel/CSV) with validation and error feedback, making large-scale updates fast and reliable.
- **Dashboard & Analytics:** Visualize inventory statistics with interactive charts, including total weight, low stock alerts, weight distribution, and comparative analysis over time or by category.
- **Advanced Search:** Powerful search tools for quickly finding items by type, year, box, and more.
- **User Roles & Admin Panel:** Role-based access control with admin features for user approval, role management, and database maintenance (including bulk deletion and activity logs).
- **Edit History:** Track changes to inventory entries with detailed edit history, including who made each change and when.
- **Responsive Design:** Optimized for both desktop and mobile devices, with a mobile-friendly QR scanner and adaptive layouts.

This application is tailored for storage operations, helping maintain accurate, up-to-date records.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

 - [![Next][Next.js]][Next-url]
 - [![React][React.js]][React-url]
 - [![TypeScript][TypeScript-badge]][TypeScript-url]
 - [![Tailwind][Tailwind-badge]][Tailwind-url]
 - [![Firebase][Firebase-badge]][Firebase-url]
 - [![Vercel][Vercel-badge]][Vercel-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Project Structure

Below is an overview of the main files and folders in this project, along with a brief explanation of their purpose:

```text
├── backend/                  <-- Data-fetching, schemas, & Firebase services
│   ├── firebase.ts           
│   ├── utils.ts              
│   └── schemas/              
│       ├── columns.tsx
│       └── inventory.ts
├── frontend/                 <-- Next.js user-facing UI and logic
│   ├── app/                  
│   │   ├── (user)/           
│   │   │   ├── admin/
│   │   │   ├── box/[uuid]/
│   │   │   ├── dashboard/
│   │   │   ├── import/
│   │   │   └── scan/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           
│   │   ├── app-sidebar.tsx
│   │   ├── filter.tsx
│   │   ├── inventory-form.tsx
│   │   ├── inventory-view-dialog.tsx
│   │   ├── protected-route.tsx
│   │   ├── scanner.tsx
│   │   ├── site-header.tsx
│   │   ├── dashboard/
│   │   ├── data-table/
│   │   └── ui/
│   ├── context/              
│   ├── hooks/                
│   ├── public/               
│   │   ├── docs/
│   │   └── screenshots/
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── package.json
├── package.json              <-- Root workspace config
├── README.md                 <-- Project documentation (this file)
└── ...
```

**Directory/Files Overview:**

- `backend/`: Data-fetching services, validation schemas, and database configurations.
  - `firebase.ts`: Firebase client initialization and setup.
  - `utils.ts`: General utilities and helpers (e.g., classname merging).
  - `schemas/`: Zod schemas (e.g. `inventory.ts`) and table configuration schemas (`columns.tsx`).
- `frontend/`: User-facing Next.js UI, layouts, pages, and components.
  - `app/`: Main Next.js App Router folders. Contains all routes, layouts, and page views.
  - `components/`: Reusable React components (UI primitives, dashboard cards, layout sidebars, etc.).
  - `context/`: React context providers (e.g., authentication & user contexts).
  - `hooks/`: Custom React hooks (e.g., user role checking).
  - `public/`: Static assets (images, document manual, etc.).
  - Next.js configurations (`next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `components.json`, `eslint.config.mjs`, `package.json`).
- `package.json`: Root wrapper utilizing NPM workspaces to run and manage frontend commands easily.

This structure divides the project into clear concerns for frontend design and backend data models.

## Getting Started

Follow these steps to set up and run the Cereals Inventory app locally on your machine.

### Prerequisites


Before you begin, ensure you have the following installed on your machine:

- **Node.js**: [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **git** (for cloning the repository): [Download git](https://git-scm.com/)
- **Firebase account & project**: [Create a Firebase project](https://firebase.google.com/)

You will need access to a Firebase project to configure authentication and database settings for the app.

### Installation



1. Obtain the source code:
   - **Option 1:** Clone the repository from GitHub:
     ```sh
     git clone https://github.com/zachglindro/cereals-inventory.git
     ```
   - **Option 2:** Download and extract the provided source code zip file to your desired directory.

2. Install dependencies:
   ```sh
   npm install
   ```

### Configuration


1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. In your project directory, create a `.env` file and add the following environment variables with your own values:
   ```env
   # Client-side Firebase config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Server-side Firebase Admin SDK config
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
   FIREBASE_PRIVATE_KEY="your_firebase_private_key"

   # Allowed hosts for client link validation (comma-separated)
   NEXT_PUBLIC_ALLOWED_HOSTS=localhost,example.com
   ```
   - You can find most of these values in your Firebase project settings.
   - For `FIREBASE_PRIVATE_KEY`, be sure to keep this value secret and wrap it in double quotes if it contains line breaks (as shown above).
   - Do not commit your `.env` file to version control.

### Running the App

To start the development server:
```sh
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

To build for production:
```sh
npm run build
npm start
```

### Deployment (Vercel)

To deploy this app to [Vercel](https://vercel.com/):

1. Push your code to a GitHub (or GitLab/Bitbucket) repository.
2. Go to [vercel.com/import](https://vercel.com/import) and import your repository.
3. During setup, add all required environment variables from your `.env` file to the Vercel dashboard (Settings > Environment Variables).
4. Click "Deploy". Vercel will build and host your app automatically.

For more details, see the [Vercel documentation](https://vercel.com/docs/deployments).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage


Cereals Inventory allows users to:

- Log in with their account
- Scan QR codes to view and update box inventory
- Add, edit, and delete inventory items
- Import inventory data in bulk from spreadsheets
- View analytics and statistics on the dashboard
- Use advanced search and filtering tools
- Manage users and roles (admin only)

For detailed instructions, screenshots, and workflows, please refer to the full [User Manual (DOCX)](public/docs/MANUAL.docx).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Email: zmglindro2@up.edu.ph

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[product-screenshot]: public/screenshots/dashboard.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Firebase-badge]: https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white
[Firebase-url]: https://firebase.google.com/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Tailwind-badge]: https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Vercel-badge]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/
