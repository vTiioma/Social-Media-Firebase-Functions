import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

admin.initializeApp();
const app = express();

import * as firebase from 'firebase';
const firebaseConfig = functions.config().fire;
firebase.initializeApp({
  apiKey: firebaseConfig.apikey,
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseurl,
  projectId: firebaseConfig.projectid,
  storageBucket: firebaseConfig.storagebucket,
  messagingSenderId: firebaseConfig.messagesenderid,
  appId: firebaseConfig.appid,
  measurementId: firebaseConfig.measurementid
});

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

const isValidEmail = (email: string) =>
  email.match(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )
    ? true
    : false;
const isEmpty = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === '';
const timestamp = () => admin.firestore.Timestamp.fromDate(new Date());
const handleError = response => error => {
  response.status(500).json(error);
  console.error(error);
};

app.get('/', (request, response) => {
  admin
    .firestore()
    .collection('posts')
    .orderBy('timestamp', 'desc')
    .get()
    .then(data => {
      const posts: any[] = [];
      data.docs.forEach(post => {
        posts.push({
          ...post.data(),
          id: post.id,
          timestamp: post.data().timestamp.toDate()
        });
      });
      return response.json(posts);
    })
    .catch(handleError(response));
});

app.post('/post', (request, response) => {
  const post: any = {
    user: request.body.user,
    body: request.body.body,
    timestamp: timestamp()
  };
  admin
    .firestore()
    .collection('posts')
    .add(post)
    .then(({ id }) =>
      response.json({ message: `Document ${id} created successfully!` })
    )
    .catch(handleError(response));
});

app.post('/signup', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  const displayName = request.body.username;

  const emptyFieldError = field => `${field} must not be empty`;
  const errors: any = {};

  if (isEmpty(email)) {
    errors.email = emptyFieldError('email');
  } else if (isValidEmail(email) === false) {
    errors.email = 'must use a valid email address';
  }
  if (isEmpty(password)) {
    errors.password = emptyFieldError('password');
  }
  if (isEmpty(displayName)) {
    errors.username = emptyFieldError('username');
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json(errors);
    return;
  }

  let token: string;
  let uid: string;

  admin
    .firestore()
    .doc(`/users/${displayName}`)
    .get()
    .then(snapshot => {
      if (snapshot.exists) {
        response
          .status(400)
          .json({ message: `username ${displayName} is already taken` });
        return;
      } else {
        return firebase.auth().createUserWithEmailAndPassword(email, password);
      }
    })
    .then(credential => {
      uid = credential?.user?.uid ?? 'missing';
      return credential?.user?.getIdToken();
    })
    .then(idToken => {
      token = idToken ?? 'missing';
      return admin
        .firestore()
        .doc(`/users/${displayName}`)
        .set({
          uid,
          email,
          created: timestamp()
        });
    })
    .then(result => response.status(201).json({ token }))
    .catch(error => {
      if (error.code === 'auth/email-already-exists') {
        response.status(400).json(error);
      } else {
        response.status(500).json(error);
      }
      console.error(error);
    });
});

app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  const emptyFieldError = field => `${field} must not be empty`;
  const errors: any = {};

  if (isEmpty(email)) {
    errors.email = emptyFieldError('email');
  } else if (isValidEmail(email) === false) {
    errors.email = 'must use a valid email address';
  }
  if (isEmpty(password)) {
    errors.password = emptyFieldError('password');
  }

  if (Object.keys(errors).length > 0) {
    response.status(400).json(errors);
    return;
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(credential => credential.user?.getIdToken())
    .then(token => response.json({ token }))
    .catch(handleError(response));
});

export const api = functions.https.onRequest(app);
