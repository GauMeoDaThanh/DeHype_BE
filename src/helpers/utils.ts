import { hermesConnection, program, SOLANA_DECIMALS } from 'src/constants';

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

export async function getBettingAccounts() {
  const bettingAccounts: any = await program.account.bettingAccount.all();
  const decryptBettingAccounts = bettingAccounts.map((account) => {
    return {
      ...account.account,
      tokens: account.account.tokens / SOLANA_DECIMALS,
      createTime: new Date(account.account.createTime.toNumber() * 1000),
    };
  });
  return decryptBettingAccounts;
}
