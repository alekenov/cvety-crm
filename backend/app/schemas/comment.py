from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class CommentBase(BaseModel):
    text: str


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    text: Optional[str] = None


class CommentInDBBase(CommentBase):
    id: int
    order_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Comment(CommentInDBBase):
    pass


class CommentResponse(CommentInDBBase):
    user: dict  # {id, name}


class CommentList(BaseModel):
    items: list[CommentResponse]
    total: int