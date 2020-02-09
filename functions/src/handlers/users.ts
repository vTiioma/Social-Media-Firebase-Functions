import * as admin from 'firebase-admin';
import * as firebase from 'firebase';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import BusBoy from 'busboy';
import { Request as eRequest, Response } from 'express';
import {
  validateSignUp,
  validateLogIn,
  reduceUserDetails
} from '../util/validators';
import { storageBucket } from '../util/config';

interface Request extends eRequest {
  user?: any;
  rawBody?: any;
}

const imageUrl = (file: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${file}?alt=media`;
const timestamp = () => admin.firestore.Timestamp.fromDate(new Date());
const handleError = (response: Response) => error => {
  console.error(error);
  response.status(500).json(error);
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
          created: timestamp(),
          image: imageUrl('blank-profile-picture.png')
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

export const addUserDetails = (request: Request, response: Response) => {
  admin
    .firestore()
    .doc(`/users/${request.user.user}`)
    .update(reduceUserDetails(request.body))
    .then(result => response.json({ message: 'Details added successfully' }))
    .catch(error => handleError(error));
};

export const uploadImage = (request: Request, response: Response) => {
  const busboy = new BusBoy({ headers: request.headers });

  let imageFileName: string;
  let imageToUpload: { filepath: string; mimetype: any };
  busboy.on(
    'file',
    (fieldname: string, file, filename: string, encoding, mimetype: string) => {
      if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        response
          .status(400)
          .json({ error: `file type ${mimetype} not allowed` });
        return;
      }
      const splitfilename = filename.split('.');
      const imageExtension = splitfilename[splitfilename.length - 1];
      imageFileName = `${Math.round(
        Math.random() * 10_000_000_000_000
      )}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToUpload = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    }
  );
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToUpload.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToUpload.mimetype
          }
        }
      })
      .then(value => {
        const image = imageUrl(imageFileName);
        return admin
          .firestore()
          .doc(`/users/${request.user.user}`)
          .update({ image });
      })
      .then(result => response.json({ message: 'image uploaded successfully' }))
      .catch(handleError(response));
  });
  busboy.end(request.rawBody);
};
