

from fastapi import HTTPException


class EntityDoesNotExist(HTTPException):
    def __init__(self, entityType: str) -> None:
        super().__init__(
            status_code = 400,
            detail= {
                "type": type(self).__name__,
                "reason": f"{entityType} was not found"
            }
            , headers=None)

class InvalidSender(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code= 400,
            detail={
                "type": type(self).__name__,
                "reason": f"User does not exist"
            }
            , headers=None)

class UserNotAllowed(HTTPException):
    def __init__(self, what: str = "do that") -> None:
        super().__init__(
            status_code= 400,
            detail={
                "type": type(self).__name__,
                "reason": f"User is not allowed to {what}",
                },
            headers=None
        )

class AlreadyExists(HTTPException):
    def __init__(self, what: str = "") -> None:
        super().__init__(
            status_code= 400,
            detail={
                "type": type(self).__name__,
                "reason": f"{what} already exists",
                },
            headers=None
        )

class BadParameters(HTTPException):
    def __init__(self, why: str = "") -> None:
        super().__init__(
            status_code= 400,
            detail={
                "type": type(self).__name__,
                "reason": why,
                },
            headers=None
        )





