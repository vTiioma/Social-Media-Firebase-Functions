import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

admin.initializeApp();
const app = express();

// import * as firebase from 'firebase';
// const firebaseConfig = functions.config().fire;
// firebase.initializeApp({
//   apiKey: firebaseConfig.apikey,
//   authDomain: firebaseConfig.authDomain,
//   databaseURL: firebaseConfig.databaseurl,
//   projectId: firebaseConfig.projectid,
//   storageBucket: firebaseConfig.storagebucket,
//   messagingSenderId: firebaseConfig.messagesenderid,
//   appId: firebaseConfig.appid,
//   measurementId: firebaseConfig.measurementid
// });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

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
  const user = {
    email: request.body.email,
    password: request.body.password,
    displayName: request.body.username
  };

  admin
    .firestore()
    .doc(`/users/${user.displayName}`)
    .get()
    .then(snapshot => {
      if (snapshot.exists) {
        response
          .status(400)
          .json({ message: `username ${user.displayName} is already taken` });
      } else {
        admin
          .auth()
          .createUser(user)
          .then(data => {
            admin
              .auth()
              .createCustomToken(data.uid)
              .then(token => {
                const credentials = {
                  uid: data.uid,
                  email: user.email,
                  created: timestamp()
                };
                admin
                  .firestore()
                  .doc(`/users/${user.displayName}`)
                  .set(credentials)
                  .then(result => {
                    response.status(201).json({ token });
                  })
                  .catch(handleError(response));
              })
              .catch(handleError(response));
          })
          .catch(error => {
            if (error.code === 'auth/email-already-exists') {
              response.status(400).json(error);
            } else {
              response.status(500).json(error);
            }
            console.error(error);
          });
      }
    })
    .catch(handleError(response));
});

export const api = functions.https.onRequest(app);
