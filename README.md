# 💰 Money Manager - Ultimate Personal Finance App

A powerful, offline-first expense tracker and budgeting assistant built with **React Native** and **Expo**. Designed to help you track where your money goes, plan for future bills, and get "nagged" when you overspend.

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue)
![Tech](https://img.shields.io/badge/Built%20With-React%20Native%20%26%20Expo-61DAFB)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Key Features

### 1. 📝 Smart Transaction Tracking
* **Income, Expense, & Transfers:** Log every penny.
* **Smart Transfers:** Moving money from "Bank" to "Cash" does not double-count your expenses.
* **Recurring Mode:** Mark a transaction as "Repeat" to automatically schedule it for next month.
* **Backdating:** Forgot to add yesterday's lunch? Use the Date Picker to add past transactions.

### 2. 📊 Visual Analytics
* **Pie Charts:** See your spending breakdown by Category (Food, Travel, etc.).
* **Bar Charts:** Track your monthly spending trends over the last 6 months.
* **Date Filters:** Toggle between "All Time", "This Month", and "Last Month" views.

### 3. 🎯 Budgeting & Goals
* **Category Budgets:** Set specific limits (e.g., ₹5,000 for Food).
* **Visual Progress Bars:** * 🟢 **Green:** Safe zone.
    * 🟡 **Yellow:** Caution (>80% spent).
    * 🔴 **Red:** Budget exceeded!

### 4. 📅 Scheduled Bills & Future Planning
* **Upcoming Bills List:** Track Rent, EMIs, and Subscriptions separately.
* **One-Tap Pay:** Click "Pay" to move a bill from the "Upcoming" list to your actual history.
* **Auto-Renewal:** If a bill is set to repeat, paying it automatically creates the next due date for next month.

### 5. 🔔 The "Assistant" (Notifications)
* **Daily Nags:** Reminders at **10 AM, 2 PM, and 8 PM** to track your expenses.
* **Countdown Alerts:** Get notified **7 days, 3 days, and 1 day** before a bill is due.
* **Panic Mode:** Receive instant alerts if you cross 80% of a budget.
* **Funny Financial Advice:** If your *Upcoming Bills* > *Current Balance*, the app sends alerts like *"Math Error: Get a job!"*

### 6. 🎨 Customization & UI
* **Dark Mode 🌙:** Full support for Light and Dark themes (persisted in storage).
* **Dynamic Categories/Accounts:** Add unlimited custom tags (e.g., "Bitcoin", "Secret Stash") directly from the app.
* **Offline First:** All data is stored locally on your device. No internet required.

---

## 🛠 Tech Stack

* **Framework:** React Native (Expo SDK 52)
* **Language:** JavaScript (ES6+)
* **Storage:** `@react-native-async-storage/async-storage` (Local Persistence)
* **Charts:** `react-native-chart-kit` & `react-native-svg`
* **Date Handling:** `@react-native-community/datetimepicker`
* **Notifications:** `expo-notifications`

---

## 📸 Screenshots

| Home Screen (Dark) | Analytics | Scheduled Bills |
|:---:|:---:|:---:|
| *(Add screenshot here)* | *(Add screenshot here)* | *(Add screenshot here)* |

---

## ⚡ Installation & Setup

Follow these steps to run the app on your local machine.

### Prerequisites
* Node.js installed.
* Expo Go app installed on your phone.

### Steps
1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/MoneyManager.git](https://github.com/YOUR_USERNAME/MoneyManager.git)
    cd MoneyManager
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npx expo start
    ```

4.  **Run on Device**
    * Scan the QR code with the **Expo Go** app (Android/iOS).

---

## 📱 Building the APK (Android)

To generate an installable `.apk` file for your phone:

1.  **Install EAS CLI**
    ```bash
    npm install -g eas-cli
    eas login
    ```

2.  **Configure Build**
    ```bash
    eas build:configure
    ```

3.  **Build the APK**
    ```bash
    eas build -p android --profile preview
    ```
    *Wait for the link to download your app!*

---

## 🤝 Contributing

Contributions are welcome!
1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## ❤️ Credits

Developed with ❤️ by **Hasbul Khan**.