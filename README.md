# HireSync

**A technical assessment platform that treats interviews like pair programming.**

Most coding tests measure how well you’ve memorized algorithms. HireSync measures how you solve problems. It provides an AI-assisted environment where candidates can get smart hints and breakdowns if they get stuck—simulating a real-world job environment where asking for clarification is encouraged.

---

### The Problem
Technical assessments often result in a binary "pass/fail" based on whether a candidate knew a specific trick. This filters out good engineers who just needed a slight nudge.

**HireSync changes the flow:**
1. **Recruiters** create assessments.
2. **Candidates** take the test. If they hit a wall, the AI offers **conceptual hints** (not code solutions).
3. **Recruiters** review the submission *and* the reliance on AI to gauge the candidate's actual level.

### Tech Stack

* **Frontend:** React
* **Styling:** TailwindCSS
* **Backend:** Node.js / Express
* **Database:** MongoDB
* **AI Engine:** Nemotron-nano 

### Key Features

**For Candidates**
* **Guided Support:** Instead of a blank screen, get context-aware hints when you are blocked.
* **Feedback Loop:** Receive explanations on *why* a solution works, not just a green checkmark.
* **Clean UI:** Minimalist, distraction-free code editor.

**For Recruiters**
* **Assessment Builder:** Upload custom problems or choose from templates.
* **Deep Insights:** See how many hints a candidate used and where they struggled.
* **Dashboard:** Manage active invites and review past attempts.

---

### Getting Started

To run this locally, you'll need Node.js and a MongoDB instance running.

1. **Clone the repo**
   ```bash
   git clone [https://github.com/yourusername/hiresync.git](https://github.com/yourusername/hiresync.git)
   cd hiresync
