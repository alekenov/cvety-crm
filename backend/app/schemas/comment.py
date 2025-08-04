from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.comment import AuthorType


class CommentBase(BaseModel):
    text: str


class CommentCreate(CommentBase):
    author_type: AuthorType = AuthorType.staff
    customer_name: Optional[str] = None


class CommentCreatePublic(BaseModel):
    """Schema for customer comments from public API"""
    text: str
    customer_name: str


class CommentUpdate(BaseModel):
    text: Optional[str] = None


class CommentInDBBase(CommentBase):
    id: int
    order_id: int
    user_id: Optional[int]
    author_type: AuthorType
    customer_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Comment(CommentInDBBase):
    pass


class CommentResponse(CommentInDBBase):
    user: Optional[dict] = None  # {id, name} - null for customer comments


class CommentPublic(BaseModel):
    """Public view of comment for tracking page"""
    id: int
    text: str
    author_type: AuthorType
    author_name: str  # User name or customer name
    created_at: datetime

    class Config:
        from_attributes = True


class CommentList(BaseModel):
    items: list[CommentResponse]
    total: int


class CommentListPublic(BaseModel):
    items: list[CommentPublic]
    total: int