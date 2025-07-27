from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.order import Order

router = APIRouter()


@router.get("/", response_model=List[schemas.Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by phone, name or email")
) -> List[schemas.Customer]:
    """
    Retrieve customers with optional search.
    """
    if search:
        customers = crud.customer.search(db, query=search, skip=skip, limit=limit)
    else:
        customers = crud.customer.get_multi(db, skip=skip, limit=limit)
    return customers


@router.post("/", response_model=schemas.Customer)
def create_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_in: schemas.CustomerCreate
) -> schemas.Customer:
    """
    Create new customer.
    """
    # Check if customer with this phone already exists
    existing = crud.customer.get_by_phone(db, phone=customer_in.phone)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Customer with this phone number already exists"
        )
    
    customer = crud.customer.create(db=db, obj_in=customer_in)
    return customer


@router.get("/{customer_id}", response_model=schemas.Customer)
def read_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
) -> schemas.Customer:
    """
    Get customer by ID.
    """
    customer = crud.customer.get(db=db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    customer_in: schemas.CustomerUpdate,
) -> schemas.Customer:
    """
    Update a customer.
    """
    customer = crud.customer.get(db=db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if updating phone to existing one
    if customer_in.phone and customer_in.phone != customer.phone:
        existing = crud.customer.get_by_phone(db, phone=customer_in.phone)
        if existing and existing.id != customer_id:
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )
    
    customer = crud.customer.update(db=db, db_obj=customer, obj_in=customer_in)
    return customer


@router.get("/{customer_id}/orders", response_model=List[schemas.OrderResponse])
def read_customer_orders(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[schemas.OrderResponse]:
    """
    Get customer's order history.
    """
    customer = crud.customer.get(db=db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    orders = db.query(Order).filter(
        Order.customer_id == customer_id
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return [schemas.OrderResponse.model_validate(order) for order in orders]


@router.post("/{customer_id}/addresses", response_model=schemas.CustomerAddress)
def add_customer_address(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    address_in: schemas.CustomerAddressCreate
) -> schemas.CustomerAddress:
    """
    Add new address for customer.
    """
    customer = crud.customer.get(db=db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if address already exists
    from app.models.customer import CustomerAddress
    existing = db.query(CustomerAddress).filter(
        CustomerAddress.customer_id == customer_id,
        CustomerAddress.address == address_in.address
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This address already exists for the customer"
        )
    
    new_address = CustomerAddress(
        customer_id=customer_id,
        **address_in.dict()
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    
    return new_address


@router.post("/{customer_id}/important-dates", response_model=schemas.CustomerImportantDate)
def add_important_date(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
    date_in: schemas.CustomerImportantDateCreate
) -> schemas.CustomerImportantDate:
    """
    Add important date for customer.
    """
    customer = crud.customer.get(db=db, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if date already exists
    from app.models.customer import CustomerImportantDate
    existing = db.query(CustomerImportantDate).filter(
        CustomerImportantDate.customer_id == customer_id,
        CustomerImportantDate.date == date_in.date,
        CustomerImportantDate.description == date_in.description
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This important date already exists for the customer"
        )
    
    new_date = CustomerImportantDate(
        customer_id=customer_id,
        **date_in.dict()
    )
    db.add(new_date)
    db.commit()
    db.refresh(new_date)
    
    return new_date


@router.post("/merge", response_model=schemas.Customer)
def merge_customers(
    *,
    db: Session = Depends(deps.get_db),
    merge_request: schemas.CustomerMergeRequest
) -> schemas.Customer:
    """
    Merge two customers into one.
    """
    result = crud.customer.merge_customers(
        db,
        keep_id=merge_request.keep_customer_id,
        merge_id=merge_request.merge_customer_id
    )
    
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Unable to merge customers. Check that both IDs exist and are different."
        )
    
    return result


@router.post("/{customer_id}/update-stats", response_model=schemas.Customer)
def update_customer_statistics(
    *,
    db: Session = Depends(deps.get_db),
    customer_id: int,
) -> schemas.Customer:
    """
    Recalculate customer statistics from orders.
    """
    customer = crud.customer.update_statistics(db, customer_id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer