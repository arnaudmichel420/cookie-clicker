# Cookie Clicker

## JWT Keys

Authentication uses stateless JWTs signed with an encrypted RSA private key and verified with the matching public key. The app reads the keys from file paths configured in environment variables.

Generate a local encrypted key pair:

```bash
openssl genpkey -algorithm RSA -aes256 -pass pass:"change-me" -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl rsa -pubout -in jwt-private.pem -passin pass:"change-me" -out jwt-public.pem
```

Configure `.env` with links to the key files:

```dotenv
JWT_PRIVATE_KEY_PATH=./jwt-private.pem
JWT_PRIVATE_KEY_PASSPHRASE=change-me
JWT_PUBLIC_KEY_PATH=./jwt-public.pem
```

`jwt-private.pem` and `jwt-public.pem` are ignored by Git. Keep the private key and passphrase out of the repository.

JWTs expire after 1 day.
