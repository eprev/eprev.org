# Setting up

## TODO

- [ ] Makefile (deploy build)
- [ ] 404
- [ ] Santize HTML (atom.xml)
- [ ] <a name=> for headers
- [ ] escape

## Self-Signed certificate

```
mkdir bin/ssl && openssl req \
    -newkey rsa:2048 \
    -x509 \
    -nodes \
    -keyout bin/ssl/localhost.key \
    -new \
    -out bin/ssl/localhost.crt \
    -subj /CN=localhost \
    -reqexts SAN \
    -extensions SAN \
    -config <(cat /System/Library/OpenSSL/openssl.cnf \
        <(printf '[SAN]\nsubjectAltName=DNS:localhost')) \
    -sha256 \
    -days 3650
```
