import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import get_settings


class RedisCache:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: Redis | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.settings.redis_url)

    def _get_client(self) -> Redis | None:
        if not self.enabled:
            return None
        if self._client is None:
            self._client = Redis.from_url(self.settings.redis_url, encoding="utf-8", decode_responses=True)
        return self._client

    async def ping(self) -> bool:
        client = self._get_client()
        if client is None:
            return False
        try:
            return bool(await client.ping())
        except Exception:
            return False

    async def get_json(self, key: str) -> Any | None:
        client = self._get_client()
        if client is None:
            return None
        try:
            payload = await client.get(key)
            return json.loads(payload) if payload else None
        except Exception:
            return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int = 180) -> None:
        client = self._get_client()
        if client is None:
            return
        try:
            await client.set(key, json.dumps(value), ex=ttl_seconds)
        except Exception:
            return

    async def delete_pattern(self, pattern: str) -> None:
        client = self._get_client()
        if client is None:
            return
        try:
            cursor = 0
            while True:
                cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    await client.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            return


cache = RedisCache()
