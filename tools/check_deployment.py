#!/usr/bin/env python3
"""
Post-deployment smoke test for the Northbound Logistics site.

Usage:
    python tools/check_deployment.py https://sahil080805.github.io/northbound-logistics/
    python tools/check_deployment.py http://localhost:8000/        # also works locally

Checks that every page, stylesheet, script, key image, sitemap and robots.txt
loads (HTTP 200) with the right content type, that each HTML page has a <title>
and meta description, that nothing points at localhost, and that a missing page
returns a real 404. Exits with a non-zero code if anything fails.
"""
import re
import sys
import time
import urllib.error
import urllib.request

PAGES = ["", "services.html", "fleet.html", "tracking.html", "quote.html", "about.html", "contact.html", "privacy.html"]
ASSETS = {
    "css/styles.css": "text/css", "js/config.js": "javascript", "js/main.js": "javascript", "js/forms.js": "javascript",
    "js/tracking.js": "javascript", "assets/icons/favicon.svg": "image/svg", "assets/img/hero-1600.webp": "image/webp",
    "assets/img/hero-800.jpg": "image/jpeg", "assets/img/road-800.webp": "image/webp", "robots.txt": "text/plain", "sitemap.xml": "xml",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "nb-deploy-check/1.0"})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.headers.get("Content-Type", ""), r.read(), time.time() - start
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", ""), b"", time.time() - start
    except Exception as e:  # network / DNS / TLS problems
        return 0, str(e), b"", time.time() - start


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    base = sys.argv[1].rstrip("/") + "/"
    failures = 0

    def report(ok, label, detail=""):
        nonlocal failures
        failures += 0 if ok else 1
        print(f"  {'PASS' if ok else 'FAIL'}  {label}" + (f"  ({detail})" if detail else ""))

    print(f"Checking {base}\n\nPages")
    for p in PAGES:
        status, ctype, body, secs = fetch(base + p)
        html = body.decode("utf-8", "ignore")
        ok = status == 200 and "text/html" in ctype
        report(ok, p or "index.html (home)", f"HTTP {status}, {secs*1000:.0f} ms")
        if ok:
            report(bool(re.search(r"<title>[^<]{5,}</title>", html)), "  has <title>")
            report('name="description"' in html, "  has meta description")
            report("localhost" not in html and "127.0.0.1" not in html, "  no localhost links")

    print("\nAssets")
    for path, kind in ASSETS.items():
        status, ctype, body, secs = fetch(base + path)
        report(status == 200 and kind in ctype.lower() and len(body) > 0, path, f"HTTP {status}, {ctype.split(';')[0]}, {len(body)/1024:.0f} KB")

    print("\nError handling")
    status, _, _, _ = fetch(base + "this-page-does-not-exist.html")
    report(status == 404, "missing page returns 404", f"HTTP {status}")

    if base.startswith("http://") and "localhost" not in base and "127.0.0.1" not in base:
        report(False, "site is served over HTTPS", "use https:// for a live site")

    print(f"\n{'ALL CHECKS PASSED' if failures == 0 else str(failures) + ' CHECK(S) FAILED'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
