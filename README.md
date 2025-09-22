# Android Testing Promotion Distribution

This app makes it simple to onboard testers to your Android app releases on the Google Play Store.
It automates the process of adding testers to your closed testing tracks, ensuring that only authorized
users can access your app before its public release.

It enables testers to join the required Google Group, and once they've joined shows them the link to
download the app, along with the next available promotional code if the app is a paid app. It persists their
email address to Firebase Firestore along with their assigned promotional code, so that they can return to the app
and retrieve their code again if needed.

## Features

- **Google Group Integration**: Automatically adds testers to a specified Google Group for easy management.
- **Promotional Code Distribution**: Distributes unique promotional codes to testers for paid apps.
- **Firebase Firestore Integration**: Stores tester information and promotional codes securely.
- **User-Friendly Interface**: Simple and intuitive UI for testers to join the group and retrieve their codes.
- **Admin Management**: An Admin interface to manage testers and view distribution statistics.

## Home page

The home page allows the owner of an app to add their app details, including the Google Group email address,
the link to the app on the Play Store, and the promotional codes in CSV form if applicable. Once this has
been done and persisted to Firestore, the owner is taken to the Admin page.

## Admin page

The Admin page allows the owner of the app to see how many testers have signed up, and to view the list of
testers and their assigned promotional codes. It also shows them the link to share to users to sign up, which uses
the app's unique app ID from the Play Store.

## Sign up page

The sign up page is where testers land when they visit the link shared by the app owner. It shows them the
details of the app, and allows them to join the Google Group. Once they have joined the group, they can
enter their email address to receive their promotional code if applicable. If they have already signed up,
they can enter their email address to retrieve their promotional code again.

## Technologies Used

- Next.js
- Firebase Firestore
- Google Groups API

## Configuration

To configure the app, you will need to set up a Firebase project and Firestore database. You will also need to
set up a Google Group for your testers. These are configured via environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth domain.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The email address of your Google service account.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: The private key of your Google service account.

If any of these environment variables are missing, redirect to a "/config-missing" page, which
instructs the user to add them, including instructions on how to do so for each variable.
