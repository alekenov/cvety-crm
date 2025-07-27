from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models.order import Order
from app.schemas.tracking import TrackingResponse

router = APIRouter()


@router.get("/{tracking_token}", response_model=TrackingResponse)
def get_tracking_info(
    tracking_token: str,
    db: Session = Depends(deps.get_db)
):
    order = db.query(Order).filter(Order.tracking_token == tracking_token).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Tracking information not found")
    
    # Mask address for privacy
    masked_address = order.address
    if masked_address and len(masked_address) > 10:
        parts = masked_address.split()
        if len(parts) > 2:
            # Keep first and last parts, mask middle
            masked_address = f"{parts[0]} {'*' * 5} {parts[-1]}"
    
    return TrackingResponse(
        status=order.status,
        updated_at=order.updated_at,
        photos=[],  # TODO: Implement photo storage
        delivery_window=order.delivery_window,
        delivery_method=order.delivery_method,
        address=masked_address or "",
        tracking_token=tracking_token,
        views_count=1  # TODO: Implement view counting
    )