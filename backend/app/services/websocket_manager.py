"""
WebSocket connection manager for real-time updates.
Handles connection lifecycle, broadcasting, and message routing.
"""
import json
import logging
from typing import Dict, List, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting"""
    
    def __init__(self):
        # Store active connections by shop_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Store connection metadata
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
        # Heartbeat tasks
        self.heartbeat_tasks: Dict[WebSocket, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, shop_id: int, user_id: Optional[int] = None):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        # Add to shop's connection list
        if shop_id not in self.active_connections:
            self.active_connections[shop_id] = []
        self.active_connections[shop_id].append(websocket)
        
        # Store connection metadata
        self.connection_info[websocket] = {
            "shop_id": shop_id,
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_ping": datetime.utcnow().isoformat()
        }
        
        # Start heartbeat task
        self.heartbeat_tasks[websocket] = asyncio.create_task(
            self._heartbeat(websocket)
        )
        
        logger.info(f"WebSocket connected: shop_id={shop_id}, user_id={user_id}")
        
        # Send welcome message
        await self.send_personal_message(
            {
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat(),
                "shop_id": shop_id
            },
            websocket
        )
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        # Get connection info
        info = self.connection_info.get(websocket)
        if not info:
            return
        
        shop_id = info["shop_id"]
        
        # Remove from active connections
        if shop_id in self.active_connections:
            if websocket in self.active_connections[shop_id]:
                self.active_connections[shop_id].remove(websocket)
            
            # Clean up empty lists
            if not self.active_connections[shop_id]:
                del self.active_connections[shop_id]
        
        # Cancel heartbeat task
        if websocket in self.heartbeat_tasks:
            self.heartbeat_tasks[websocket].cancel()
            del self.heartbeat_tasks[websocket]
        
        # Remove connection info
        del self.connection_info[websocket]
        
        logger.info(f"WebSocket disconnected: shop_id={shop_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast_to_shop(self, shop_id: int, message: dict):
        """Broadcast message to all connections in a shop"""
        if shop_id not in self.active_connections:
            return
        
        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = datetime.utcnow().isoformat()
        
        # Send to all connections in parallel
        disconnected = []
        tasks = []
        
        for connection in self.active_connections[shop_id]:
            tasks.append(self._send_with_error_handling(connection, message, disconnected))
        
        await asyncio.gather(*tasks)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)
    
    async def _send_with_error_handling(self, websocket: WebSocket, message: dict, disconnected: List):
        """Send message with error handling"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
            disconnected.append(websocket)
    
    async def broadcast_order_update(self, shop_id: int, order_data: dict):
        """Broadcast order update to shop"""
        message = {
            "type": "order_update",
            "data": order_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_shop(shop_id, message)
    
    async def broadcast_order_created(self, shop_id: int, order_data: dict):
        """Broadcast new order notification"""
        message = {
            "type": "order_created",
            "data": order_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_shop(shop_id, message)
    
    async def broadcast_status_changed(self, shop_id: int, order_id: int, old_status: str, new_status: str):
        """Broadcast order status change"""
        message = {
            "type": "status_changed",
            "data": {
                "order_id": order_id,
                "old_status": old_status,
                "new_status": new_status
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_shop(shop_id, message)
    
    async def broadcast_task_assigned(self, shop_id: int, task_data: dict):
        """Broadcast task assignment for production"""
        message = {
            "type": "task_assigned",
            "data": task_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_shop(shop_id, message)
    
    async def _heartbeat(self, websocket: WebSocket):
        """Send periodic heartbeat to keep connection alive"""
        try:
            while True:
                await asyncio.sleep(30)  # Send ping every 30 seconds
                
                # Check if connection still exists
                if websocket not in self.connection_info:
                    break
                
                # Send ping
                try:
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Update last ping time
                    self.connection_info[websocket]["last_ping"] = datetime.utcnow().isoformat()
                except:
                    # Connection failed, will be cleaned up
                    break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")
    
    def get_connections_count(self, shop_id: Optional[int] = None) -> int:
        """Get count of active connections"""
        if shop_id is not None:
            return len(self.active_connections.get(shop_id, []))
        return sum(len(conns) for conns in self.active_connections.values())
    
    def get_shop_connections(self, shop_id: int) -> List[Dict[str, Any]]:
        """Get information about all connections for a shop"""
        if shop_id not in self.active_connections:
            return []
        
        result = []
        for websocket in self.active_connections[shop_id]:
            if websocket in self.connection_info:
                result.append(self.connection_info[websocket])
        
        return result


# Global connection manager instance
manager = ConnectionManager()