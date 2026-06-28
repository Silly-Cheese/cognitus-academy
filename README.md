# Cognitus Academy

Cognitus Academy is the internal LMS, training, monthly compliance, and certification dashboard for Cognitus Solutions.

## Included

- Owner bootstrap account setup
- Discord Username + Discord User ID + 4-digit PIN sign-in
- Staff management
- Premade course seeding
- Course library
- Course builder
- Assignment center
- Monthly training support
- Certification issuing
- Employee dashboard
- Manager reports
- Executive administration dashboard
- Black and white Cognitus design

## First setup

1. Open `firebase-config.js`.
2. Replace `PASTE_FIREBASE_API_KEY_HERE` with your Firebase web app API key.
3. In Firebase Authentication, enable Anonymous sign-in.
4. In Firestore Database, create the database.
5. Launch the site.
6. The first screen creates the Owner account.

## Owner bootstrap

The first account is created as:

- Employee ID: `EMP-000001`
- Department: `Executive`
- Role: `Owner`
- Permission Level: `System Administrator`

No Payroll ID is used in the LMS.

## Important security note

The current portal is a frontend Firebase LMS. For stronger production security, add strict Firestore rules or a backend/admin layer before handling sensitive real-world records.
