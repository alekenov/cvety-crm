"""
Telegram Bot Integration for Cvety.kz
Complete bot implementation with order management

Requirements:
    pip install aiogram httpx python-dotenv

Environment variables:
    BOT_TOKEN - Telegram bot token
    CVETY_API_URL - API base URL
    CVETY_API_TOKEN - API authentication token (optional)
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from enum import Enum

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton,
    CallbackQuery
)
import httpx
from dotenv import load_dotenv

load_dotenv()

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN")
API_URL = os.getenv("CVETY_API_URL", "https://api.cvety.kz")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# API Client
api_client = httpx.AsyncClient(base_url=API_URL, timeout=30.0)


# ============= States =============

class OrderStates(StatesGroup):
    """FSM states for order creation"""
    waiting_for_phone = State()
    waiting_for_recipient = State()
    waiting_for_address = State()
    waiting_for_delivery_time = State()
    waiting_for_products = State()
    waiting_for_comment = State()
    confirming_order = State()


class AuthStates(StatesGroup):
    """FSM states for authentication"""
    waiting_for_phone = State()
    waiting_for_otp = State()


# ============= Database (simplified) =============

# In production, use proper database
user_tokens = {}  # user_id -> api_token
user_shops = {}   # user_id -> shop_id


# ============= API Helper Functions =============

async def api_request(method: str, endpoint: str, user_id: int = None, **kwargs) -> Optional[Dict]:
    """Make API request with authentication"""
    headers = {}
    if user_id and user_id in user_tokens:
        headers["Authorization"] = f"Bearer {user_tokens[user_id]}"
    
    try:
        response = await api_client.request(method, endpoint, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json() if response.content else {}
    except httpx.HTTPError as e:
        logger.error(f"API request failed: {e}")
        return None


async def authenticate_user(phone: str, otp: str, user_id: int) -> bool:
    """Authenticate user and store token"""
    result = await api_request("POST", "/api/auth/verify-otp", json={
        "phone": phone,
        "otp_code": otp
    })
    
    if result and "access_token" in result:
        user_tokens[user_id] = result["access_token"]
        user_shops[user_id] = result.get("shop_id")
        return True
    return False


# ============= Keyboards =============

def get_main_keyboard() -> ReplyKeyboardMarkup:
    """Main menu keyboard"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📦 Мои заказы"), KeyboardButton(text="➕ Новый заказ")],
            [KeyboardButton(text="📍 Отследить заказ"), KeyboardButton(text="📊 Статистика")],
            [KeyboardButton(text="🌷 Товары"), KeyboardButton(text="👥 Клиенты")],
            [KeyboardButton(text="⚙️ Настройки"), KeyboardButton(text="❓ Помощь")]
        ],
        resize_keyboard=True
    )


def get_order_status_keyboard(order_id: int) -> InlineKeyboardMarkup:
    """Order status change keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Оплачен", callback_data=f"status_{order_id}_paid"),
            InlineKeyboardButton(text="📦 Собран", callback_data=f"status_{order_id}_assembled")
        ],
        [
            InlineKeyboardButton(text="🚚 В доставке", callback_data=f"status_{order_id}_delivery"),
            InlineKeyboardButton(text="✔️ Доставлен", callback_data=f"status_{order_id}_delivered")
        ],
        [
            InlineKeyboardButton(text="❌ Проблема", callback_data=f"issue_{order_id}"),
            InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_orders")
        ]
    ])


def get_products_keyboard() -> InlineKeyboardMarkup:
    """Product selection keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🌹 Розы", callback_data="product_roses"),
            InlineKeyboardButton(text="🌷 Тюльпаны", callback_data="product_tulips")
        ],
        [
            InlineKeyboardButton(text="💐 Микс букет", callback_data="product_mix"),
            InlineKeyboardButton(text="🎁 С подарком", callback_data="product_gift")
        ],
        [InlineKeyboardButton(text="✅ Готово", callback_data="products_done")]
    ])


# ============= Command Handlers =============

