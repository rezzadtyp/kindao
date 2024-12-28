import dotenv from "dotenv";

dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_TOKEN as string
}