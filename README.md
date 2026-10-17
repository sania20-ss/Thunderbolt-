# SecureAuth – Login & Registration System

SecureAuth is a full-stack authentication application featuring user registration, login, email OTP verification, CAPTCHA support, and MySQL database integration.

**Live Demo:** https://thunderbolt-six.vercel.app/

**GitHub Repository:** https://github.com/sania20-ss/Thunderbolt-

## 1. Problem Statement

Applications require secure and reliable authentication to manage user accounts and protect user information. SecureAuth demonstrates a full-stack authentication system integrating a web frontend, Java backend, MySQL database, and email verification.

## 2. Objectives

- Provide login and registration functionality.
- Support email OTP verification and CAPTCHA.
- Connect the frontend with a Spring Boot backend.
- Store user records in MySQL.
- Deploy the application using cloud services.

## 3. Project Scope

The project covers user registration, login, OTP verification, dashboard access, database connectivity, and cloud deployment. Further security testing and production hardening may be required before real-world use.

## 4. Key Features

- User registration and login
- Email OTP verification
- CAPTCHA support
- User dashboard and logout
- MySQL database integration
- Cloud deployment

## 5. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Java 21, Spring Boot |
| API | Spring Web |
| Security | Spring Security |
| Database | MySQL |
| ORM | Spring Data JPA, Hibernate |
| Email | Spring Boot Starter Mail |
| AI Integration | Google Gemini API |
| Database Hosting | Aiven |
| Backend Hosting | Render |
| Frontend Hosting | Vercel |
| Version Control | Git, GitHub |

## 6. System Architecture

```text
User
 |
 v
React + TypeScript Frontend
        (Vercel)
          |
          v
Spring Boot REST API
        (Render)
          |
          v
      Aiven MySQL
          |
          v
     User Records

Spring Boot --> SMTP Email Service
```

## 7. Process Flow

1. The user opens the application.
2. The user registers or logs in.
3. The backend validates the request.
4. User data is stored or retrieved from MySQL as required.
5. OTP verification is performed when applicable.
6. After successful authentication, the user accesses the dashboard.

## 8. Deployment Links

| Service | Link |
|---|---|
| GitHub Repository | [Thunderbolt-](https://github.com/sania20-ss/Thunderbolt-) |
| Live Frontend | [Vercel Application](https://thunderbolt-six.vercel.app/) |
| Backend | [Render Service](https://backend-db-login-register-application.onrender.com) |
| Render Dashboard | [Service Settings](https://dashboard.render.com/static/srv-db7qhraj9qps73dd1pjg/settings) |
| Aiven Console | [Aiven MySQL](https://console.aiven.io/) |

## 9. Database and MySQL Screenshot

The application uses MySQL to store user records. The following query retrieves user information from the `users` table.

```sql
SELECT
    id,
    username,
    first_name,
    last_name,
    email,
    created_at,
    department,
    status
FROM defaultdb.users;
```

### MySQL Query Result

<img width="1167" height="641" alt="image" src="https://github.com/user-attachments/assets/f1fd8b0b-c507-4c03-a18a-b61fce5a6304" />




*Figure 1: MySQL Workbench result showing user records.*

## 10. Requirements

- Node.js and npm
- Java JDK 21
- Apache Maven
- Aiven MySQL credentials
- Gemini API key, if required by enabled features
- SMTP credentials, if email delivery is enabled

## 11. How to Run the Project Locally

### A. Start the Frontend

Open a terminal in the project root directory.

**Step 1: Install dependencies**

```bash
npm install
```


**Step 2: Start the frontend**

```bash
npm run dev
```

The Vite development server runs on port `3000`.

### B. Start the Backend

Open a **second terminal** in the project root directory.

**Step 1: Navigate to the backend**

```bash
cd backend-java
```

**Step 2: Configure database and email variables**




Use the actual Aiven JDBC connection URL and credentials. These are placeholders, not literal values.

**Step 3: Start Spring Boot**

```bash
mvn spring-boot:run
```

The backend is configured to run on port `8080`.

### C. Access the Application

Open the frontend in your browser:

http://localhost:3000

Make sure the frontend API configuration points to the running backend and that the backend can connect to MySQL.

## 12. Test Cases

The following test cases should be executed and updated according to the actual results.

| ID | Test Case | Expected Result | Status |
|---|---|---|---|
| TC-01 | Submit invalid registration details | Validation error displayed | Not Executed |
| TC-02 | Register with valid details | Account is created successfully | Not Executed |
| TC-03 | Verify a valid OTP | Verification succeeds | Not Executed |
| TC-04 | Login with valid credentials | Dashboard is accessible | Not Executed |
| TC-05 | Login with invalid credentials | Access is denied | Not Executed |
| TC-06 | Connect to Aiven MySQL | Database connection succeeds | Not Executed |

*Update each status to Passed, Failed, or Blocked after testing.*

## 13. Security Considerations

- Do not commit API keys or database credentials.
- Use HTTPS for deployed services.
- Verify backend password hashing and authentication.
- Apply OTP expiry and attempt limits where required.
- Configure Spring Security and CORS appropriately.
- Avoid publishing real users' personal information.

## 14. Future Enhancements

- Automated integration testing
- OTP rate limiting
- Improved session and token management
- API documentation using Swagger
- Application monitoring and logging

## 15. References

1. ChatGPT: https://chatgpt.com/
2. Google Gemini: https://gemini.google.com/
3. Gemini API Documentation: https://ai.google.dev/gemini-api/docs
4. Codecademy: https://www.codecademy.com/
5. Stack Overflow: https://stackoverflow.com/
6. React Documentation: https://react.dev/
7. Vite Documentation: https://vite.dev/
8. Spring Boot Documentation: https://docs.spring.io/spring-boot/
9. MySQL Documentation: https://dev.mysql.com/doc/
10. Aiven Documentation: https://docs.aiven.io/
11. Render Documentation: https://render.com/docs
12. Vercel Documentation: https://vercel.com/docs

---

**Project:** SecureAuth – Login & Registration System

