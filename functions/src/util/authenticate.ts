import * as admin from 'firebase-admin';
import { Request as eRequest, Response, NextFunction } from 'express';

interface Request extends eRequest {
  user?: any;
}

export default (request: Request, response: Response, next: NextFunction) => {
  let idToken: string;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer ')
  ) {
    idToken = request.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No token found');
    response.status(403).json({ error: 'unauthorized' });
    return;
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      request.user = decodedToken;
      return admin
        .firestore()
        .collection('users')
        .where('uid', '==', decodedToken.uid)
        .limit(1)
        .get();
    })
    .then(snapshot => {
      request.user.user = snapshot.docs[0].data().user;
      next();
    })
    .catch(error => {
      console.error('Error while verifying user', error);
      response.status(403).json(error);
      return;
    });
};
