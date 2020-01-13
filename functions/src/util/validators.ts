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
