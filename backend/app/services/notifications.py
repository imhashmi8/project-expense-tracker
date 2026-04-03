from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, User


class NotificationService:
    async def send_to_users(self, db: AsyncSession, users: list[User], *, type_: str, message: str) -> None:
        for user in users:
            db.add(Notification(user_id=user.id, type=type_, message=message))
        await db.commit()


notification_service = NotificationService()
