import "dotenv/config";

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && typeof databaseUrl !== 'string') {
  throw new Error('ссылка на базу данных не указана');
}

if (!Number.isInteger(port) || port < 0 || port >= 65535) {
  throw new Error('порт должен быть в значении от 1 до 65535');
}

if (!port && typeof port !== 'number') {
  throw new Error('порт не укзаан');
}

export const env = {
  port,
  databaseUrl,
};