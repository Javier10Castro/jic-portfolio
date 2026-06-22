import os, time, json, urllib.request, urllib.error
from typing import Optional, Dict, Any, Generator

class PlatformClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.platform.io/v1", timeout: int = 30, max_retries: int = 3):
        self.api_key = api_key or os.environ.get("PLATFORM_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def _request(self, method: str, path: str, data: Optional[Dict] = None) -> Dict:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json", "User-Agent": "platform-sdk-py/4.5.0"}
        url = f"{self.base_url}{path}"
        body = json.dumps(data).encode() if data else None
        for attempt in range(self.max_retries + 1):
            if attempt > 0: time.sleep(2 ** attempt * 0.1)
            try:
                req = urllib.request.Request(url, data=body, headers=headers, method=method)
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    return json.loads(resp.read().decode())
            except urllib.error.HTTPError as e:
                if attempt < self.max_retries and e.code >= 500: continue
                raise Exception(f"HTTP {e.code}: {e.reason}")
            except Exception as e:
                if attempt == self.max_retries: raise e
        return {}

    def get(self, path: str) -> Dict: return self._request("GET", path)
    def post(self, path: str, data: Dict = None) -> Dict: return self._request("POST", path, data)

    def paginate(self, path: str, limit: int = 20) -> Generator:
        offset = 0
        while True:
            result = self.get(f"{path}?limit={limit}&offset={offset}")
            items = result.get("data") or result.get("results") or []
            for item in items: yield item
            if len(items) < limit: break
            offset += limit

    @property
    def plugins(self): return type('obj', (object,), {'list': lambda: self.get('/plugins')})()
