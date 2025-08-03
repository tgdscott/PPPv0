# Podcast Pro Plus API & Frontend

## Project Overview

Podcast Pro Plus is a web-based application designed to automate the most tedious parts of podcast production. The goal is to create a system where a user can upload raw audio files, define a template for their show's structure, and have the application automatically handle audio assembly, AI-powered cleanup, transcription, and metadata generation.

This repository contains both the Python/FastAPI backend and the React/Vite frontend.

---

## Current Status (As of July 30, 2025)

The project has a functional backend API and a working frontend UI for managing templates and processing episodes.

**Completed Functionality:**
* **Backend API:**
    * **Core Audio Engine:** Can stitch audio, normalize volume, apply complex background music rules, and handle segment overlaps.
    * **AI Processing:** Integrates with OpenAI and ElevenLabs for transcription, filler/pause removal, metadata generation, and on-the-fly audio creation.
    * **Keyword Actions:** Can detect and act on user-defined keywords (e.g., "Flubber," "Intern").
    * **Persistent Templates:** Templates are saved to and loaded from a `templates.json` file, surviving server restarts.
* **Frontend UI (React):**
    * **Template Editor:** A full-featured UI for creating, loading, editing, and saving complex podcast templates. Supports static, AI-generated, and direct TTS segments.
    * **Episode Workflow:** A single-page interface to select a template, specify a content file, choose cleanup options, and run the entire production process with a single click.

**Next Steps:**
* Refine and debug the end-to-end workflow.
* Implement a settings/admin page for user-configurable keywords (filler words, etc.).
* Begin Phase 4: Publishing to podcast hosts (e.g., Spreaker).

---

## Project Structure

-   `/podcast-pro-plus/` (Backend)
    -   `/api/`: The main FastAPI application.
    -   `templates.json`: The file where custom templates are saved.
-   `/frontend/` (Frontend)
    -   `/src/`: The main React application source code.

---

## Setup and Installation

### Backend

1.  **Prerequisites:** Python 3.12, FFmpeg.
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
5.  **Configure `.env` file** with your API keys.

### Frontend

1.  **Prerequisites:** Node.js (LTS version).
2.  Follow the detailed setup guide to create the Vite project and install dependencies.

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
