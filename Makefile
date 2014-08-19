cert:
	rm -r cert/*.pem
	openssl genrsa -out cert/server-key.pem 1024
	openssl req -new -key cert/server-key.pem -out cert/server-csr.pem
	openssl x509 -req -in cert/server-csr.pem -signkey cert/server-key.pem -out cert/server-cert.pem

.PHONY: test cert
