# Podcast Pro Plus API & Frontend

## Project Overview

Podcast Pro Plus is a web app that takes the pain out of podcast production. Just upload your raw audio, set up a template, and let the app handle the rest: audio assembly, AI magic (cleanup, transcription, metadata), and even generating new audio on the fly.

This repo holds both the **Python/FastAPI backend** and the **React/Vite frontend**.

---

## Current Status (As of August 2, 2025)

We've got a working backend API and a mostly integrated, fresh-looking frontend UI. We've even got user authentication and database persistence humming along!

### Completed Functionality:

* **Backend API (FastAPI): Fully Functional!**
    * **Core Audio Engine:** Stitches audio, normalizes volume, handles background music rules, and manages segment overlaps.
    * **AI Processing:** Integrates with OpenAI and ElevenLabs for transcription, filler/pause removal, metadata generation, and real-time audio creation.
    * **Keyword Actions:** Detects and acts on user-defined keywords (e.g., "Flubber," "Intern").
    * **Persistent Templates:** Templates are saved to and loaded from `templates.json` and survive server restarts.
    * **Authentication:** Complete user login/registration via **Google OAuth** is working, including admin user identification.
    * **Database (SQLite):** `database.db` correctly stores **Users** (with tiers), **Podcasts (Shows)**, **Episodes**, **PodcastTemplates**, and **MediaItems**.
    * **API Endpoints:** All essential API routes are built and secured for managing users, templates, media, episodes, podcasts, and admin actions.
    * **File Storage:** Handles uploads for audio files and cover art, storing them in the `media_uploads` directory.

* **Frontend UI (React + Vite): Mostly Integrated!**
    * **New UI:** Successfully integrated a professional design using `v0.dev` and `shadcn/ui`.
    * **Template Editor:** A full-featured UI for creating, loading, editing, and saving complex podcast templates. Supports static, AI-generated, and direct TTS segments.
    * **Episode Workflow:** A single-page interface to select a template, specify a content file, choose cleanup options, and run the production process with a single click.
    * **Core Structure:** `App.jsx` is the main router, handling Google OAuth redirects and sending users to the right dashboard (user or admin).
    * **Dashboard Components:** All major UI components (LandingPage, PodcastPlusDashboard, AdminDashboard) are neatly organized in `src/components/dashboard`.
    * **User Dashboard (`PodcastPlusDashboard.jsx`):**
        * Main view for regular users, switching between:
            * Main dashboard
            * Media Library (view & upload - **Live!**)
            * Template Editor (view, edit, save - **Live!**)
            * Episode History (view - **Live!**)
            * Podcast (Show) Manager (view, create - **Live!**)
    * **Admin Dashboard (`AdminDashboard.jsx`):**
        * Main view for admins.
        * Fetches and displays all users from the backend - **Live!**
        * Analytics/overview tabs are wired up to a live backend endpoint - **Live!**

### Next Steps:

* **Immediate Next Task:** Fix the `PodcastCreator.jsx` component to correctly link new episodes to existing "Shows."
* Refine and debug the end-to-end workflow.
* Implement a settings/admin page for user-configurable keywords (filler words, etc.).
* Begin Phase 4: Publishing to podcast hosts (e.g., Spreaker).

---

## Project Structure

* `/podcast-pro-plus/` (Backend)
    * `/api/`: The main FastAPI application.
    * `templates.json`: Where custom templates are saved.
* `/frontend/` (Frontend)
    * `/src/`: The main React application source code.
        * `/src/components/dashboard/`: Contains individual dashboard UI components.
    * `media_uploads/`: Directory for uploaded audio files and cover art.

---

## Setup and Installation

### Backend

1.  **Prerequisites:** Make sure you have **Python 3.12** and **FFmpeg** installed.
2.  Navigate to the `podcast-pro-plus` directory.
3.  **Create/Activate Virtual Environment:**
    ```bash
    py -3.12 -m venv venv
    source venv/Scripts/activate
    ```
4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Configure `.env` file** with your API keys (e.g., OpenAI, ElevenLabs).

### Frontend

1.  **Prerequisites:** You'll need **Node.js** (LTS version).
2.  Follow the detailed setup guide (which you should create, vibe coder!) to get the Vite project up and running and dependencies installed. It's usually something like:
    ```bash
    cd frontend
    npm install
    ```

---

## How to Run the Application

1.  **Start the Backend:** In the `podcast-pro-plus` directory, run:
    ```bash
    uvicorn api.main:app --reload
    ```
2.  **Start the Frontend:** In the `frontend` directory, run:
    ```bash
    npm run dev
    ```
3.  Open your browser to the URL provided by the Vite server (usually `http://localhost:5173`).