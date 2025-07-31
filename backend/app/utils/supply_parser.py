import re
from typing import List, Tuple, Optional
from app.schemas.supply import SupplyItemImport


class SupplyParseError(Exception):
    """Exception raised for supply parsing errors"""
    pass


def parse_supply_line(line: str) -> Optional[SupplyItemImport]:
    """
    Parse a single line of supply import text.
    Format: "Фридом 60 250 450" -> name+height price quantity
    
    Returns None if line is empty or invalid
    """
    line = line.strip()
    if not line:
        return None
    
    # Match pattern: text with spaces, then number (height), then number (price), then number (quantity)
    # Pattern explanation:
    # (.+?)     - flower name (non-greedy)
    # \s+       - one or more spaces
    # (\d+)     - height in cm
    # \s+       - one or more spaces  
    # (\d+(?:\.\d+)?) - price (integer or decimal)
    # \s+       - one or more spaces
    # (\d+)     - quantity
    pattern = r'^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+)$'
    
    match = re.match(pattern, line)
    if not match:
        raise SupplyParseError(f"Неверный формат строки: '{line}'. Ожидается: 'Название высота цена количество'")
    
    name_part = match.group(1).strip()
    height_cm = int(match.group(2))
    purchase_price = float(match.group(3))
    quantity = int(match.group(4))
    
    # Validation
    if height_cm < 10 or height_cm > 200:
        raise SupplyParseError(f"Высота должна быть от 10 до 200 см, получено: {height_cm}")
    
    if purchase_price <= 0:
        raise SupplyParseError(f"Цена должна быть больше 0, получено: {purchase_price}")
    
    if quantity <= 0:
        raise SupplyParseError(f"Количество должно быть больше 0, получено: {quantity}")
    
    return SupplyItemImport(
        flower_name=name_part,
        height_cm=height_cm,
        purchase_price=purchase_price,
        quantity=quantity
    )


def parse_supply_text(text: str) -> Tuple[List[SupplyItemImport], List[str]]:
    """
    Parse multi-line supply import text.
    
    Returns:
        Tuple of (parsed_items, errors)
    """
    lines = text.strip().split('\n')
    items = []
    errors = []
    
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        try:
            item = parse_supply_line(line)
            if item:
                items.append(item)
        except SupplyParseError as e:
            errors.append(f"Строка {line_num}: {str(e)}")
        except Exception as e:
            errors.append(f"Строка {line_num}: Неожиданная ошибка - {str(e)}")
    
    return items, errors


def calculate_retail_price(purchase_price: float, markup_percentage: float) -> float:
    """
    Calculate retail price based on purchase price and markup.
    Rounds to nearest 10 KZT.
    """
    raw_price = purchase_price * (1 + markup_percentage / 100)
    # Round to nearest 10
    return round(raw_price / 10) * 10