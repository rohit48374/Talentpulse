# TalentPulse HRMS - Spring Boot Backend

This is the professional Spring Boot backend service for the TalentPulse Human Resource Management System (HRMS). It is built using Spring Boot 3.2.5, Spring Security, Spring Data JPA, and SQLite.

---

## 🛠️ Tech Stack & Architecture

* **Framework:** Spring Boot 3.2.5 (Java 17)
* **Security:** Spring Security with JWT Token Authentication
* **Database:** SQLite (local file-based storage)
* **ORM:** Hibernate 6.4.4.Final with Spring Data JPA
* **Build Tool:** Maven (Wrapper included)

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your system:
* **Java Development Kit (JDK):** Version 17 or higher.
* **Git:** For version control.

---

## 🚀 Getting Started

You can build and run the application using the Maven wrapper (`mvnw.cmd` on Windows or `mvnw` on Unix/macOS) which is included in the project root.

### 1. Compile the Project
To compile the source code and download all required dependencies:
```bash
# Windows (PowerShell/CMD)
.\mvnw clean compile

# Linux/macOS
./mvnw clean compile
```

### 2. Run the Application
You can boot up the application in two ways:

#### Option A: Running via Maven (Development)
This runs the application using the Spring Boot Maven plugin:
```bash
# Windows
.\mvnw spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

#### Option B: Building a Fat JAR (Production & Testing)
This compiles and packages the entire application into a standalone executable JAR file:
```bash
# 1. Package the JAR (skipping tests)
.\mvnw package -DskipTests

# 2. Run the executable JAR directly
java -jar target/talentpulse-backend-1.0.0.jar
```

Once started, the backend server will run at:
👉 **`http://localhost:8000`**

---

## ⚙️ Configuration (`application.yml`)

The application's settings are defined in [src/main/resources/application.yml](src/main/resources/application.yml). Key configurations include:

* **Port:** Default is `8000` (can be overridden with the `PORT` environment variable).
* **Database Path:** Local file named `db.sqlite3` in the root of the project.
* **Hibernate `ddl-auto`:** Configured to `none`. 
  > [!IMPORTANT]
  > Because SQLite has a query limit on compound select statements (`SQLITE_MAX_COMPOUND_SELECT = 500`), enabling `ddl-auto: update` or `validate` in a project with a large number of entities causes SQLite metadata queries to crash on startup. Keep this set to `none` as the database is pre-seeded and schemas are managed statically.

---

## 🧩 SQLite-Specific Design Patches

Since SQLite does not have native Date/Time types and stores everything as strings, the application uses auto-applied JPA Converters to ensure robust operation:

1. **`LocalDateConverter`**:
   Converts `java.time.LocalDate` fields (e.g. `joiningDate`, `dateOfBirth`) to standard ISO format strings when storing in SQLite, and parses them flexibly when loading back to Java.
2. **`LocalDateTimeConverter`**:
   Ensures robust format mapping for `java.time.LocalDateTime` fields (like transaction timestamps or session expiry times).

Both converters are located in the [com.talentpulse.hrms.config](src/main/java/com/talentpulse/hrms/config) package and apply automatically to all entity fields of these types.

---

## 🔍 Troubleshooting & Common Issues

### 1. Port 8000 Already in Use
If the application fails to start with a port binding exception, another instance of the backend is already running.
* **Windows (PowerShell) Fix:**
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```
* **Linux/macOS Fix:**
  ```bash
  kill -9 $(lsof -t -i:8000)
  ```

### 2. Database is Locked Exception
SQLite allows multiple reads but only a single write lock at one time.
* Ensure you don't have multiple instances of the backend running at once.
* Close any external DB clients (like DBeaver or DB Browser for SQLite) that might hold write locks on `db.sqlite3`.
