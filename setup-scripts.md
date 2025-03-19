# Setup Guide for Administrator Scripts

This guide explains how to set up and run the administrator scripts for creating users.

## Prerequisites

- Node.js (v12 or higher)
- npm (comes with Node.js)

## Setup

1. Install required dependencies by running the following command in the root directory:

```bash
npm install dotenv
```

2. Create an `.env` file at the root of the project by copying `.env.example`:

```bash
cp .env.example .env
```

3. Edit the `.env` file and add your Firebase configuration. You can find these values in your Firebase Console project settings.

## Available Scripts

### Creating Admin Users

To create admin users, run:

```bash
node create-user.js
```

This will:
- Create two admin users (admin@clinicamedicos.org and Admin@clinicamedicos.org)
- Create a read-only user (readonly@example.com)

### Creating Read-Only User

To create only a read-only user, run:

```bash
node create-readonly.js
```

## Security Notes

- Never commit `.env` files containing actual API keys to version control
- Keep passwords secure
- Consider updating default passwords in a production environment
- Use Firebase Authentication security rules to restrict access to your database 