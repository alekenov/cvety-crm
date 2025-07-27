from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.crud.base import CRUDBase
from app.models.customer import Customer, CustomerAddress, CustomerImportantDate
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    def create(self, db: Session, *, obj_in: CustomerCreate) -> Customer:
        """Create customer with addresses and important dates"""
        # Import here to avoid circular imports
        from datetime import datetime
        
        # Extract nested data before creating customer
        addresses_data = obj_in.addresses
        important_dates_data = obj_in.important_dates
        
        # Create customer without nested data
        customer_data = obj_in.dict(exclude={"addresses", "important_dates"})
        db_obj = Customer(**customer_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Add addresses
        for address_data in addresses_data or []:
            address = CustomerAddress(
                customer_id=db_obj.id,
                address=address_data.address,
                label=address_data.label,
                usage_count=1,
                last_used_at=datetime.utcnow()
            )
            db.add(address)
        
        # Add important dates
        for date_data in important_dates_data or []:
            date = CustomerImportantDate(
                customer_id=db_obj.id,
                date=date_data.date,
                description=date_data.description,
                remind_days_before=date_data.remind_days_before
            )
            db.add(date)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_phone(self, db: Session, *, phone: str) -> Optional[Customer]:
        """Get customer by normalized phone number"""
        # Normalize the phone for search
        normalized_phone = self._normalize_phone(phone)
        return db.query(Customer).filter(Customer.phone == normalized_phone).first()
    
    def get_or_create(
        self,
        db: Session,
        *,
        phone: str,
        name: Optional[str] = None,
        address: Optional[str] = None
    ) -> Customer:
        """Get existing customer or create new one"""
        normalized_phone = self._normalize_phone(phone)
        
        # Check if customer exists
        customer = self.get_by_phone(db, phone=normalized_phone)
        
        if customer:
            # Update name if provided and missing
            if name and not customer.name:
                customer.name = name
                db.commit()
                db.refresh(customer)
            
            # Add address if provided and not exists
            if address:
                self._add_address_if_new(db, customer_id=customer.id, address=address)
            
            return customer
        
        # Create new customer
        customer_data = CustomerCreate(
            phone=normalized_phone,
            name=name
        )
        customer = self.create(db, obj_in=customer_data)
        
        # Add address if provided
        if address:
            self._add_address_if_new(db, customer_id=customer.id, address=address)
            db.refresh(customer)
        
        return customer
    
    def search(
        self,
        db: Session,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Customer]:
        """Search customers by phone, name, or email"""
        search_pattern = f"%{query}%"
        
        return db.query(Customer).filter(
            or_(
                Customer.phone.ilike(search_pattern),
                Customer.name.ilike(search_pattern),
                Customer.email.ilike(search_pattern)
            )
        ).offset(skip).limit(limit).all()
    
    def update_statistics(
        self,
        db: Session,
        *,
        customer_id: int
    ) -> Optional[Customer]:
        """Update customer order statistics"""
        customer = self.get(db, id=customer_id)
        if not customer:
            return None
        
        # Calculate statistics from orders
        from app.models.order import Order, OrderStatus
        
        stats = db.query(
            func.count(Order.id).label("count"),
            func.sum(Order.total).label("total"),
            func.max(Order.created_at).label("last_date")
        ).filter(
            Order.customer_id == customer_id,
            Order.status != OrderStatus.issue  # Don't count problematic orders
        ).first()
        
        customer.orders_count = stats.count or 0
        customer.total_spent = stats.total or 0
        customer.last_order_date = stats.last_date
        
        db.commit()
        db.refresh(customer)
        return customer
    
    def merge_customers(
        self,
        db: Session,
        *,
        keep_id: int,
        merge_id: int
    ) -> Optional[Customer]:
        """Merge two customers, keeping the first one"""
        if keep_id == merge_id:
            return None
        
        keep_customer = self.get(db, id=keep_id)
        merge_customer = self.get(db, id=merge_id)
        
        if not keep_customer or not merge_customer:
            return None
        
        # Update all orders to point to keep_customer
        from app.models.order import Order
        db.query(Order).filter(Order.customer_id == merge_id).update(
            {"customer_id": keep_id}
        )
        
        # Merge addresses (avoid duplicates)
        for address in merge_customer.addresses:
            exists = db.query(CustomerAddress).filter(
                CustomerAddress.customer_id == keep_id,
                CustomerAddress.address == address.address
            ).first()
            
            if not exists:
                address.customer_id = keep_id
            else:
                # Update usage count
                exists.usage_count += address.usage_count
                if address.last_used_at and (not exists.last_used_at or address.last_used_at > exists.last_used_at):
                    exists.last_used_at = address.last_used_at
        
        # Merge important dates (avoid duplicates)
        for date in merge_customer.important_dates:
            exists = db.query(CustomerImportantDate).filter(
                CustomerImportantDate.customer_id == keep_id,
                CustomerImportantDate.date == date.date,
                CustomerImportantDate.description == date.description
            ).first()
            
            if not exists:
                date.customer_id = keep_id
        
        # Merge customer info (keep non-empty values)
        if not keep_customer.name and merge_customer.name:
            keep_customer.name = merge_customer.name
        if not keep_customer.email and merge_customer.email:
            keep_customer.email = merge_customer.email
        if merge_customer.notes:
            keep_customer.notes = (keep_customer.notes or "") + "\n" + merge_customer.notes
        if merge_customer.preferences:
            keep_customer.preferences = (keep_customer.preferences or "") + "\n" + merge_customer.preferences
        
        # Delete merge customer
        db.delete(merge_customer)
        db.commit()
        
        # Update statistics
        return self.update_statistics(db, customer_id=keep_id)
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number to standard format"""
        # Remove all non-digits
        digits = ''.join(filter(str.isdigit, phone))
        
        # Handle Kazakhstan phone formats
        if digits.startswith('7') and len(digits) == 11:
            return f"+{digits}"
        elif digits.startswith('8') and len(digits) == 11:
            return f"+7{digits[1:]}"
        elif len(digits) == 10:
            return f"+7{digits}"
        
        # Return as-is if doesn't match expected format
        return phone
    
    def _add_address_if_new(
        self,
        db: Session,
        customer_id: int,
        address: str
    ) -> Optional[CustomerAddress]:
        """Add address if it doesn't exist, or update usage"""
        existing = db.query(CustomerAddress).filter(
            CustomerAddress.customer_id == customer_id,
            CustomerAddress.address == address
        ).first()
        
        if existing:
            existing.usage_count += 1
            existing.last_used_at = datetime.utcnow()
            db.commit()
            return existing
        
        # Create new address
        new_address = CustomerAddress(
            customer_id=customer_id,
            address=address,
            usage_count=1,
            last_used_at=datetime.utcnow()
        )
        db.add(new_address)
        db.commit()
        return new_address


customer = CRUDCustomer(Customer)