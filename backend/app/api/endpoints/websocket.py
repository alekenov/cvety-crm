"""
WebSocket endpoints for real-time communication.
"""
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.services.websocket_manager import manager
from app.core.security import verify_token_ws

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/orders/{shop_id}")
async def websocket_orders(
    websocket: WebSocket,
    shop_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db)
):
    """
    WebSocket endpoint for real-time order updates.
    
    Events:
    - order_created: New order created
    - order_updated: Order information updated
    - status_changed: Order status changed
    """
    # Verify token if provided (optional for public tracking)
    user_id = None
    if token:
        try:
            payload = verify_token_ws(token)
            user_id = payload.get("sub")
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            await websocket.close(code=1008, reason="Invalid token")
            return
    
    # Connect to WebSocket
    await manager.connect(websocket, shop_id, user_id)
    
    try:
        # Keep connection alive and handle messages
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "pong":
                # Client responded to ping
                logger.debug(f"Pong received from shop_id={shop_id}")
            elif data.get("type") == "subscribe":
                # Client wants to subscribe to specific events
                events = data.get("events", [])
                logger.info(f"Client subscribed to events: {events}")
            else:
                # Echo back unknown messages (for debugging)
                await manager.send_personal_message(
                    {"type": "echo", "data": data},
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WebSocket disconnected: shop_id={shop_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/production/{shop_id}")
async def websocket_production(
    websocket: WebSocket,
    shop_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db)
):
    """
    WebSocket endpoint for production/kanban board updates.
    
    Events:
    - task_assigned: New task assigned to florist
    - task_updated: Task status or details updated
    - task_completed: Task marked as complete
    """
    # Verify token (required for production)
    if not token:
        await websocket.close(code=1008, reason="Token required")
        return
    
    try:
        payload = verify_token_ws(token)
        user_id = payload.get("sub")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Connect to WebSocket
    await manager.connect(websocket, shop_id, user_id)
    
    try:
        # Keep connection alive and handle messages
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "pong":
                # Client responded to ping
                logger.debug(f"Pong received from production shop_id={shop_id}")
            elif data.get("type") == "task_update":
                # Florist updating task status
                task_id = data.get("task_id")
                status = data.get("status")
                
                # Update task in database (if tasks table exists)
                # For now, just log the update - task persistence can be added later
                logger.info(f"Task {task_id} updated to {status}")
                
                # Broadcast update to all connected clients
                await manager.broadcast_to_shop(shop_id, {
                    "type": "task_updated",
                    "data": {
                        "task_id": task_id,
                        "status": status,
                        "updated_by": user_id
                    }
                })
            else:
                # Echo back unknown messages
                await manager.send_personal_message(
                    {"type": "echo", "data": data},
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Production WebSocket disconnected: shop_id={shop_id}")
    except Exception as e:
        logger.error(f"Production WebSocket error: {e}")
        manager.disconnect(websocket)


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status"""
    return {
        "total_connections": manager.get_connections_count(),
        "shops_connected": len(manager.active_connections),
        "shops": {
            shop_id: {
                "connections": manager.get_connections_count(shop_id),
                "details": manager.get_shop_connections(shop_id)
            }
            for shop_id in manager.active_connections
        }
    }