from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.comment import comment as crud_comment
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentList
from app.models.shop import Shop

router = APIRouter()


@router.get("/orders/{order_id}/comments", response_model=CommentList)
def get_order_comments(
    order_id: int,
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop),  # Require auth
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """Get all comments for a specific order"""
    comments = crud_comment.get_by_order(db, order_id=order_id, skip=skip, limit=limit)
    
    # Transform to response format with user info
    items = []
    for comment in comments:
        comment_dict = {
            'id': comment.id,
            'order_id': comment.order_id,
            'user_id': comment.user_id,
            'text': comment.text,
            'created_at': comment.created_at,
            'updated_at': comment.updated_at,
            'user': {
                'id': comment.user.id,
                'name': comment.user.name
            } if comment.user else None
        }
        items.append(comment_dict)
    
    return {
        "items": items,
        "total": len(items)
    }


@router.post("/orders/{order_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    order_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop)
):
    """Create a new comment for an order"""
    # Check if order exists
    from app.crud.order import order as crud_order
    order = crud_order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_comment = crud_comment.create_for_order(
        db,
        order_id=order_id,
        user_id=1,  # TODO: Replace with actual user when user auth is implemented
        obj_in=comment_in
    )
    
    return {
        'id': db_comment.id,
        'order_id': db_comment.order_id,
        'user_id': db_comment.user_id,
        'text': db_comment.text,
        'created_at': db_comment.created_at,
        'updated_at': db_comment.updated_at,
        'user': {
            'id': 1,
            'name': "Менеджер"  # TODO: Replace with actual user when user auth is implemented
        }
    }


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_in: CommentUpdate,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop)
):
    """Update a comment (only by the author)"""
    db_comment = crud_comment.get(db, id=comment_id)
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the author
    # TODO: Implement proper user authorization
    # if db_comment.user_id != current_user.id:
    #     raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    db_comment = crud_comment.update(db, db_obj=db_comment, obj_in=comment_in)
    
    return {
        'id': db_comment.id,
        'order_id': db_comment.order_id,
        'user_id': db_comment.user_id,
        'text': db_comment.text,
        'created_at': db_comment.created_at,
        'updated_at': db_comment.updated_at,
        'user': {
            'id': 1,
            'name': "Менеджер"  # TODO: Replace with actual user when user auth is implemented
        }
    }


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(deps.get_db),
    current_shop = Depends(deps.get_current_shop)
):
    """Delete a comment (only by the author or admin)"""
    db_comment = crud_comment.get(db, id=comment_id)
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the author or admin
    # TODO: Implement proper user authorization
    # if db_comment.user_id != current_user.id and current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    crud_comment.remove(db, id=comment_id)
    
    return {"detail": "Comment deleted"}