// Number -> port
// String -> unix socket
export const PORT = process.env.PORT || 8080;

// Only used if PORT is unix socket
export const UNIX_SOCKET_PERMISSIONS = 0o777;

export const READONLY_ORIGINS = '*';

export const SUBMISSION_ORIGINS = [
    'https://sailfish-studio.org',
    'https://experiments.sailfish-studio.org',
    'https://staging.sailfish-studio.org',
    'https://mirror.sailfish-studio.xyz'
];
