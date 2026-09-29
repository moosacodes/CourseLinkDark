Headless sanity test (optional, not part of the extension).
Serves test.html as https://courselink.uoguelph.ca:8443 (host mapped to 127.0.0.1)
and loads the unpacked extension into headless Chrome via CDP (--remote-debugging-pipe
+ Extensions.loadUnpacked, since branded Chrome ignores --load-extension).

  openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/cld-key.pem -out /tmp/cld-cert.pem -days 2 -subj "/CN=courselink.uoguelph.ca"
  python3 serve.py &        # https on 127.0.0.1:8443
  rm -rf /tmp/cld-test-profile && node run.js

Prints computed colours for light DOM, shadow DOM (incl. nested, late-upgraded and
detached-then-attached hosts), media, and the live popup on/off toggle.
