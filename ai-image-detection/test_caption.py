"""Quick smoke-test for the /caption endpoint."""
import urllib.request
import json

BOUNDARY = "FormBoundary7MA4YWxkTrZu0gW"
URL = "http://127.0.0.1:5002/caption"


def post_image(filepath, priority=""):
    with open(filepath, "rb") as f:
        img_data = f.read()

    parts = []
    parts.append(
        (
            f"--{BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode()
        + img_data
        + b"\r\n"
    )
    parts.append(
        (
            f"--{BOUNDARY}\r\n"
            f'Content-Disposition: form-data; name="priority"\r\n\r\n'
            f"{priority}\r\n"
        ).encode()
    )
    parts.append(f"--{BOUNDARY}--\r\n".encode())

    body = b"".join(parts)
    req = urllib.request.Request(
        URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={BOUNDARY}"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


if __name__ == "__main__":
    img_path = "test_civic_image.jpg"

    print("=" * 60)
    print("TEST 1 — NORMAL priority")
    print("=" * 60)
    data = post_image(img_path, priority="")
    print(f"Domain      : {data.get('domain')}")
    print(f"Description : {data.get('description')}")
    print()
    print("Individual BLIP observations:")
    for k, v in (data.get("details") or {}).items():
        print(f"  [{k}]: {v}")

    print()
    print("=" * 60)
    print("TEST 2 — EMERGENCY priority")
    print("=" * 60)
    data2 = post_image(img_path, priority="Emergency")
    print(f"Domain      : {data2.get('domain')}")
    print(f"Description : {data2.get('description')}")
