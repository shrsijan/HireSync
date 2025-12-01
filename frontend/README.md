#  Local Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed on your system.

### Homebrew (macOS)
Ensure you have Homebrew installed. If not, run the following command:

```bash
/bin/bash -c "$(curl -fsSL [https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh](https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh))"
````

### MongoDB

1.  Install MongoDB Community Edition:

<!-- end list -->

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

2.  Start MongoDB as a service:

<!-- end list -->

```bash
brew services start mongodb-community@7.0
```

Alternatively, run it manually:

```bash
mongod --config /opt/homebrew/etc/mongod.conf --fork
```

### Ollama (AI Model)

1.  Download Ollama from [ollama.com](https://ollama.com).
2.  Install and run the application.
3.  Pull the required model (llama3.2):

<!-- end list -->

```bash
ollama pull llama3.2
```

-----

## Backend Setup

1.  Open a terminal and navigate to the backend directory:

<!-- end list -->

```bash
cd backend
```

2.  Install dependencies:

<!-- end list -->

```bash
npm install
```

3.  Create a `.env` file in the root of the backend directory with the following configuration:

<!-- end list -->

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interviewer
JWT_SECRET=your_jwt_secret_key_here
```

4.  Start the backend server:

<!-- end list -->

```bash
npm start
```

**Expected Output:**

```text
MongoDB connected
Server running on port 5000
```
-----

## Frontend Setup

1.  Open a new terminal window and navigate to the frontend directory:

<!-- end list -->

```bash
cd frontend
```

2.  Install dependencies:

<!-- end list -->

```bash
npm install
```

3.  Start the development server:

<!-- end list -->

```bash
npm run dev
```

4.  Open your browser and navigate to:
    http://localhost:3000

<!-- end list -->
