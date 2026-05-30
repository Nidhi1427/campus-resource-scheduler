# Campus Nexus Scheduler 🚀

An intelligent, high-concurrency resource allocation system featuring real-time timeline visualization and an automated **Agentic AI Optimization engine** to resolve scheduling conflicts dynamically.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS v4, Recharts, Vite
- **Backend:** Node.js, Express, MongoDB Atlas, Mongoose
- **Algorithms:** Multi-document temporal overlap detection, custom 16-column grid coordinate mapping, cluster-wide availability search optimization.

## ⚡ Core Features

- **Interactive Timeline Matrix:** Custom-built horizontal grid handling 30-minute operational slices (`grid-cols-16`) mapping ISO timestamps to relative screen-space coordinate blocks without reliance on bulky third-party calendar packages.
- **Agentic AI Optimizer:** A background intelligence engine that intercepts scheduling failures. Upon detecting a concurrency collision, it analyzes room capacities and alternative time slots across the cluster to return immediate alternative booking paths.
- **Live Performance Analytics:** Real-time visual metrics powered by Recharts that aggregate MongoDB timestamps into active load trackers, highlighting peak usage windows across campas hubs.
- **Robust System Validations:** Back-end middleware preventing double-bookings through multi-conditional date criteria validation.

---

## 💿 Getting Started

### 1. Repository Setup
```bash
git clone [https://github.com/YOUR_USERNAME/campus-resource-scheduler.git](https://github.com/YOUR_USERNAME/campus-resource-scheduler.git)
cd campus-resource-scheduler