# Data Analytics Agent - Frontend

A React-based frontend for the Data Analytics Agent. It provides a user-friendly interface for uploading datasets and asking data analysis questions in natural language.

## Features

- Upload CSV and Excel files
- Enter natural language analysis queries
- Send dataset and queries to the backend
- Display analysis results
- Display generated charts
- Simple and user-friendly interface

## Tech Stack

- React
- Vite

## Backend

This frontend communicates with the Data Analytics Agent backend built using:

- Python
- FastAPI
- LangGraph
- Pandas
- NumPy
- Matplotlib
- Groq

The backend processes the uploaded dataset, performs the requested analysis, generates visualizations, and returns the final result.

## How It Works


User
  ↓
React Frontend
  ↓
Upload Dataset + Query
  ↓
FastAPI Backend
  ↓
Data Analytics Agent
  ↓
Analysis + Visualization
  ↓
Result
  ↓
React Frontend