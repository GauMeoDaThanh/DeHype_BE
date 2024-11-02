const { Connection, PublicKey } = require("@solana/web3.js");
const RPC_URL = "https://omniscient-proud-shape.solana-mainnet.quiknode.pro/51cfeeb0c4f9a26b27bb48201072aed7b9abb312";

async function getTransactionActivity(programId) {
    const connection = new Connection(RPC_URL, "confirmed");
    const programAddress = new PublicKey(programId);
    const transactionSignatures = await connection.getSignaturesForAddress(programAddress);

    let timeBuckets = {};

    for (let tx of transactionSignatures) {
        const txInfo = await connection.getParsedConfirmedTransaction(tx.signature);
        if (txInfo) {
            const timestamp = txInfo.blockTime * 1000; // Convert to milliseconds
            const date = new Date(timestamp);
            // Format the date to include hours as well, e.g., "dd/mm/yyyy HH:00"
            const dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:00`;

            if (!timeBuckets[dateString]) timeBuckets[dateString] = 0;
            timeBuckets[dateString]++;
        }
    }

    console.log(timeBuckets); // This will show transaction counts per hour
}

getTransactionActivity("HVdfohHjp1kZwxn123Cxv3GDeXeXnLM1RAXaF8dPYBdS");
