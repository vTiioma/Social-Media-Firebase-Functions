import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

admin.initializeApp();
const app = express();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

app.get('/', (request, response) => {
  admin
    .firestore()
    .collection('posts')
    .get()
    .then(data => {
      const posts: any[] = [];
      data.docs.forEach(post => {
        posts.push(post.data());
      });
      return response.json(posts);
    })
    .catch(error => {
      response.status(500).json(error);
      console.error(error);
    });
});

app.post('/post', (request, response) => {
  const post: any = {
    user: request.body.user,
    body: request.body.body,
    timestamp: admin.firestore.Timestamp.fromDate(new Date())
  };
  admin
    .firestore()
    .collection('posts')
    .add(post)
    .then(({ id }) =>
      response.json({ message: `Document ${id} created successfully!` })
    )
    .catch(error => {
      response.status(500).json(error);
      console.error(error);
    });
});

export const api = functions.https.onRequest(app);
