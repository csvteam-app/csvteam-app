import urllib.request
import base64
import json

url = "https://csvteam.net/wp-json/wp/v2/users/me"
user = "danielecsv"
password = "CSVDroop200!"

credentials = f"{user}:{password}"
token = base64.b64encode(credentials.encode()).decode('utf-8')
headers = {
    'Authorization': f'Basic {token}',
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Text:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
