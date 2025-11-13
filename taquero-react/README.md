# Taquero - Restaurant Compliance Management System

A modern, SAAS-ready Progressive Web App built with React, Vite, and shadcn/ui for managing food safety compliance, inventory, and business operations for small restaurants and food manufacturing facilities.

## 🚀 Features

- **Dark, Minimalist Design** - Sleek Vercel-inspired interface optimized for tablets and mobile
- **Dual Dashboard System** - Separate dashboards for Restaurant and Food Manufacturing operations
- **FCP Compliance Modules** - All 13 Food Control Plan sections for New Zealand MPI compliance
- **Temperature Monitoring** - Fully functional wizard for daily fridge/chiller temperature checks
- **Google Sheets Integration** - Data saved to Google Sheets for easy visualization and export
- **Progressive Web App** - Installable on tablets and mobile devices (APK-ready)
- **User Management** - Simple multi-user authentication system
- **Task Completion Tracking** - Daily completion badges and duplicate prevention

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Framework:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Setup

1. Clone the repository:
```bash
cd taquero-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🔧 Configuration

### Google Sheets Integration

The app is configured to send data to Google Sheets via Google Apps Script. Update the webhook URL in:

- `src/components/temperature/TemperatureWizard.tsx` (line 16)

### Authentication

Default password is `123456`. Update in:

- `src/store/authStore.ts` (line 8)

Available users can be modified in the same file.

## 📱 Building for Production

### Web Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### PWA Installation

The app is automatically configured as a PWA. Users can install it to their home screen on mobile devices or tablets.

### APK Wrapping (Future)

To wrap this PWA as an Android APK, you can use:
- **PWA Builder** (https://www.pwabuilder.com/)
- **Bubblewrap**
- **Capacitor**

## 📂 Project Structure

```
taquero-react/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── temperature/     # Temperature wizard
│   │   └── Layout.tsx       # Main layout wrapper
│   ├── pages/               # Route pages
│   │   ├── modules/         # FCP module pages
│   │   ├── DashboardSelection.tsx
│   │   ├── RestaurantDashboard.tsx
│   │   ├── ManufacturingDashboard.tsx
│   │   ├── RestaurantFCP.tsx
│   │   └── ManufacturingFCP.tsx
│   ├── store/               # Zustand state management
│   ├── lib/                 # Utilities
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
└── package.json
```

## 🎨 Design Philosophy

- **Minimalist:** Clean, distraction-free interface focused on tasks
- **Dark Theme:** Reduces eye strain in kitchen environments
- **Touch-Optimized:** Large tap targets (44px minimum) for tablet use
- **Fast:** Optimized for older Android tablets (Android 9, 4GB RAM)
- **SAAS-Ready:** Modular architecture prepared for multi-tenancy

## 🔐 Security Notes

For production SAAS deployment:
- Implement proper authentication (OAuth, Firebase Auth, etc.)
- Add environment variables for sensitive data
- Set up database backend (currently using Google Sheets)
- Implement row-level security and multi-tenancy
- Add HTTPS and secure API endpoints

## 📋 FCP Modules

### Shared Modules (Restaurant & Manufacturing)
- Staff Training Records
- Personal Hygiene
- Fridge/Chiller Temps ✅ **(Implemented)**
- Cleaning & Closing
- Equipment Maintenance

### Restaurant-Specific
- Cooking Poultry - Batch Checks
- Proving the Method
- Proving Reheating Method
- Proving Time/Temp Cooking
- Proving Cooling Method
- Cooling Food - Batch Checks
- When Something Goes Wrong
- Customer Complaints

### Manufacturing-Specific
- Cooking Poultry - Batch Checks
- Proving the Method
- Proving Reheating Method
- Proving Time/Temp Cooking
- Proving Cooling Method
- Cooling Food - Batch Checks
- Processes & Controls
- Selling to Businesses

## 🚧 Roadmap

- [ ] Implement remaining FCP modules
- [ ] Add inventory management functionality
- [ ] Build financial data visualization
- [ ] Create caravan events scheduler
- [ ] Add traceability system for manufacturing
- [ ] Implement B2B sales tracking
- [ ] Add data export features
- [ ] Create admin dashboard
- [ ] Implement multi-tenancy for SAAS
- [ ] Add email notifications
- [ ] Build reporting and analytics

## 📄 License

Private use for Hot Like A Mexican restaurant.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📞 Support

For technical support or feature requests, please reach out to the project maintainer.

---

Built with ❤️ for Hot Like A Mexican - Wellington, NZ
