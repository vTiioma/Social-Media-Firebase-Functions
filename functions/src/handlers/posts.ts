import * as admin from 'firebase-admin';
import { Request as eRequest, Response } from 'express';

interface Request extends eRequest {
  user?: any;
}

const timestamp = () => admin.firestore.Timestamp.fromDate(new Date());
const handleError = (response: Response) => error => {
  response.status(500).json(error);
  console.error(error);
};

export const getAllPosts = (request: Request, response: Response) => {
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
};

export const createSinglePost = (request: Request, response: Response) => {
  const post = {
    user: request.user.user,
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
};