@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    """Start command handler"""
    await state.clear()
    
    user_id = message.from_user.id
    if user_id not in user_tokens:
        # Need authentication
        await message.answer(
            "🌸 Добро пожаловать в Cvety.kz Bot!\n\n"
            "Для начала работы необходимо авторизоваться.\n"
            "Введите ваш номер телефона в формате +7XXXXXXXXXX:",
            reply_markup=types.ReplyKeyboardRemove()
        )
        await state.set_state(AuthStates.waiting_for_phone)
    else:
        # Already authenticated
        await message.answer(
            "🌸 С возвращением в Cvety.kz Bot!\n\n"
            "Выберите действие:",
            reply_markup=get_main_keyboard()
        )


@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Help command handler"""
    help_text = """
📚 **Помощь по боту Cvety.kz**

**Основные команды:**
/start - Начать работу
/orders - Мои заказы
/new_order - Создать заказ
/track - Отследить заказ
/products - Каталог товаров
/stats - Статистика
/help - Эта справка

**Функции:**
• 📦 Управление заказами
• 📍 Отслеживание доставки
• 🌷 Просмотр каталога
• 👥 База клиентов
• 📊 Статистика продаж
• 🔔 Уведомления о заказах

**Поддержка:** @cvety_kz_support
    """
    await message.answer(help_text, parse_mode="Markdown")


# ============= Authentication Flow =============

@dp.message(StateFilter(AuthStates.waiting_for_phone))
async def auth_phone_handler(message: types.Message, state: FSMContext):
    """Handle phone number input for authentication"""
    phone = message.text.strip()
    
    # Validate phone format
    if not phone.startswith("+7") or len(phone) != 12:
        await message.answer("❌ Неверный формат номера. Введите в формате +7XXXXXXXXXX")
        return
    
    # Request OTP
    result = await api_request("POST", "/api/auth/request-otp", json={"phone": phone})
    
    if result:
        await state.update_data(phone=phone)
        await message.answer(
            "✅ Код отправлен!\n"
            "Введите 6-значный код из сообщения:"
        )
        await state.set_state(AuthStates.waiting_for_otp)
    else:
        await message.answer("❌ Ошибка отправки кода. Попробуйте позже.")


@dp.message(StateFilter(AuthStates.waiting_for_otp))
async def auth_otp_handler(message: types.Message, state: FSMContext):
    """Handle OTP code input"""
    otp = message.text.strip()
    
    if len(otp) != 6 or not otp.isdigit():
        await message.answer("❌ Код должен состоять из 6 цифр")
        return
    
    data = await state.get_data()
    phone = data.get("phone")
    
    # Authenticate
    if await authenticate_user(phone, otp, message.from_user.id):
        await message.answer(
            "✅ Авторизация успешна!\n\n"
            "Теперь вы можете использовать все функции бота.",
            reply_markup=get_main_keyboard()
        )
        await state.clear()
    else:
        await message.answer("❌ Неверный код. Попробуйте еще раз.")


# ============= Orders Management =============

@dp.message(F.text == "📦 Мои заказы")
@dp.message(Command("orders"))
async def show_orders(message: types.Message):
    """Show user's orders"""
    user_id = message.from_user.id
    
    if user_id not in user_tokens:
        await message.answer("❌ Необходима авторизация. Используйте /start")
        return
    
    # Get orders from API
    result = await api_request("GET", "/api/orders/", user_id, params={"limit": 10})
    
    if not result or not result.get("items"):
        await message.answer("У вас пока нет заказов")
        return
    
    orders_text = "📦 **Ваши последние заказы:**\n\n"
    
    for order in result["items"][:5]:
        status_emoji = {
            "new": "🆕",
            "paid": "💳",
            "assembled": "📦",
            "delivery": "🚚",
            "delivered": "✅",
            "issue": "❌"
        }.get(order["status"], "❓")
        
        orders_text += (
            f"{status_emoji} **Заказ #{order['id']}**\n"
            f"Статус: {order.get('status_display', order['status'])}\n"
            f"Сумма: {order['total']} ₸\n"
            f"Получатель: {order.get('recipient_name', 'Не указан')}\n"
            f"Отслеживание: /track_{order['tracking_token']}\n"
            f"Управление: /order_{order['id']}\n\n"
        )
    
    await message.answer(orders_text, parse_mode="Markdown")


