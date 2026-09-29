import http.server, ssl, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = http.server.HTTPServer(('127.0.0.1', 8443), http.server.SimpleHTTPRequestHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain('/tmp/cld-cert.pem','/tmp/cld-key.pem')
s.socket = ctx.wrap_socket(s.socket, server_side=True)
s.serve_forever()
