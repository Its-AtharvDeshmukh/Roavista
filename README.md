# 🏔️ Roavista: Premium Sanctuary Booking Platform

Roavista is a full-stack premium sanctuary booking application designed to provide users with a seamless experience for discovering and reserving unique stays. Inspired by platforms like Airbnb, it features secure UPI payments, interactive mapping, and a luxury-focused user interface.



---

## 🚀 Features

### For Guests
* **Explore Sanctuaries:** Discover unique stays across categories like Trending, Iconic Cities, Mountains, Castles, and more.
* **Interactive Maps:** View listing locations on an immersive 3D Mapbox satellite map with fly-to animations.
* **Secure Reservations:** Book stays using a custom-built UPI payment modal with QR code generation and verification delay.
* **Guest Reviews:** Read and write reviews with a 5-star rating system and interactive review carousel.
* **User Profiles:** Manage personal bookings and profile information through a secure dashboard.

### For Hosts & Admins
* **List Property:** Easy-to-use "Atelier" interface for uploading property details and high-quality images via Cloudinary.
* **Manage Listings:** Full CRUD (Create, Read, Update, Delete) capabilities for hosts to manage their own properties.
* **Admin Dashboard:** Specialized access for developers to monitor and manage platform-wide activity.

---

## 🛠️ Tech Stack

* **Frontend:** EJS (Embedded JavaScript), CSS3, JavaScript (ES6+), Bootstrap 5.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB Atlas (NoSQL).
* **Authentication:** Passport.js (Local & Google OAuth 2.0).
* **APIs:**
    * **Mapbox GL JS:** 3D maps and Geocoding.
    * **Cloudinary:** Image hosting and management.
    * **QRCode.js:** UPI QR code generation.

---

## 📂 Project Structure

```text
Roavista/
├── controllers/    # Route logic (Listings, Reviews, Users, Bookings)
├── models/         # Mongoose Schemas (Listing, Review, User, Booking)
├── Public/         # Static assets (CSS, client-side JS, Images)
├── Routes/         # Express Router configurations
├── views/          # EJS Templates (layouts, partials, pages)
├── middleware.js   # Authentication and Authorization logic
├── app.js          # Main entry point and server configuration
└── cloudConfig.js  # Cloudinary service setup
