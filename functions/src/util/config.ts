import * as functions from 'firebase-functions';

const firebaseConfig = functions.config().fire;

export const apiKey: string = firebaseConfig.apikey;
export const authDomain: string = firebaseConfig.authDomain;
export const databaseURL: string = firebaseConfig.databaseurl;
export const projectId: string = firebaseConfig.projectid;
export const storageBucket: string = firebaseConfig.storagebucket;
export const messagingSenderId: string = firebaseConfig.messagesenderid;
export const appId: string = firebaseConfig.appid;
export const measurementId: string = firebaseConfig.measurementid;
