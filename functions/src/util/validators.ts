const isValidEmail = (email: string) =>
  email.match(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )
    ? true
    : false;
const isEmpty = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === '';
const emptyFieldError = field => `${field} must not be empty`;

interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export const validateSignUp = ({ email, password, username }: SignUpData) => {
  const errors: Partial<SignUpData> = {};

  if (isEmpty(email)) {
    errors.email = emptyFieldError('email');
  } else if (isValidEmail(email) === false) {
    errors.email = 'must use a valid email address';
  }
  if (isEmpty(password)) {
    errors.password = emptyFieldError('password');
  }
  if (isEmpty(username)) {
    errors.username = emptyFieldError('username');
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

interface LogInData {
  email: string;
  password: string;
}

interface UserDetails {
  bio?: String;
  website?: String;
  location?: String;
}

export const validateLogIn = ({ email, password }: LogInData) => {
  const errors: Partial<LogInData> = {};

  if (isEmpty(email)) {
    errors.email = emptyFieldError('email');
  } else if (isValidEmail(email) === false) {
    errors.email = 'must use a valid email address';
  }
  if (isEmpty(password)) {
    errors.password = emptyFieldError('password');
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const reduceUserDetails = data => {
  const details: UserDetails = {};

  if (isEmpty(data?.bio?.trim()) === false) {
    details.bio = data.bio;
  }
  const website: string = data?.website?.trim();
  if (isEmpty(website) === false) {
    if (website.substring(0, 4) !== 'http') {
      details.website = `http://${website}`;
    } else {
      details.website = website;
    }
  }
  if (isEmpty(data?.location?.trim()) === false) {
    details.location = data.location;
  }

  return details;
};
