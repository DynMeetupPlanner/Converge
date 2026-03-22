# InBetween App Setup Guide

## 📦 Prerequisites
Make sure you have installed:

- npm
- Expo CLI (optional but recommended)

---

## 🚀 Backend Setup

1. Not needed to setup

2. runs directly as it is running on google cloud run


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