@dp.message(F.text.startswith("/order_"))
async def show_order_details(message: types.Message):
    """Show single order details"""
    user_id = message.from_user.id
    
    if user_id not in user_tokens:
        await message.answer("❌ Необходима авторизация")
        return
    
    try:
        order_id = int(message.text.split("_")[1])
    except (IndexError, ValueError):
        await message.answer("❌ Неверный формат команды")
        return
    
    # Get order details
    result = await api_request("GET", f"/api/orders/{order_id}", user_id)
    
    if not result:
        await message.answer("❌ Заказ не найден")
        return
    
    order = result
    details_text = (
        f"📦 **Заказ #{order['id']}**\n\n"
        f"**Статус:** {order.get('status_display', order['status'])}\n"
        f"**Создан:** {order['created_at']}\n"
        f"**Клиент:** {order['customer_phone']}\n"
        f"**Получатель:** {order.get('recipient_name', 'Не указан')}\n"
        f"**Адрес:** {order.get('address', 'Не указан')}\n"
        f"**Доставка:** {order.get('delivery_method', 'Не указан')}\n"
        f"**Сумма:** {order['total']} ₸\n"
        f"**Отслеживание:** {order['tracking_token']}\n"
    )
    
    if order.get("comment"):
        details_text += f"**Комментарий:** {order['comment']}\n"
    
    if order.get("items"):
        details_text += "\n**Состав заказа:**\n"
        for item in order["items"]:
            details_text += f"• {item['product_name']} x{item['quantity']} - {item['total']} ₸\n"
    
    await message.answer(
        details_text,
        parse_mode="Markdown",
        reply_markup=get_order_status_keyboard(order_id)
    )


# ============= Order Creation Flow =============

@dp.message(F.text == "➕ Новый заказ")
@dp.message(Command("new_order"))
async def start_new_order(message: types.Message, state: FSMContext):
    """Start new order creation"""
    user_id = message.from_user.id
    
    if user_id not in user_tokens:
        await message.answer("❌ Необходима авторизация")
        return
    
    await message.answer(
        "📱 Введите номер телефона клиента:\n"
        "(формат: +7XXXXXXXXXX)",
        reply_markup=types.ReplyKeyboardRemove()
    )
    await state.set_state(OrderStates.waiting_for_phone)


@dp.message(StateFilter(OrderStates.waiting_for_phone))
async def order_phone_handler(message: types.Message, state: FSMContext):
    """Handle customer phone input"""
    phone = message.text.strip()
    
    if not phone.startswith("+7") or len(phone) != 12:
        await message.answer("❌ Неверный формат. Используйте +7XXXXXXXXXX")
        return
    
    await state.update_data(customer_phone=phone)
    await message.answer("👤 Введите имя получателя:")
    await state.set_state(OrderStates.waiting_for_recipient)


@dp.message(StateFilter(OrderStates.waiting_for_recipient))
async def order_recipient_handler(message: types.Message, state: FSMContext):
    """Handle recipient name input"""
    await state.update_data(recipient_name=message.text)
    await message.answer("📍 Введите адрес доставки:")
    await state.set_state(OrderStates.waiting_for_address)


@dp.message(StateFilter(OrderStates.waiting_for_address))
async def order_address_handler(message: types.Message, state: FSMContext):
    """Handle address input"""
    await state.update_data(address=message.text)
    await message.answer(
        "⏰ Укажите желаемое время доставки:\n"
        "(например: 14:00-16:00 или 'Завтра вечером')"
    )
    await state.set_state(OrderStates.waiting_for_delivery_time)


@dp.message(StateFilter(OrderStates.waiting_for_delivery_time))
async def order_delivery_time_handler(message: types.Message, state: FSMContext):
    """Handle delivery time input"""
    await state.update_data(delivery_time=message.text)
    await message.answer(
        "🌷 Выберите товары для заказа:",
        reply_markup=get_products_keyboard()
    )
    await state.update_data(selected_products=[])
    await state.set_state(OrderStates.waiting_for_products)


@dp.callback_query(StateFilter(OrderStates.waiting_for_products), F.data.startswith("product_"))
async def product_selection_handler(callback: CallbackQuery, state: FSMContext):
    """Handle product selection"""
    product = callback.data.split("_")[1]
    data = await state.get_data()
    selected = data.get("selected_products", [])
    
    # Simplified product mapping
    product_map = {
        "roses": {"name": "Букет роз", "price": 25000},
        "tulips": {"name": "Букет тюльпанов", "price": 15000},
        "mix": {"name": "Микс букет", "price": 20000},
        "gift": {"name": "Букет с подарком", "price": 30000}
    }
    
    if product in product_map:
        selected.append(product_map[product])
        await state.update_data(selected_products=selected)
        await callback.answer(f"✅ Добавлено: {product_map[product]['name']}")


