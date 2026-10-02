# TechHaven Mobile App (React Native / Expo)

A cross-platform mobile companion app for the **TechHaven** e-commerce shop, built using Expo SDK 57, React Native, and TypeScript.

---

## Features

* **Shared Account Login:** Sign in with Google or account email &mdash; authenticated against the same PostgreSQL database and API endpoints as the website.
* **Instant Real-Time Cart Synchronization:** When an item is added to the cart on the website, it instantly appears in the mobile app cart (and vice-versa) with updated subtotal and item counts.
* **Product Catalog:** Real-time catalog populated from `GET /api/products` with category filtering, search, and detailed specifications modal.
* **Direct Checkout:** Place orders via `POST /api/checkout` with live order persistence and Resend receipt dispatch.
* **Order History:** Track recent purchases synchronized across web and mobile via `GET /api/orders`.
* **Configurable API Endpoint:** Dynamic server URL configuration on the Account screen to switch between local Wi-Fi (`http://192.168.1.111:3000`), ngrok tunnels, or live production deployments.

---

## Testing on a Physical Phone (Step-by-Step)

### 1. Start the Next.js Backend
In the project root directory (`/hng_website`):
```bash
npm run dev -- -H 0.0.0.0
```
*(Binding to `0.0.0.0` allows devices on your local Wi-Fi network to reach `http://<your-mac-ip>:3000`)*

### 2. Start the Mobile App
In another terminal, navigate to the `mobile` directory:
```bash
cd mobile
npx expo start
```
*(Or use `npx expo start --tunnel` if your Wi-Fi router isolates devices).*

### 3. Open on Your Physical Phone
1. Install **Expo Go** from the iOS App Store or Google Play Store.
2. Ensure your phone is connected to the same Wi-Fi network as your Mac.
3. Open your phone camera (iOS) or the Expo Go app (Android) and scan the QR code displayed in the terminal.
4. The **TechHaven** app will load onto your phone!

---

## Verifying the Requirements

### Requirement 1: Login with the Same Account
1. Open the website at `http://localhost:3000` and sign in (e.g. with your Google account or `demo.shopper@techhaven.com`).
2. Open the mobile app on your phone, go to the **Account** tab, and sign in with the exact same account.
3. Verify that both the web header and the mobile Account tab display the same user profile!

### Requirement 2: Instant Cart Synchronization
1. Keep the mobile app open on your physical phone on the **Cart** tab.
2. In your computer's web browser, browse products and click **"Add to Cart"** on any item (e.g., *Sony WH-1000XM5* or *MacBook Pro*).
3. **Observe:** The item instantly appears on your phone screen in real time with the updated badge and subtotal!
4. Tap **"+"** or **"-"** on your phone to update the quantity &mdash; observe the website cart drawer immediately updating to match!
