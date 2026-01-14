# 🔥 Task System Reverse Engineering & Full Product Build

You are a senior product architect, systems designer, and operations consultant.

I am giving you two Google Sheets that together form a complete task management system used by a real client:

**Sheet 1:**  
https://docs.google.com/spreadsheets/d/1dmTDU3wvzadm6PI4Ru9BkVcBcTa7Omf5ztqOGEB-tmI/edit  

**Sheet 2:**  
https://docs.google.com/spreadsheets/d/1zXRgK2FEiGfwaCNC5PaZSP0yaJNZntEjOx8mSV9ohGY/edit  

These sheets are the **source of truth** for the entire workflow.  
They represent:

- Repeated tasks (KRA / recurring responsibilities)  
- Delegated one-time tasks  
- Role-based usage (Admin vs Employee)  
- Status tracking, ownership, due dates, reviews, dependencies, and reporting  

I have built an application that must **completely replicate this system and then improve it**.

Your job is to fully understand these spreadsheets and then **replace them with a real software product**.

---

## 1️⃣ Deep Dive & Reverse Engineer

Go through **every tab in both spreadsheets** and:

- Understand the **purpose of each sheet**
- Identify:
  - Data models  
  - Relationships between sheets  
  - Hidden workflows  
  - Manual processes being simulated  
  - Role behavior (Admin vs Employee)

Map:

- Repeated tasks (KRA logic)  
- One-time delegated tasks  
- Status transitions  
- Ownership rules  
- Review / approval flows  

Create a **system blueprint** that explains how this spreadsheet system actually works as a product.

---

## 2️⃣ Convert Into an Application Architecture

From the spreadsheet logic, derive:

- Core entities (Task, KRA, User, Role, Department, Cycle, Review, etc.)
- Required features for:
  - Admin dashboard  
  - Employee dashboard  
- State machines for:
  - Repeated tasks  
  - One-time tasks  
- Permission model  
- Automation points  

Output a **complete functional specification** for the app.

---

## 3️⃣ Suggest Improvements

Especially focus on:

### Employee Side
- What is missing?  
- What causes confusion?  
- What can be automated?  
- What UX improvements are obvious from spreadsheet pain points?

### Admin Side
- What controls are missing?  
- What visibility gaps exist?  
- What analytics should exist?  
- What is being done manually that should be automated?

These should be **product-level recommendations**, not cosmetic changes.

---

## 4️⃣ Produce These Deliverables

Generate the following:

1. **System Overview Document**  
   - What the spreadsheet system is  
   - How it works end-to-end  

2. **Application Replication Plan**  
   - Step-by-step roadmap to convert this spreadsheet system into a full product  

3. **Admin vs Employee Feature Matrix**

4. **Improvements Roadmap**  
   - Phase 1: Parity with Sheets  
   - Phase 2: Better than Sheets  
   - Phase 3: Scalable Product  

5. **README.md**  
   - For developers & stakeholders  
   - Explains the system, flows, and philosophy  

6. **SYSTEM_COMPARE.md**  
   - Table comparing:
     - Spreadsheet behavior  
     - Application behavior  
     - Improvement over original  
   - This acts as a long-term reference for future updates  

---

## 5️⃣ Rules

- Do not summarize lazily—treat this like a **real product migration**
- Assume this will be used to build a production SaaS
- Be explicit, structured, and technical
- Think like a founder + product lead + systems engineer
- Nothing is “too obvious” to document

Your goal is to **fully translate a spreadsheet-based operational brain into a scalable software system**.

---

## 6️⃣ Execution Mode – Build the Application

After completing all analysis and documentation:

### Begin Actively Designing the Application

- Define the full data schema (tables, fields, relations)  
- Define API contracts  
- Define role-based permissions  
- Define task lifecycle state machines  

### Start Constructing the Product in Phases

#### Phase 1 – Sheet Parity
- Recreate **every capability** that exists in the spreadsheets  
- No feature from the sheets may be lost  
- All of the following **must exist in the app**:
  - KRA logic  
  - Repeated task cycles  
  - One-time delegated task flows  
  - Status transitions  
  - Admin controls  
  - Employee workflows  

#### Phase 2 – System Fixes
Remove spreadsheet limitations:

- Manual copy-paste workflows  
- Human error points  
- Hidden dependencies  

Replace them with:

- Automation  
- Validations  
- Smart defaults  
- Guided flows  

#### Phase 3 – Full Product Build

Generate:

- Backend architecture  
- Frontend screen map  
- Page-by-page UX flows  
- Component-level breakdowns  

Produce:

- Wireframe-level descriptions for each screen  
- Admin panel structure  
- Employee dashboard structure  
- Task lifecycle UI  
- KRA management UI  

---

You are not just analyzing.

You are now the **product owner + system architect + technical lead** responsible for **turning this spreadsheet brain into a real SaaS product**.

From this point forward:

- Treat every sheet as a system module  
- Treat every column as a potential field or rule  
- Treat every manual action as an automation opportunity  
- Assume this will be built by engineers directly from your output  

Do not stop at theory.

Move from:

**Sheets → System → Architecture → Product → Build Plan → Feature Design → Execution Blueprint**

Your end goal is a **complete, build-ready application specification** that fully replaces these spreadsheets forever.