@dp.callback_query(StateFilter(OrderStates.waiting_for_products), F.data == "products_done")
async def products_done_handler(callback: CallbackQuery, state: FSMContext):
    """Finish product selection"""
    data = await state.get_data()
    
    if not data.get("selected_products"):
        await callback.answer("❌ Выберите хотя бы один товар", show_alert=True)
        return
    
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.answer("💬 Добавьте комментарий к заказу (или отправьте '-' чтобы пропустить):")
    await state.set_state(OrderStates.waiting_for_comment)


@dp.message(StateFilter(OrderStates.waiting_for_comment))
async def order_comment_handler(message: types.Message, state: FSMContext):
    """Handle order comment"""
    comment = None if message.text == "-" else message.text
    await state.update_data(comment=comment)
    
    # Show order summary
    data = await state.get_data()
    products = data.get("selected_products", [])
    flower_sum = sum(p["price"] for p in products)
    delivery_fee = 2000
    total = flower_sum + delivery_fee
    
    summary = (
        "📋 **Подтверждение заказа:**\n\n"
        f"**Клиент:** {data['customer_phone']}\n"
        f"**Получатель:** {data['recipient_name']}\n"
        f"**Адрес:** {data['address']}\n"
        f"**Время:** {data['delivery_time']}\n\n"
        "**Товары:**\n"
    )
    
    for product in products:
        summary += f"• {product['name']} - {product['price']} ₸\n"
    
    summary += (
        f"\n**Доставка:** {delivery_fee} ₸\n"
        f"**Итого:** {total} ₸\n"
    )
    
    if comment:
        summary += f"\n**Комментарий:** {comment}"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Подтвердить", callback_data="confirm_order"),
            InlineKeyboardButton(text="❌ Отменить", callback_data="cancel_order")
        ]
    ])
    
    await message.answer(summary, parse_mode="Markdown", reply_markup=keyboard)
    await state.update_data(flower_sum=flower_sum, delivery_fee=delivery_fee, total=total)
    await state.set_state(OrderStates.confirming_order)


@dp.callback_query(StateFilter(OrderStates.confirming_order), F.data == "confirm_order")
async def confirm_order_handler(callback: CallbackQuery, state: FSMContext):
    """Confirm and create order"""
    user_id = callback.from_user.id
    data = await state.get_data()
    
    # Prepare order data
    order_data = {
        "customer_phone": data["customer_phone"],
        "recipient_name": data["recipient_name"],
        "address": data["address"],
        "delivery_method": "delivery",
        "flower_sum": data["flower_sum"],
        "delivery_fee": data["delivery_fee"],
        "total": data["total"],
        "comment": data.get("comment")
    }
    
    # Create order via API
    result = await api_request("POST", "/api/orders/", user_id, json=order_data)
    
    if result:
        await callback.message.edit_reply_markup(reply_markup=None)
        await callback.message.answer(
            f"✅ **Заказ создан!**\n\n"
            f"Номер заказа: #{result['id']}\n"
            f"Отслеживание: {result['tracking_token']}\n\n"
            f"Ссылка для клиента:\n"
            f"https://cvety.kz/tracking/{result['tracking_token']}",
            parse_mode="Markdown",
            reply_markup=get_main_keyboard()
        )
    else:
        await callback.answer("❌ Ошибка создания заказа", show_alert=True)
    
    await state.clear()


@dp.callback_query(StateFilter(OrderStates.confirming_order), F.data == "cancel_order")
async def cancel_order_handler(callback: CallbackQuery, state: FSMContext):
    """Cancel order creation"""
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.answer("❌ Создание заказа отменено", reply_markup=get_main_keyboard())
    await state.clear()


# ============= Order Status Management =============

