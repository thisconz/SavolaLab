# SavolaLab

SavolaLab is an industrial-grade Quality Control and Assurance (QC/QA) platform designed for sugar production labs at Savola Group, Saudi Arabia. It streamlines laboratory workflows, sample tracking, testing procedures, and secure data storage for compliance and operational efficiency.

---

## 🚀 Key Features

- 🔬 **Comprehensive Test Suite**  
  Supports over 15 QC tests including:  
  `pH`, `TDS`, `Colour`, `Density`, `Turbidity`, `TSS`, `Minute Sugar`, `Ash`, `Sediment`, `Starch`, `Particle Size`, `CaO`, `Purity`, `Moisture (LOD)`, `Sucrose`.

- 🧪 **Sample Type Coverage**  
  Handles:
  - Sugar: White, Brown, Raw
  - Process Liquors: Fine, Polish, Evaporator, SAT
  - Utilities: Condensate, Cooling Water, Wash Water
  - Effluents

- 🔒 **Audit-Trail & Storage**  
  All lab results, raw outputs, scans, and reports are securely archived using [MinIO](https://min.io/) for traceability.

- 🧠 **Role-Based Access**  
  User roles: `QC Manager`, `Shift Chemist`, `Chemist`.  
  Fine-grained access control using role-based permissions.

- ⚙️ **High-Performance Backend**  
  - Language: `Python 3.11+`
  - Framework: `FastAPI`
  - ORM: `SQLAlchemy + SQLx-style queries`
  - DB: `PostgreSQL`
  - Object Storage: `MinIO`
  - Auth: JWT-based secure login

---

## 📁 Folder Structure



---

## 🐳 Quick Start (Dev)

1. **Clone Repo**
   ```bash
   git clone https://github.com/thisconz/SavolaLab.git
   cd SavolaLab
