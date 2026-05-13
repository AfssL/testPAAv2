## Project Title: Study Plan Architect

### Overview

A graduation planning tool that automates the generation of a valid semester-by-semester course schedule. It ensures all academic requirements are met in the correct sequence, preventing students from enrolling in advanced classes without the necessary foundations.

### Core Logic: Directed Acyclic Graph (DAG)

The project treats a university degree as a **DAG**:

* **Nodes:** Individual courses.
* **Edges:** Prerequisites (directed arrows from "Intro" to "Advanced").
* **Constraint:** The graph must be **Acyclic** (no loops). If Course A requires B, and B requires A, the system identifies this as a "deadlock" and alerts the user.

### Algorithm: Topological Sort with Parity Constraints

The system implements a **Modified Kahn’s Algorithm** to "flatten" the complex web of requirements into a linear sequence while respecting academic calendars:

1.  **In-degree Tracking:** The system identifies courses with zero prerequisites.
2.  **Odd/Even Parity Check:** To mirror real-world university schedules, the solver enforces **Semester Parity**. 
    *   Courses marked as "Odd" in the curriculum (e.g., Semester 1, 3, 5) can only be placed in a calculated Odd semester.
    *   Courses marked as "Even" (e.g., Semester 2, 4, 6) can only be placed in a calculated Even semester.
3.  **Breadth-First Processing:** If a course is "unlocked" but has the wrong parity for the current semester, it waits in the pool until the next semester block.
4.  **Semester Grouping:** Nodes are grouped into discrete time blocks. If no courses can be taken in a specific semester due to parity or prerequisites, the system generates an empty semester to advance time.

### Key Features

*   **Automatic Scheduling:** Generates a full path to graduation based on course dependencies.
*   **Parity Enforcement:** Automatically handles the Odd/Even semester system common in universities.
*   **Validation Engine:** Checks for circular dependencies (loops) using DFS three-color marking and flags invalid prerequisite chains.
*   **Constraint Management:** Tracks SKS (credits) per semester and total graduation requirements.

### Technical Stack

*   **Backend:** Python/Flask.
*   **Core Logic:** Custom implementation of Kahn's Algorithm for topological sorting and DFS for cycle detection.
*   **Data:** JSON-based database (`curriculum.json`) containing course codes, SKS, and prerequisite lists.
*   **Frontend:** Vanilla HTML/CSS/JS (Stateless architecture).

---

**Project Goal:** To eliminate manual scheduling errors and provide students with a clear, logically sound roadmap to their degree that respects prerequisite chains and seasonal course availability.

### 1. Project Structure

```text
STUDY-PLAN-ARCHITECT/
├── backend/
│   ├── app.py                # Flask entry point and API routing
│   ├── core/
│   │   ├── solver.py         # Modified Kahn’s Algorithm (Topological Sort + Parity)
│   │   └── validator.py      # DFS-based cycle detection logic
│   ├── data/
│   │   └── curriculum.json   # Course metadata and prerequisite data
│   └── requirements.txt      # Backend dependencies (Flask, Flask-CORS)
└── frontend/
    ├── index.html            # UI Structure (Empty placeholder)
    ├── style.css             # UI Styling (Empty placeholder)
    └── main.js               # Frontend logic and API integration (Empty placeholder)
```

---

### 2. Component Breakdown

#### **Backend (Python)**

*   **`app.py`**: The API layer. It validates the input JSON, calls the cycle detector, and then the solver. It returns the calculated schedule, total SKS, and total semesters.
*   **`core/solver.py`**: The core logic. It handles the dependency graph and ensures courses are only scheduled when their prerequisites are met AND the semester parity matches their original designation.
*   **`core/validator.py`**: A safety layer that uses Depth-First Search to ensure the prerequisite graph is a Directed Acyclic Graph (DAG).

#### **Frontend (Vanilla JS)**

*   **Logic**: Sends course data to `/api/solve`.
*   **Visualization**: Receives the grouped semester data and renders it as a timeline or grid of semester cards.