@dp.callback_query(F.data.startswith("status_"))
async def change_order_status(callback: CallbackQuery):
    """Handle order status change"""
    user_id = callback.from_user.id
    
    if user_id not in user_tokens:
        await callback.answer("❌ Необходима авторизация", show_alert=True)
        return
    
    parts = callback.data.split("_")
    order_id = int(parts[1])
    new_status = parts[2]
    
    # Update status via API
    result = await api_request(
        "PATCH",
        f"/api/orders/{order_id}/status",
        user_id,
        json={"status": new_status}
    )
    
    if result:
        await callback.answer(f"✅ Статус изменен на: {new_status}")
        await callback.message.edit_text(
            callback.message.text + f"\n\n✅ _Статус обновлен: {new_status}_",
            parse_mode="Markdown",
            reply_markup=get_order_status_keyboard(order_id)
        )
    else:
        await callback.answer("❌ Ошибка изменения статуса", show_alert=True)


# ============= Order Tracking =============

@dp.message(F.text == "📍 Отследить заказ")
@dp.message(Command("track"))
async def track_order_start(message: types.Message, state: FSMContext):
    """Start order tracking"""
    await message.answer(
        "🔍 Введите номер отслеживания (9 цифр):",
        reply_markup=types.ReplyKeyboardRemove()
    )
    await state.set_state("tracking")


@dp.message(StateFilter("tracking"))
@dp.message(F.text.startswith("/track_"))
async def track_order_handler(message: types.Message, state: FSMContext):
    """Handle tracking token input"""
    if message.text.startswith("/track_"):
        token = message.text.split("_")[1]
    else:
        token = message.text.strip()
    
    # Public API - no auth needed
    result = await api_request("GET", f"/api/tracking/{token}")
    
    if result:
        status_emoji = {
            "new": "🆕",
            "paid": "💳",
            "assembled": "📦",
            "delivery": "🚚",
            "delivered": "✅",
            "issue": "❌"
        }.get(result["status"], "❓")
        
        tracking_text = (
            f"📍 **Отслеживание заказа**\n\n"
            f"**Номер:** {token}\n"
            f"**Статус:** {status_emoji} {result.get('status_display', result['status'])}\n"
            f"**Обновлено:** {result['updated_at']}\n"
        )
        
        if result.get("delivery_window"):
            tracking_text += (
                f"**Доставка:** {result['delivery_window']['from']} - "
                f"{result['delivery_window']['to']}\n"
            )
        
        if result.get("address_masked"):
            tracking_text += f"**Адрес:** {result['address_masked']}\n"
        
        if result.get("courier"):
            tracking_text += f"**Курьер:** {result['courier']['name']}\n"
        
        await message.answer(tracking_text, parse_mode="Markdown", reply_markup=get_main_keyboard())
    else:
        await message.answer(
            "❌ Заказ не найден. Проверьте номер отслеживания.",
            reply_markup=get_main_keyboard()
        )
    
    await state.clear()


# ============= Statistics =============

@dp.message(F.text == "📊 Статистика")
async def show_statistics(message: types.Message):
    """Show shop statistics"""
    user_id = message.from_user.id
    
    if user_id not in user_tokens:
        await message.answer("❌ Необходима авторизация")
        return
    
    # Get orders statistics
    orders = await api_request("GET", "/api/orders/", user_id, params={"limit": 100})
    
    if not orders:
        await message.answer("❌ Не удалось получить статистику")
        return
    
    # Calculate statistics
    total_orders = orders.get("total", 0)
    items = orders.get("items", [])
    
    if items:
        total_revenue = sum(order.get("total", 0) for order in items)
        avg_order = total_revenue // len(items) if items else 0
        
        # Status breakdown
        status_counts = {}
        for order in items:
            status = order.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        stats_text = (
            "📊 **Статистика магазина**\n\n"
            f"**Всего заказов:** {total_orders}\n"
            f"**Общая выручка:** {total_revenue:,} ₸\n"
            f"**Средний чек:** {avg_order:,} ₸\n\n"
            "**По статусам:**\n"
        )
        
        for status, count in status_counts.items():
            stats_text += f"• {status}: {count}\n"
    else:
        stats_text = "📊 Пока нет данных для статистики"
    
    await message.answer(stats_text, parse_mode="Markdown")


# ============= Error Handler =============

@dp.errors()
async def error_handler(update: types.Update, exception: Exception):
    """Global error handler"""
    logger.error(f"Error handling update {update}: {exception}")
    return True


# ============= Main =============

async def main():
    """Main bot function"""
    logger.info("Starting Cvety.kz Bot...")
    
    # Start polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())