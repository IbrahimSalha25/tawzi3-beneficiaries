# Web Programming Course - Final Project Proposal

---

## 1. Student Information

- **Student Name:** Ibrahim Atef Mohammed Salha
- **Student ID:** 1320222236

---

## 2. Project Overview

### **Project Title**

**Tawzi3 – Beneficiary Distribution Portal**

### **Project Description**

The **Tawzi3 Beneficiary Portal** is a full-stack web application designed to digitize and streamline humanitarian aid distribution. By moving away from manual spreadsheets, the portal provides beneficiaries with a personal dashboard to track their aid history, view pending distributions, and use a unique **QR Code** for contactless identity verification at distribution points.

### **Problem Statement**

- **Congestion:** Long wait times and crowding at shelters during distribution.
- **Tracking Issues:** Difficulty for beneficiaries to know their exact entitlements or history.
- **Communication Gap:** Lack of a formal, digital channel for feedback or complaints.
- **Insecurity:** High risk of manual data entry errors or record duplication.

### **The Solution**

- **Digital Identity:** Instant verification using unique QR Codes to speed up the process.
- **Transparency:** Real-time access to personal distribution logs (Received vs. Pending).
- **Feedback Loop:** An integrated system for submitting complaints and administrative notes.

---

## 3. Technical Specifications

| Category      | Technologies                                 |
| :------------ | :------------------------------------------- |
| **Frontend**  | HTML, CSS, JavaScript                        |
| **Database**  | Firebase Firestore (NoSQL)                   |
| **Tools**     | Antigravity, GitHub                          |
| **Libraries** | QR Code Generator Library (e.g., `qrcodejs`) |

---

## 4. Project Features

### **Core Functionality**

1.  **Secure Authentication:** Beneficiary login via unique credentials.
2.  **User Profile:** Display of personal data and registration status.
3.  **Distribution Ledger:** A clear list of aid packages (Food, Hygiene, etc.) with timestamps.
4.  **QR Code System:** Dynamic generation of a unique code for on-site scanning.
5.  **Support Center:** Form for submitting feedback or reporting issues.

### **Responsive Design Strategy**

- **Approach:** Mobile-First (Essential for field and shelter use).
- **Breakpoints:** \* Mobile: 360px
  - Tablet: 768px
  - Desktop: 1024px+

---

## 5. Development & Best Practices

- **Version Control:** Granular and descriptive commits on GitHub.
- **AI Integration:** Utilizing **Antigravity** and debugging.
- **Security:** Implementation of **Firebase Security Rules** to ensure users can only access their own data.
- **Code Quality:** Consistent naming conventions and semantic HTML structure.

---

## 6. Challenges & Learning Objectives

### **Anticipated Challenges**

- **Data Security:** Protecting sensitive beneficiary information from unauthorized access.

### **Learning Goals**

- Mastering **Firebase/Firestore** integration.
- Implementing **Real-time listeners** for a dynamic and reactive UI.
- Deepening knowledge in **Responsive UI/UX** tailored for humanitarian contexts.

---

> **Note:** This portal serves as the beneficiary-facing component of the broader **Tawzi3 ecosystem**, aiming to restore dignity and efficiency to aid distribution processes.
