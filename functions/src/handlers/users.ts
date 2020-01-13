import * as admin from 'firebase-admin';
import * as firebase from 'firebase';
import { Request, Response } from 'express';
import { validateSignUp, validateLogIn } from '../util/validators';

const timestamp = () => admin.firestore.Timestamp.fromDate(new Date());
const handleError = response => error => {
  response.status(500).json(error);
  console.error(error);
};

export const signup = (request: Request, response: Response) => {
  const email = request.body.email;
  const password = request.body.password;
  const displayName = request.body.username;

  const { isValid, errors } = validateSignUp({
    email,
    password,
    username: displayName
  });

  if (isValid === false) {
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
          user: displayName,
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
};

export const login = (request: Request, response: Response) => {
  const email = request.body.email;
  const password = request.body.password;

  const { isValid, errors } = validateLogIn({ email, password });

  if (isValid === false) {
    response.status(400).json(errors);
    return;
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(credential => credential.user?.getIdToken())
    .then(token => response.json({ token }))
    .catch(handleError(response));
};
