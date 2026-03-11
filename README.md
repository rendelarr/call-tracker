# 🐱 Mochi Call Tracker

A personal productivity app for freelance phone interpreters. Log calls, track earnings, and monitor your performance across pay cycles — all from your browser.

**Live app:** [mochi-calltracker.is-a.dev](https://mochi-calltracker.is-a.dev)

---

## Features

### ☀️ Today
- Real-time earnings display against your daily goal
- Live call timer — start a call and save it when it ends
- Manual entry and paste-to-parse logging
- Edit or delete any call from the day's list
- Minute goal tracker

### ⚡ Stats
- Daily score broken down into Goal, Rhythm, Streak, and Active components
- Day-over-day and week-over-week comparisons
- Cycle earnings projection at current pace
- Call rhythm analysis — gap distribution between calls (today and across the cycle)

### 🗓️ Week
- Weekly minutes and earnings summary
- Bar chart of daily activity for the current and previous week

### 🔄 Cycle
- Current pay cycle progress with days remaining and payday countdown
- Active days, streak, and daily goal compliance rate
- Visual calendar of cycle days with goal/active/today indicators
- Full list of all pay cycles with earnings per cycle

### 📜 History
- Expandable log of all past days
- Per-call detail: customer ID, start time, duration, earnings, surge flag

---

## Logging a Call

**Live** — tap 🔴 Live when a call starts, tap ⏹️ Stop when it ends. The duration is calculated automatically.

**Manual** — tap ✍️ Manual to enter start time, end time, or minutes directly.

**Paste** — tap 📋 Paste and drop in raw call data from your platform. The app parses customer ID, date, start time, duration, pay, billable status, and surge automatically.

---

## Import / Export

- **Import:** CSV or Excel files exported from your platform. The parser auto-detects column headers.
- **Export:** Download your logged calls as CSV or Excel at any time from ⚙️ Settings.

Duplicate detection on import: calls with the same customer ID + date + start time are skipped.

---

## Configuration

Open ⚙️ Settings to:
- Set your **daily earnings goal**
- Switch between **Light**, **Eva**, and **Dark** themes

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 (Create React App) |
| Storage | localStorage |
| Export | SheetJS (xlsx) |
| Deployment | Vercel |
| Domain | is-a.dev |

No backend. No accounts. All data stays in your browser.

---

## Local Development

```bash
git clone https://github.com/rendelarr/call-tracker
cd call-tracker
npm install
npm start
```

---

## Author

Made by [@rendelarr](https://github.com/rendelarr)
