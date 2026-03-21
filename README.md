<<<<<<< HEAD
# InBetween App Setup Guide

## 📦 Prerequisites
Make sure you have installed:
- Node.js (v18 or above recommended)
- npm
- Expo CLI (optional but recommended)

---

## 🚀 Backend Setup

1. Navigate to backend folder:
```
cd backend
```

2. Install dependencies:
```
npm install
```

3. Start the backend server:
```
npm run dev
```

---

## 🌐 Important: Use Your Laptop IP (for mobile/other devices)

By default, your backend may run on `localhost`, which **won’t work on other devices**.

### 🔍 Find your IP address:

On Mac/Linux:
```
ifconfig
```

Look for something like:
```
inet 192.168.x.x
```

---

### ✏️ Update your frontend API URL

Go to your frontend code and replace:

```
http://localhost:PORT
```

with:

```
http://YOUR_IP_ADDRESS:PORT
```

Example:
```
http://192.168.1.5:5000
```

⚠️ Make sure:
- Both devices are on the same WiFi
- Backend server is running

---

## 📱 Frontend Setup

1. Navigate to frontend folder:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start Expo:
```
npx expo start
```

---

## 📡 Running on Another Device

- Open Expo Go on your phone
- Scan the QR code
- Ensure backend IP is correctly set

---

## ❗ Common Issues

- ❌ Cannot connect to backend → Check IP and WiFi
- ❌ API not working → Ensure backend is running
- ❌ Expo not loading → Restart with `npx expo start --clear`

---

## 🧠 Notes

- Never use `localhost` for mobile testing
- Always use your system’s IP address
- Keep backend running while testing frontend

## 📡 Running on Another Device

- Open Expo Go on your phone
- Scan the QR code
- Ensure backend IP is correctly set

---

## ❗ Common Issues

- ❌ Cannot connect to backend → Check IP and WiFi
- ❌ API not working → Ensure backend is running
- ❌ Expo not loading → Restart with `npx expo start --clear`

---

## 🧠 Notes

- Never use `localhost` for mobile testing
- Always use your system’s IP address
- Keep backend running while testing frontend
=======
# sturdy-goggles
>>>>>>> 3b95bfd (first commit added)
