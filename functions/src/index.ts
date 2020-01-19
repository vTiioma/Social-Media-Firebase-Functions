import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as firebase from 'firebase';
import * as config from './util/config';

import { default as authenticate } from './util/authenticate';
import { getAllPosts, createSinglePost } from './handlers/posts';
import { signup, login, uploadImage } from './handlers/users';

admin.initializeApp();
firebase.initializeApp(config);

const app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// posts
app.get('/', getAllPosts);
app.post('/post', authenticate, createSinglePost);

// users
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', authenticate, uploadImage);

export const api = functions.https.onRequest(app);
