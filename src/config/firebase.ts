import admin from "firebase-admin";
import { env } from "./env";

const serviceAccount = JSON.parse(env.firebaseServiceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const firebaseAdmin = admin;
