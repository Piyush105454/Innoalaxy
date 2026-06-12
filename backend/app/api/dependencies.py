import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

security = HTTPBearer(auto_error=False)

# Store JWKS in memory (in production, use caching library with expiry)
_jwks = None

from app.core.config import get_settings

async def get_clerk_jwks():
    global _jwks
    if not _jwks:
        settings = get_settings()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.com/v1/jwks",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"} if settings.clerk_secret_key else {}
            )
            if response.status_code == 200:
                _jwks = response.json()
            else:
                print(f"Failed to fetch JWKS: {response.status_code} {response.text}")
    return _jwks

async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str | None:
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        # We fetch the public keys from Clerk
        jwks = await get_clerk_jwks()
        if not jwks:
            return None
            
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                
        if rsa_key:
            from jwt.algorithms import RSAAlgorithm
            public_key = RSAAlgorithm.from_jwk(rsa_key)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )
            return payload.get("sub")
    except Exception as e:
        print("Token decode failed:", e)
    
    return None
