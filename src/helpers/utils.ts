import { hermesConnection } from 'src/constants';

export async function getSolPriceInUSD() {
  const pricesInfo = (
    await hermesConnection.getLatestPriceUpdates([
      '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    ])
  ).parsed[0].price;

  return (
    Number(pricesInfo.price) / Math.pow(10, Math.abs(Number(pricesInfo.expo)))
  );
}
