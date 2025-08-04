"""
Helper functions for generating realistic test data for Kazakhstan flower shop
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Казахстанские имена
KAZAKH_FIRST_NAMES = {
    'male': [
        'Данияр', 'Ерлан', 'Арман', 'Нурлан', 'Айдос', 'Бауржан', 'Серик',
        'Канат', 'Мурат', 'Асхат', 'Талгат', 'Жандос', 'Ержан', 'Азамат',
        'Руслан', 'Марат', 'Алмас', 'Бекзат', 'Олжас', 'Ринат'
    ],
    'female': [
        'Айгуль', 'Динара', 'Гульнара', 'Жанар', 'Айдана', 'Бахыт', 'Сауле',
        'Алия', 'Мадина', 'Айжан', 'Асель', 'Лаура', 'Жулдыз', 'Карлыгаш',
        'Нургуль', 'Салтанат', 'Балжан', 'Айнур', 'Дана', 'Инкар'
    ]
}

KAZAKH_LAST_NAMES = [
    'Касымова', 'Нурланова', 'Серикова', 'Амирова', 'Бектурова', 'Кенесова',
    'Жумабеков', 'Муратов', 'Султанова', 'Оспанов', 'Ахметова', 'Сулейменов',
    'Абдрахманов', 'Искаков', 'Токтаров', 'Байжанов', 'Калиев', 'Досымов',
    'Жаксылыков', 'Турсынов'
]

# Телефонные префиксы Казахстана
PHONE_PREFIXES = ['+7705', '+7707', '+7747', '+7701', '+7702', '+7777', '+7778']

# Адреса в Алматы
ALMATY_STREETS = [
    'пр. Достык', 'пр. Абая', 'ул. Сатпаева', 'ул. Жандосова', 'ул. Розыбакиева',
    'пр. Аль-Фараби', 'ул. Тимирязева', 'ул. Гоголя', 'ул. Фурманова', 'ул. Байтурсынова',
    'ул. Кабанбай батыра', 'ул. Желтоксан', 'пр. Назарбаева', 'ул. Толе би', 'ул. Богенбай батыра',
    'мкр. Самал', 'мкр. Коктем', 'мкр. Орбита', 'мкр. Аксай', 'мкр. Алмагуль'
]

# Организации для корпоративных клиентов
COMPANIES = [
    'ТОО "КазахТелеком"', 'АО "Казпочта"', 'Kaspi Bank', 'Halyk Bank', 'ForteBank',
    'БЦ "Нурлы Тау"', 'ТРЦ "Mega Alma-Ata"', 'Ресторан "Гакку"', 'Отель "Rixos"',
    'IT компания "EPAM"', 'Салон красоты "Айгерим"', 'Фитнес клуб "World Class"'
]

# Поставщики и фермы
SUPPLIERS = {
    'Эквадор': ['Rosaprima', 'Florecal', 'Hoja Verde', 'Naranjo Roses'],
    'Голландия': ['Dutch Flower Group', 'FleuraMetz', 'Hilverda De Boer'],
    'Кения': ['Tambuzi', 'Oserian', 'Finlays', 'Sian Roses'],
    'Казахстан': ['Алматинская оранжерея', 'Тепличный комплекс "Жана-Турмыс"']
}

# Цветы и их характеристики
FLOWERS = {
    'roses': {
        'varieties': [
            {'name': 'Red Naomi', 'color': 'красный', 'height': [50, 60, 70, 80]},
            {'name': 'Freedom', 'color': 'красный', 'height': [60, 70, 80]},
            {'name': 'Explorer', 'color': 'розовый', 'height': [50, 60, 70]},
            {'name': 'Vendela', 'color': 'белый', 'height': [50, 60, 70, 80]},
            {'name': 'Avalanche', 'color': 'белый', 'height': [60, 70, 80]},
            {'name': 'Pink Floyd', 'color': 'розовый', 'height': [60, 70]},
            {'name': 'Deep Purple', 'color': 'фиолетовый', 'height': [50, 60, 70]},
            {'name': 'Penny Lane', 'color': 'персиковый', 'height': [50, 60]},
        ],
        'category': 'Премиум розы'
    },
    'tulips': {
        'varieties': [
            {'name': 'Strong Gold', 'color': 'желтый', 'height': [35, 40, 45]},
            {'name': 'Barcelona', 'color': 'малиновый', 'height': [35, 40]},
            {'name': 'Dynasty', 'color': 'розовый', 'height': [35, 40, 45]},
            {'name': 'White Prince', 'color': 'белый', 'height': [35, 40]},
        ],
        'category': 'Тюльпаны'
    },
    'chrysanthemums': {
        'varieties': [
            {'name': 'Zembla', 'color': 'белый', 'height': [70, 80]},
            {'name': 'Anastasia', 'color': 'зеленый', 'height': [70, 80]},
            {'name': 'Bacardi', 'color': 'белый', 'height': [60, 70]},
        ],
        'category': 'Хризантемы'
    },
    'greenery': {
        'varieties': [
            {'name': 'Ruscus', 'color': 'зеленый', 'height': [60, 70]},
            {'name': 'Eucalyptus', 'color': 'зеленый', 'height': [50, 60, 70]},
            {'name': 'Pistache', 'color': 'зеленый', 'height': [60, 70, 80]},
        ],
        'category': 'Зелень'
    }
}

# Букеты и композиции
PRODUCTS = [
    {
        'name': 'Букет из 25 красных роз',
        'description': 'Классический букет из красных роз Red Naomi',
        'base_price': 25000,
        'ingredients': [('Red Naomi', 25), ('Ruscus', 5)]
    },
    {
        'name': 'Букет из 51 розы микс',
        'description': 'Роскошный букет из роз разных цветов',
        'base_price': 45000,
        'ingredients': [('Red Naomi', 17), ('Vendela', 17), ('Pink Floyd', 17), ('Eucalyptus', 10)]
    },
    {
        'name': 'Весенний микс',
        'description': 'Нежный букет из тюльпанов',
        'base_price': 15000,
        'ingredients': [('Strong Gold', 15), ('Barcelona', 10), ('Dynasty', 10)]
    },
    {
        'name': 'VIP букет 101 роза',
        'description': 'Премиальный букет для особых случаев',
        'base_price': 85000,
        'ingredients': [('Red Naomi', 101), ('Ruscus', 20), ('Eucalyptus', 15)]
    },
    {
        'name': 'Нежность',
        'description': 'Букет из белых и розовых роз',
        'base_price': 30000,
        'ingredients': [('Vendela', 15), ('Pink Floyd', 15), ('Pistache', 7)]
    },
    {
        'name': 'Солнечный день',
        'description': 'Яркий букет из желтых тюльпанов',
        'base_price': 12000,
        'ingredients': [('Strong Gold', 25)]
    },
    {
        'name': 'Белоснежка',
        'description': 'Элегантный букет из белых хризантем',
        'base_price': 20000,
        'ingredients': [('Zembla', 15), ('Anastasia', 5), ('Ruscus', 10)]
    }
]

# Поводы для заказов
ORDER_REASONS = [
    'День рождения', '8 марта', '14 февраля', 'Юбилей', 'Свадьба',
    'Выписка из роддома', 'Просто так', '1 сентября', 'Последний звонок',
    'Корпоратив', 'Извинения', 'Предложение руки и сердца'
]

# Примечания к заказам
ORDER_NOTES = [
    'Доставить к 10 утра',
    'Позвонить за час до доставки',
    'Оставить у охраны',
    'Добавить открытку',
    'Не звонить получателю - сюрприз',
    'Доставить лично в руки',
    'Срочная доставка',
    'Упаковать в крафт'
]


def generate_phone() -> str:
    """Генерирует казахстанский номер телефона"""
    prefix = random.choice(PHONE_PREFIXES)
    number = ''.join([str(random.randint(0, 9)) for _ in range(7)])
    return f"{prefix}{number}"


def generate_person(gender: str = None) -> Dict[str, str]:
    """Генерирует имя и фамилию"""
    if gender is None:
        gender = random.choice(['male', 'female'])
    
    first_name = random.choice(KAZAKH_FIRST_NAMES[gender])
    last_name = random.choice(KAZAKH_LAST_NAMES)
    
    # Корректируем окончание фамилии для мужчин
    if gender == 'male' and last_name.endswith('ова'):
        last_name = last_name[:-1]  # Убираем 'а'
    elif gender == 'male' and last_name.endswith('а'):
        last_name = last_name[:-1]  # Убираем 'а'
    
    return {
        'first_name': first_name,
        'last_name': last_name,
        'full_name': f"{first_name} {last_name}",
        'gender': gender
    }


def generate_address() -> str:
    """Генерирует адрес в Алматы"""
    street = random.choice(ALMATY_STREETS)
    
    # Для микрорайонов другой формат
    if street.startswith('мкр.'):
        building = random.randint(1, 50)
        apartment = random.randint(1, 200)
        return f"{street}, дом {building}, кв. {apartment}"
    else:
        building = random.randint(1, 200)
        office_or_apt = random.choice(['оф.', 'кв.'])
        number = random.randint(1, 500)
        return f"{street}, {building}, {office_or_apt} {number}"


def generate_company_address() -> Dict[str, str]:
    """Генерирует корпоративный адрес"""
    company = random.choice(COMPANIES)
    address = generate_address()
    return {
        'company': company,
        'address': address
    }


def generate_delivery_window(base_date: datetime = None) -> Dict[str, str]:
    """Генерирует окно доставки"""
    if base_date is None:
        # Случайная дата в ближайшие 7 дней
        base_date = datetime.now() + timedelta(days=random.randint(0, 7))
    
    # Рабочие часы: 9:00 - 21:00
    hour = random.randint(9, 19)  # Последнее окно начинается в 19:00
    
    from_time = base_date.replace(hour=hour, minute=0, second=0, microsecond=0)
    to_time = from_time + timedelta(hours=2)
    
    return {
        'from': from_time.isoformat(),
        'to': to_time.isoformat()
    }


def generate_important_date() -> Dict[str, Any]:
    """Генерирует важную дату для клиента"""
    date_types = [
        ('birthday', 'День рождения'),
        ('anniversary', 'Годовщина свадьбы'),
        ('other', '8 марта'),
        ('other', '14 февраля'),
        ('birthday', 'День рождения жены'),
        ('birthday', 'День рождения мамы')
    ]
    
    date_type, description = random.choice(date_types)
    
    # Генерируем дату в течение года
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # Упрощение, чтобы избежать проблем с количеством дней
    
    return {
        'type': date_type,
        'description': description,
        'date': f"2025-{month:02d}-{day:02d}",
        'reminder_days': random.choice([1, 3, 7])
    }


def calculate_price_kzt(cost: float, currency: str, rate: float, markup_pct: float) -> float:
    """Рассчитывает цену в тенге с учетом курса и наценки"""
    cost_kzt = cost * rate if currency != 'KZT' else cost
    price = cost_kzt * (1 + markup_pct / 100)
    return round(price, -1)  # Округляем до 10 тенге