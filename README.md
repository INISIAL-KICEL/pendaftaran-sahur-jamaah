# Ar-Rahman Sahur Ops

Sahur Management System specially built for **Masjid Agung Ar-Rahman Kabupaten Pandeglang**.
This project provides a full-stack solution using Next.js 14 (App Router), Tailwind CSS, Supabase (Auth & Database), and Lucide React.

## Features
- **Public Registration**: A form for jamaah to collect Name, WA Number, and Email.
- **Admin Dashboard**: Searchable and filterable table to manage registrations and toggle `is_taken` status in real-time.
- **Super Admin Controls**: Interface to manage Admin accounts and a WhatsApp Blast function to notify users.

## Tech Stack
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend & Auth**: Supabase

## Setup Instructions
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up your environment variables by creating a `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema (Supabase)
Execute the following SQL commands in your Supabase SQL Editor to initialize the database:

```sql
-- Create registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  is_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: admin_profiles is built on top of Supabase Auth.
-- Ensure you have users registered in Supabase Auth first.
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');

CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role DEFAULT 'admin'
);
```

## GitHub Readiness
```bash
git init
git add .
git commit -m "Initial commit for Ar-Rahman Sahur Ops"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
