# TalentPulse HRMS

Welcome to the **TalentPulse HRMS** (Human Resource Management System) repository. This repository houses the complete application suite, including the Spring Boot backend service and the frontend user interfaces.

---

## 📂 Project Structure Map

This repository is organized into the following main directories:

* **[talentpulse-springboot/](file:///c:/Users/ssale/.gemini/antigravity/scratch/Talentpulse/talentpulse-springboot)**
  The core Java backend API service built using **Spring Boot 3.2.5** and **SQLite**. It handles security (JWT authentication), employee profile management, department analytics, leave tracking, and payroll.
  * 📖 *See the [Backend README](file:///c:/Users/ssale/.gemini/antigravity/scratch/Talentpulse/talentpulse-springboot/README.md) for full backend commands, setup, and troubleshooting instructions.*
* **[talentpulse-ui-v2/](file:///c:/Users/ssale/.gemini/antigravity/scratch/Talentpulse/talentpulse-ui-v2)**
  The modern web-based frontend application for HR staff and administration management.
* **[talentpulse-backend/](file:///c:/Users/ssale/.gemini/antigravity/scratch/Talentpulse/talentpulse-backend)**
  Additional configuration profiles and resources for packaging or containerizing backend services.

---

## 🚀 Quick Run Guide

### Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd talentpulse-springboot
   ```
2. Compile and run:
   ```bash
   .\mvnw clean compile
   .\mvnw spring-boot:run
   ```
3. The server starts at `http://localhost:8000`.

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd talentpulse-ui-v2
   ```
2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```