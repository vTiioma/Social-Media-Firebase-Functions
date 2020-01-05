import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!');
});

export const getPosts = functions.https.onRequest((request, response) => {
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

export const createPost = functions.https.onRequest((request, response) => {
  if (request.method !== 'POST') {
    return response
      .status(400)
      .json({ error: `Method of type ${request.method} not allowed!` });
  }
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
